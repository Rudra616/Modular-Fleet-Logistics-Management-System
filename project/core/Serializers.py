"""
Fleet Management System - Serializers
======================================
Converts models ↔ JSON for API responses.
Includes JWT customization, validation logic.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance, Expense

User = get_user_model()


# ═══════════════════════════════════════════════════════
# 1. JWT — CUSTOM TOKEN (adds role + name to token)
# ═══════════════════════════════════════════════════════
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Returns JWT token + user info on login.
    Frontend gets: access, refresh, role, name, email
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Embed user info inside token payload
        token['role']       = user.role
        token['full_name']  = user.get_full_name()
        token['email']      = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra info to login response body
        data['user'] = {
            'id':        self.user.id,
            'username':  self.user.username,
            'full_name': self.user.get_full_name(),
            'email':     self.user.email,
            'role':      self.user.role,
            'role_display': self.user.get_role_display(),
        }
        return data


# ═══════════════════════════════════════════════════════
# 2. USER SERIALIZERS
# ═══════════════════════════════════════════════════════
class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email',
                  'role', 'role_display', 'phone', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']


# This already exists in your code - NO CHANGES NEEDED
class UserCreateSerializer(serializers.ModelSerializer):
    """Used for creating new users — handles password hashing."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['username', 'first_name', 'last_name', 'email',
                  'password', 'role', 'phone']

    def validate_role(self, value):
        """Validate that role is one of the allowed choices."""
        allowed_roles = ['manager', 'dispatcher', 'safety_officer', 'analyst', 'driver']
        if value not in allowed_roles:
            raise serializers.ValidationError(f"Invalid role. Choose from: {', '.join(allowed_roles)}")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)   # Hash the password properly
        user.save()
        return user
    
    
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


# ═══════════════════════════════════════════════════════
# 3. VEHICLE SERIALIZERS
# ═══════════════════════════════════════════════════════
class VehicleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display   = serializers.CharField(source='get_vehicle_type_display', read_only=True)

    class Meta:
        model  = Vehicle
        fields = ['id', 'license_plate', 'make', 'model', 'year',
                  'vehicle_type', 'type_display', 'capacity_kg',
                  'odometer_km', 'status', 'status_display']


class VehicleDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer including financial calculations."""
    status_display         = serializers.CharField(source='get_status_display', read_only=True)
    type_display           = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    total_fuel_cost        = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_maintenance_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_operational_cost = serializers.FloatField(read_only=True)
    total_revenue          = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    roi                    = serializers.FloatField(read_only=True)
    is_available           = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Vehicle
        fields = '__all__'

    def validate_odometer_km(self, value):
        """Prevent odometer from decreasing."""
        if self.instance and value < self.instance.odometer_km:
            raise serializers.ValidationError("Odometer cannot decrease.")
        return value


# ═══════════════════════════════════════════════════════
# 4. DRIVER SERIALIZERS
# ═══════════════════════════════════════════════════════
class DriverListSerializer(serializers.ModelSerializer):
    status_display     = serializers.CharField(source='get_status_display', read_only=True)
    full_name          = serializers.CharField(read_only=True)
    compliance_status  = serializers.CharField(read_only=True)
    is_license_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Driver
        fields = ['id', 'full_name', 'first_name', 'last_name', 'phone',
                  'license_number', 'license_expiry', 'status',
                  'status_display', 'compliance_status', 'is_license_expired']


class DriverDetailSerializer(serializers.ModelSerializer):
    status_display     = serializers.CharField(source='get_status_display', read_only=True)
    full_name          = serializers.CharField(read_only=True)
    compliance_status  = serializers.CharField(read_only=True)
    is_license_expired = serializers.BooleanField(read_only=True)
    is_available       = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Driver
        fields = '__all__'


# ═══════════════════════════════════════════════════════
# 5. TRIP SERIALIZERS
# ═══════════════════════════════════════════════════════
class TripListSerializer(serializers.ModelSerializer):
    vehicle_plate  = serializers.CharField(source='vehicle.license_plate', read_only=True)
    driver_name    = serializers.CharField(source='driver.full_name',      read_only=True)
    status_display = serializers.CharField(source='get_status_display',    read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model  = Trip
        fields = ['id', 'vehicle_plate', 'driver_name', 'origin', 'destination',
                  'scheduled_date', 'status', 'status_display', 'cargo_weight_kg',
                  'revenue', 'distance_km', 'created_by_name']


class TripDetailSerializer(serializers.ModelSerializer):
    vehicle_info   = VehicleListSerializer(source='vehicle', read_only=True)
    driver_info    = DriverListSerializer(source='driver',   read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_expenses = serializers.SerializerMethodField()

    class Meta:
        model  = Trip
        fields = '__all__'

    def get_total_expenses(self, obj):
        return obj.expenses.aggregate(
            total=__import__('django.db.models', fromlist=['Sum']).Sum('amount')
        )['total'] or 0

    def validate(self, data):
        """Cross-field validation for trip creation/update."""
        vehicle = data.get('vehicle') or (self.instance.vehicle if self.instance else None)
        driver  = data.get('driver')  or (self.instance.driver  if self.instance else None)
        cargo   = data.get('cargo_weight_kg', 0)
        status  = data.get('status', 'draft')

        if vehicle and cargo and cargo > vehicle.capacity_kg:
            raise serializers.ValidationError(
                f"Cargo ({cargo} kg) exceeds vehicle capacity ({vehicle.capacity_kg} kg)."
            )

        if driver and status in ['draft', 'dispatched']:
            if driver.is_license_expired:
                raise serializers.ValidationError(
                    f"Driver {driver.full_name}'s license is expired."
                )
            if driver.status == 'suspended':
                raise serializers.ValidationError(
                    f"Driver {driver.full_name} is suspended."
                )

        return data


class TripCreateSerializer(TripDetailSerializer):
    class Meta(TripDetailSerializer.Meta):
        read_only_fields = ['created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


# ═══════════════════════════════════════════════════════
# 6. FUEL LOG SERIALIZER
# ═══════════════════════════════════════════════════════
class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_plate  = serializers.CharField(source='vehicle.license_plate', read_only=True)
    logged_by_name = serializers.CharField(source='logged_by.get_full_name', read_only=True)

    class Meta:
        model  = FuelLog
        fields = '__all__'
        read_only_fields = ['total_cost', 'logged_by']

    def create(self, validated_data):
        validated_data['logged_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate_liters(self, value):
        if value <= 0:
            raise serializers.ValidationError("Fuel liters must be greater than 0.")
        return value

    def validate_price_per_liter(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price per liter must be greater than 0.")
        return value


# ═══════════════════════════════════════════════════════
# 7. MAINTENANCE SERIALIZER
# ═══════════════════════════════════════════════════════
class MaintenanceSerializer(serializers.ModelSerializer):
    vehicle_plate    = serializers.CharField(source='vehicle.license_plate', read_only=True)
    logged_by_name   = serializers.CharField(source='logged_by.get_full_name', read_only=True)
    type_display     = serializers.CharField(source='get_maintenance_type_display', read_only=True)
    status_display   = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Maintenance
        fields = '__all__'
        read_only_fields = ['logged_by']

    def create(self, validated_data):
        validated_data['logged_by'] = self.context['request'].user
        return super().create(validated_data)


# ═══════════════════════════════════════════════════════
# 8. EXPENSE SERIALIZER
# ═══════════════════════════════════════════════════════
class ExpenseSerializer(serializers.ModelSerializer):
    vehicle_plate    = serializers.CharField(source='vehicle.license_plate', read_only=True)
    logged_by_name   = serializers.CharField(source='logged_by.get_full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = Expense
        fields = '__all__'
        read_only_fields = ['logged_by']

    def create(self, validated_data):
        validated_data['logged_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Expense amount cannot be negative.")
        return value


# ═══════════════════════════════════════════════════════
# 9. DASHBOARD KPI SERIALIZER
# ═══════════════════════════════════════════════════════
class DashboardSerializer(serializers.Serializer):
    """Read-only serializer for dashboard KPIs."""
    # Fleet summary
    total_vehicles       = serializers.IntegerField()
    active_fleet         = serializers.IntegerField()
    vehicles_available   = serializers.IntegerField()
    vehicles_in_shop     = serializers.IntegerField()
    vehicles_retired     = serializers.IntegerField()
    utilization_rate     = serializers.FloatField()

    # Trip summary
    total_trips          = serializers.IntegerField()
    trips_in_draft       = serializers.IntegerField()
    trips_dispatched     = serializers.IntegerField()
    trips_completed      = serializers.IntegerField()

    # Driver summary
    total_drivers        = serializers.IntegerField()
    drivers_on_duty      = serializers.IntegerField()
    drivers_suspended    = serializers.IntegerField()
    drivers_expired_license = serializers.IntegerField()

    # Financial summary
    total_revenue        = serializers.FloatField()
    total_fuel_cost      = serializers.FloatField()
    total_maintenance_cost = serializers.FloatField()
    total_expenses       = serializers.FloatField()
    net_profit           = serializers.FloatField()

    # Maintenance alerts
    maintenance_alerts   = serializers.IntegerField()