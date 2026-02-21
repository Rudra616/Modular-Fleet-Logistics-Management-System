"""
Fleet Management System - API Views
=====================================
All API endpoints with role-based access control.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import Driver  # Add this import

from .models import Vehicle, Driver, Trip, FuelLog, Maintenance, Expense
from .Serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer, UserCreateSerializer, ChangePasswordSerializer,
    VehicleListSerializer, VehicleDetailSerializer,
    DriverListSerializer, DriverDetailSerializer,
    TripListSerializer, TripDetailSerializer, TripCreateSerializer,
    FuelLogSerializer, MaintenanceSerializer, ExpenseSerializer,
    DashboardSerializer,
)
from .Permissions import (
    IsManager, IsManagerOrDispatcher, IsManagerOrSafetyOfficer,
    IsAnalystOrManager, IsManagerOrReadOnly,
)



User = get_user_model()


# ═══════════════════════════════════════════════════════
# 1. AUTHENTICATION VIEWS
# ═══════════════════════════════════════════════════════

class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }
    Returns: { access, refresh, user: { role, name, ... } }
    """
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: { "refresh": "<refresh_token>" }
    Blacklists the refresh token (user is logged out).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns: current logged-in user's profile
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Body: { "old_password": "...", "new_password": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password changed successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════
# 2. USER MANAGEMENT (Manager only)
# ═══════════════════════════════════════════════════════

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD for system users.
    GET    /api/users/          → list all users
    POST   /api/users/          → create user
    GET    /api/users/{id}/     → user detail
    PUT    /api/users/{id}/     → update user
    DELETE /api/users/{id}/     → delete user
    """
    queryset           = User.objects.all().order_by('-date_joined')
    permission_classes = [IsManager]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['username', 'first_name', 'last_name', 'email', 'role']
    ordering_fields    = ['date_joined', 'role', 'username']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer


# ═══════════════════════════════════════════════════════
# 3. VEHICLE MANAGEMENT
# ═══════════════════════════════════════════════════════

class VehicleViewSet(viewsets.ModelViewSet):
    """
    Full vehicle CRUD with status management.
    ROLES: Manager (full) | Dispatcher (read + dispatch actions)
    """
    queryset           = Vehicle.objects.all()
    permission_classes = [IsManagerOrDispatcher]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'vehicle_type']
    search_fields      = ['license_plate', 'make', 'model']
    ordering_fields    = ['license_plate', 'odometer_km', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        return VehicleDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Dispatchers don't see retired or in-shop vehicles in the main list
        if self.request.user.is_dispatcher and self.action == 'list':
            qs = qs.exclude(status__in=['retired', 'in_shop'])
        return qs

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        """GET /api/vehicles/available/ — List only available vehicles."""
        vehicles = Vehicle.objects.filter(status='available')
        serializer = VehicleListSerializer(vehicles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='retire',
            permission_classes=[IsManager])
    def retire(self, request, pk=None):
        """POST /api/vehicles/{id}/retire/ — Permanently retire a vehicle."""
        vehicle = self.get_object()
        if vehicle.status == 'on_trip':
            return Response({"error": "Cannot retire a vehicle currently on a trip."},
                            status=status.HTTP_400_BAD_REQUEST)
        vehicle.status = 'retired'
        vehicle.save()
        return Response({"message": f"Vehicle {vehicle.license_plate} has been retired."})

    @action(detail=True, methods=['get'], url_path='roi',
            permission_classes=[IsAnalystOrManager])
    def roi_report(self, request, pk=None):
        """GET /api/vehicles/{id}/roi/ — Vehicle ROI report."""
        vehicle = self.get_object()
        return Response({
            'vehicle':                vehicle.license_plate,
            'acquisition_cost':       vehicle.acquisition_cost,
            'total_revenue':          vehicle.total_revenue,
            'total_fuel_cost':        vehicle.total_fuel_cost,
            'total_maintenance_cost': vehicle.total_maintenance_cost,
            'total_operational_cost': vehicle.total_operational_cost,
            'net_profit':             float(vehicle.total_revenue) - vehicle.total_operational_cost,
            'roi_percent':            vehicle.roi,
        })


# ═══════════════════════════════════════════════════════
# 4. DRIVER MANAGEMENT
# ═══════════════════════════════════════════════════════

class DriverViewSet(viewsets.ModelViewSet):
    """
    Driver CRUD + compliance management.
    ROLES: Manager/Safety Officer (full) | Dispatcher (read only)
    """
    queryset           = Driver.objects.all()
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status']
    search_fields      = ['first_name', 'last_name', 'license_number', 'phone']
    ordering_fields    = ['last_name', 'status', 'license_expiry']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsManagerOrSafetyOfficer()]

    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        return DriverDetailSerializer

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        """GET /api/drivers/available/ — Non-expired, off-duty drivers."""
        from datetime import date
        drivers = Driver.objects.filter(
            status='off_duty',
            license_expiry__gte=date.today()
        )
        serializer = DriverListSerializer(drivers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='compliance-alerts',
            permission_classes=[IsManagerOrSafetyOfficer])
    def compliance_alerts(self, request):
        """GET /api/drivers/compliance-alerts/ — Expired/expiring soon/suspended."""
        from datetime import date, timedelta
        today      = date.today()
        soon       = today + timedelta(days=30)

        expired    = Driver.objects.filter(license_expiry__lt=today)
        expiring   = Driver.objects.filter(license_expiry__range=[today, soon])
        suspended  = Driver.objects.filter(status='suspended')

        return Response({
            'expired_license':        DriverListSerializer(expired,   many=True).data,
            'expiring_within_30_days': DriverListSerializer(expiring, many=True).data,
            'suspended':              DriverListSerializer(suspended, many=True).data,
        })

    @action(detail=True, methods=['post'], url_path='suspend',
            permission_classes=[IsManagerOrSafetyOfficer])
    def suspend(self, request, pk=None):
        """POST /api/drivers/{id}/suspend/"""
        driver = self.get_object()
        if driver.status == 'on_duty':
            return Response({"error": "Cannot suspend a driver currently on duty."},
                            status=status.HTTP_400_BAD_REQUEST)
        driver.status = 'suspended'
        driver.save()
        return Response({"message": f"Driver {driver.full_name} has been suspended."})

    @action(detail=True, methods=['post'], url_path='reinstate',
            permission_classes=[IsManagerOrSafetyOfficer])
    def reinstate(self, request, pk=None):
        """POST /api/drivers/{id}/reinstate/"""
        driver = self.get_object()
        driver.status = 'off_duty'
        driver.save()
        return Response({"message": f"Driver {driver.full_name} has been reinstated."})


# ═══════════════════════════════════════════════════════
# 5. TRIP MANAGEMENT
# ═══════════════════════════════════════════════════════

# 5. TRIP MANAGEMENT - FIXED VERSION
# ═══════════════════════════════════════════════════════

class TripViewSet(viewsets.ModelViewSet):
    """
    Trip lifecycle management: Draft → Dispatched → Completed/Cancelled
    Auto-updates vehicle & driver status.
    """
    queryset           = Trip.objects.select_related('vehicle', 'driver', 'created_by').all()
    permission_classes = [IsManagerOrDispatcher]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'vehicle', 'driver']
    search_fields      = ['origin', 'destination', 'cargo_description']
    ordering_fields    = ['scheduled_date', 'status', 'revenue']

    def get_serializer_class(self):
        if self.action == 'list':
            return TripListSerializer
        if self.action == 'create':
            return TripCreateSerializer
        return TripDetailSerializer

    # CRITICAL FIX: Renamed from 'dispatch' to 'dispatch_trip'
    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch_trip(self, request, pk=None):
        """POST /api/trips/{id}/dispatch/ — Move trip from Draft to Dispatched."""
        trip = self.get_object()
        if trip.status != 'draft':
            return Response({"error": f"Trip is {trip.status}. Only Draft trips can be dispatched."},
                            status=status.HTTP_400_BAD_REQUEST)
        trip.status = 'dispatched'
        try:
            trip.save()
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Trip dispatched successfully.",
                         "vehicle_status": trip.vehicle.status,
                         "driver_status": trip.driver.status})

    # CRITICAL FIX: Renamed from 'complete' to 'complete_trip'
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_trip(self, request, pk=None):
        """POST /api/trips/{id}/complete/ — Mark trip as Completed."""
        trip = self.get_object()
        if trip.status != 'dispatched':
            return Response({"error": "Only dispatched trips can be completed."},
                            status=status.HTTP_400_BAD_REQUEST)
        # Optionally update distance and revenue from request
        if 'distance_km' in request.data:
            trip.distance_km = request.data['distance_km']
        if 'revenue' in request.data:
            trip.revenue = request.data['revenue']
        trip.status = 'completed'
        trip.save()
        return Response({"message": "Trip completed successfully. Vehicle and driver are now available."})

    # CRITICAL FIX: Renamed from 'cancel' to 'cancel_trip'
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_trip(self, request, pk=None):
        """POST /api/trips/{id}/cancel/ — Cancel a trip."""
        trip = self.get_object()
        if trip.status == 'completed':
            return Response({"error": "Cannot cancel a completed trip."},
                            status=status.HTTP_400_BAD_REQUEST)
        trip.status = 'cancelled'
        trip.save()
        return Response({"message": "Trip cancelled."})

# ═══════════════════════════════════════════════════════
# 6. FUEL LOG
# ═══════════════════════════════════════════════════════

class FuelLogViewSet(viewsets.ModelViewSet):
    """
    Fuel log CRUD.
    ROLES: Manager/Dispatcher (full)
    """
    queryset           = FuelLog.objects.select_related('vehicle', 'logged_by').all()
    serializer_class   = FuelLogSerializer
    permission_classes = [IsManagerOrDispatcher]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['vehicle', 'trip']
    ordering_fields    = ['date', 'total_cost', 'liters']

    @action(detail=False, methods=['get'], url_path='efficiency',
            permission_classes=[IsAnalystOrManager])
    def efficiency_report(self, request):
        """
        GET /api/fuel/efficiency/
        Returns fuel efficiency per vehicle.
        """
        from django.db.models import F
        vehicles = Vehicle.objects.annotate(
            fuel_used=Sum('fuel_logs__liters'),
            fuel_cost_total=Sum('fuel_logs__total_cost'),
            trips_distance=Sum('trips__distance_km'),
        ).filter(fuel_used__gt=0)

        data = []
        for v in vehicles:
            efficiency = float(v.trips_distance or 0) / float(v.fuel_used) if v.fuel_used else 0
            data.append({
                'vehicle':         v.license_plate,
                'make_model':      f"{v.make} {v.model}",
                'total_liters':    v.fuel_used,
                'total_fuel_cost': v.fuel_cost_total,
                'total_distance_km': v.trips_distance or 0,
                'km_per_liter':    round(efficiency, 2),
            })

        data.sort(key=lambda x: x['km_per_liter'], reverse=True)
        return Response(data)


# ═══════════════════════════════════════════════════════
# 7. MAINTENANCE
# ═══════════════════════════════════════════════════════

class MaintenanceViewSet(viewsets.ModelViewSet):
    """
    Maintenance records — auto updates vehicle status.
    ROLES: Manager/Safety Officer (full)
    """
    queryset           = Maintenance.objects.select_related('vehicle', 'logged_by').all()
    serializer_class   = MaintenanceSerializer
    permission_classes = [IsManagerOrSafetyOfficer]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['vehicle', 'status', 'maintenance_type']
    ordering_fields    = ['start_date', 'cost', 'status']

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        """POST /api/maintenance/{id}/complete/ — Mark maintenance as done."""
        record = self.get_object()
        record.status = 'completed'
        record.save()
        return Response({"message": f"Maintenance completed. Vehicle {record.vehicle.license_plate} is now Available."})


# ═══════════════════════════════════════════════════════
# 8. EXPENSE
# ═══════════════════════════════════════════════════════

class ExpenseViewSet(viewsets.ModelViewSet):
    """
    Expense CRUD.
    ROLES: Analyst/Manager (full) | Others read only
    """
    queryset           = Expense.objects.select_related('vehicle', 'logged_by').all()
    serializer_class   = ExpenseSerializer
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['vehicle', 'category', 'trip']
    ordering_fields    = ['date', 'amount', 'category']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAnalystOrManager()]


# ═══════════════════════════════════════════════════════
# 9. DASHBOARD KPI VIEW
# ═══════════════════════════════════════════════════════

class DashboardView(APIView):
    """
    GET /api/dashboard/
    Returns all KPIs for the dashboard.
    Accessible by all authenticated users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import date

        # ── Vehicle stats ─────────────────────────────────
        total_vehicles     = Vehicle.objects.count()
        active_fleet       = Vehicle.objects.filter(status='on_trip').count()
        vehicles_available = Vehicle.objects.filter(status='available').count()
        vehicles_in_shop   = Vehicle.objects.filter(status='in_shop').count()
        vehicles_retired   = Vehicle.objects.filter(status='retired').count()
        utilization_rate   = round((active_fleet / total_vehicles * 100), 2) if total_vehicles else 0

        # ── Trip stats ────────────────────────────────────
        total_trips        = Trip.objects.count()
        trips_in_draft     = Trip.objects.filter(status='draft').count()
        trips_dispatched   = Trip.objects.filter(status='dispatched').count()
        trips_completed    = Trip.objects.filter(status='completed').count()

        # ── Driver stats ──────────────────────────────────
        total_drivers      = Driver.objects.count()
        drivers_on_duty    = Driver.objects.filter(status='on_duty').count()
        drivers_suspended  = Driver.objects.filter(status='suspended').count()
        drivers_expired    = Driver.objects.filter(license_expiry__lt=date.today()).count()

        # ── Financial stats ───────────────────────────────
        total_revenue      = Trip.objects.filter(status='completed').aggregate(
                                 t=Sum('revenue'))['t'] or 0
        total_fuel_cost    = FuelLog.objects.aggregate(t=Sum('total_cost'))['t'] or 0
        total_maint_cost   = Maintenance.objects.aggregate(t=Sum('cost'))['t'] or 0
        total_expenses     = Expense.objects.aggregate(t=Sum('amount'))['t'] or 0
        net_profit         = float(total_revenue) - float(total_fuel_cost) - \
                             float(total_maint_cost) - float(total_expenses)

        data = {
            'total_vehicles':         total_vehicles,
            'active_fleet':           active_fleet,
            'vehicles_available':     vehicles_available,
            'vehicles_in_shop':       vehicles_in_shop,
            'vehicles_retired':       vehicles_retired,
            'utilization_rate':       utilization_rate,

            'total_trips':            total_trips,
            'trips_in_draft':         trips_in_draft,
            'trips_dispatched':       trips_dispatched,
            'trips_completed':        trips_completed,

            'total_drivers':          total_drivers,
            'drivers_on_duty':        drivers_on_duty,
            'drivers_suspended':      drivers_suspended,
            'drivers_expired_license': drivers_expired,

            'total_revenue':          float(total_revenue),
            'total_fuel_cost':        float(total_fuel_cost),
            'total_maintenance_cost': float(total_maint_cost),
            'total_expenses':         float(total_expenses),
            'net_profit':             net_profit,

            'maintenance_alerts':     vehicles_in_shop,
        }

        serializer = DashboardSerializer(data)
        return Response(serializer.data)




class RegisterView(APIView):
    permission_classes = []  # Public access
    
    def post(self, request):
        # Log the incoming data
        print("Received registration data:", request.data)
        
        # Check if passwords match
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        
        if not password or not confirm_password:
            return Response({
                'error': 'Both password and confirm_password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if password != confirm_password:
            return Response({
                'confirm_password': ['Passwords do not match']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Remove confirm_password for serializer
        data = request.data.copy()
        if 'confirm_password' in data:
            del data['confirm_password']
        
        # Validate role
        allowed_roles = ['manager', 'dispatcher', 'safety_officer', 'analyst', 'driver']
        if data.get('role') and data['role'] not in allowed_roles:
            return Response({
                'role': [f'Invalid role. Choose from: {", ".join(allowed_roles)}']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = UserCreateSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            
            # If role is 'driver', automatically create a driver profile
            if user.role == 'driver':
                try:
                    # Extract driver-specific fields from request
                    driver_data = {
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email,
                        'phone': user.phone,
                        'license_number': request.data.get('license_number', ''),
                        'license_expiry': request.data.get('license_expiry', ''),
                        'status': 'off_duty',
                        'user_id': user.id,
                    }
                    
                    # Create driver profile
                    driver = Driver.objects.create(**driver_data)
                    print(f"Driver profile created for user {user.username}")
                    
                except Exception as e:
                    print(f"Error creating driver profile: {e}")
                    # Don't fail the registration if driver creation fails
                    # But log the error
            
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        # Log validation errors
        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)