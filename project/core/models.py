"""
Fleet Management System - All Database Models
============================================
Models: User, Vehicle, Driver, Trip, FuelLog, Maintenance, Expense
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone


# ═══════════════════════════════════════════════════════
# 1. CUSTOM USER MODEL WITH ROLES
# ═══════════════════════════════════════════════════════
class User(AbstractUser):
    """
    Custom User with Role-Based Access Control (RBAC)
    Roles: Manager, Dispatcher, Safety Officer, Analyst, Driver
    """
    ROLE_CHOICES = [
        ('manager',        'Manager'),           # Full access
        ('dispatcher',     'Dispatcher'),         # Trip & vehicle access
        ('safety_officer', 'Safety Officer'),     # Driver compliance
        ('analyst',        'Analyst'),            # Financial reports only
        ('driver',         'Driver'),             # New role for drivers
    ]

    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='dispatcher')
    phone      = models.CharField(max_length=20, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name      = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    # ── Role helper properties ──────────────────────────
    @property
    def is_manager(self):
        return self.role == 'manager'

    @property
    def is_dispatcher(self):
        return self.role == 'dispatcher'

    @property
    def is_safety_officer(self):
        return self.role == 'safety_officer'

    @property
    def is_analyst(self):
        return self.role == 'analyst'

    @property
    def is_driver(self):  # Add this helper
        return self.role == 'driver'

# ═══════════════════════════════════════════════════════
# 2. VEHICLE MODEL
# ═══════════════════════════════════════════════════════
class Vehicle(models.Model):
    """
    Fleet Vehicle with status management.
    Status auto-changes based on trips and maintenance.
    """
    STATUS_CHOICES = [
        ('available', 'Available'),    # Ready to dispatch
        ('on_trip',   'On Trip'),      # Currently assigned
        ('in_shop',   'In Shop'),      # Under maintenance
        ('retired',   'Retired'),      # Permanently inactive
    ]

    TYPE_CHOICES = [
        ('truck',     'Truck'),
        ('van',       'Van'),
        ('pickup',    'Pickup'),
        ('tanker',    'Tanker'),
        ('trailer',   'Trailer'),
    ]

    # ── Identity ─────────────────────────────────────────
    license_plate    = models.CharField(max_length=20, unique=True)
    make             = models.CharField(max_length=50)          # e.g. Toyota
    model            = models.CharField(max_length=50)          # e.g. Hilux
    year             = models.PositiveIntegerField()
    vehicle_type     = models.CharField(max_length=20, choices=TYPE_CHOICES, default='truck')

    # ── Specs ─────────────────────────────────────────────
    capacity_kg      = models.DecimalField(max_digits=8, decimal_places=2, help_text="Max cargo weight in KG")
    odometer_km      = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # ── Status ────────────────────────────────────────────
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    # ── Financial ─────────────────────────────────────────
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    acquisition_date = models.DateField(null=True, blank=True)

    # ── Meta ──────────────────────────────────────────────
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name      = 'Vehicle'
        verbose_name_plural = 'Vehicles'
        ordering = ['license_plate']

    def __str__(self):
        return f"{self.license_plate} — {self.make} {self.model} [{self.get_status_display()}]"

    def clean(self):
        # Odometer cannot decrease
        if self.pk:
            old = Vehicle.objects.get(pk=self.pk)
            if self.odometer_km < old.odometer_km:
                raise ValidationError("Odometer reading cannot decrease.")

    @property
    def is_available(self):
        return self.status == 'available'

    @property
    def total_fuel_cost(self):
        return self.fuel_logs.aggregate(
            total=models.Sum('total_cost'))['total'] or 0

    @property
    def total_maintenance_cost(self):
        return self.maintenance_records.aggregate(
            total=models.Sum('cost'))['total'] or 0

    @property
    def total_operational_cost(self):
        return float(self.total_fuel_cost) + float(self.total_maintenance_cost)

    @property
    def total_revenue(self):
        return self.trips.filter(status='completed').aggregate(
            total=models.Sum('revenue'))['total'] or 0

    @property
    def roi(self):
        """Vehicle ROI = (Revenue - Total Cost) / Acquisition Cost"""
        if not self.acquisition_cost or self.acquisition_cost == 0:
            return 0
        net = float(self.total_revenue) - float(self.total_operational_cost)
        return round((net / float(self.acquisition_cost)) * 100, 2)


# ═══════════════════════════════════════════════════════
# 3. DRIVER MODEL
# ═══════════════════════════════════════════════════════

class Driver(models.Model):
    """
    Driver with compliance tracking.
    Automatically rejects expired or suspended drivers.
    """
    STATUS_CHOICES = [
        ('off_duty',   'Off Duty'),
        ('on_duty',    'On Duty'),
        ('suspended',  'Suspended'),
    ]

    # Link to User account (optional, can be null for backward compatibility)
    user = models.OneToOneField(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='driver_profile'
    )
    
    # ── Identity ─────────────────────────────────────────
    first_name       = models.CharField(max_length=100)
    last_name        = models.CharField(max_length=100)
    phone            = models.CharField(max_length=20)
    email            = models.EmailField(blank=True)
    photo            = models.ImageField(upload_to='drivers/', null=True, blank=True)

    # ── License / Compliance ──────────────────────────────
    license_number   = models.CharField(max_length=50, unique=True)
    license_expiry   = models.DateField()

    # ── Status ────────────────────────────────────────────
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='off_duty')

    # ── Meta ──────────────────────────────────────────────
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name      = 'Driver'
        verbose_name_plural = 'Drivers'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.full_name} — {self.license_number} [{self.get_status_display()}]"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def is_license_expired(self):
        return self.license_expiry < timezone.now().date()
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='off_duty'  # Make sure default is 'off_duty'
    )
    @property
    def is_available(self):
        return self.status == 'off_duty' and not self.is_license_expired

    @property
    def compliance_status(self):
        if self.status == 'suspended':
            return 'SUSPENDED'
        if self.is_license_expired:
            return 'LICENSE EXPIRED'
        return 'COMPLIANT'



# ═══════════════════════════════════════════════════════
# 4. TRIP MODEL
# ═══════════════════════════════════════════════════════
class Trip(models.Model):
    """
    Trip lifecycle: Draft → Dispatched → Completed / Cancelled
    Auto-updates vehicle and driver status on state changes.
    """
    STATUS_CHOICES = [
        ('draft',      'Draft'),
        ('dispatched', 'Dispatched'),
        ('completed',  'Completed'),
        ('cancelled',  'Cancelled'),
    ]

    # ── Assignment ───────────────────────────────────────
    vehicle          = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='trips')
    driver           = models.ForeignKey(Driver,  on_delete=models.PROTECT, related_name='trips')
    created_by       = models.ForeignKey(User,    on_delete=models.SET_NULL, null=True, related_name='created_trips')

    # ── Route ─────────────────────────────────────────────
    origin           = models.CharField(max_length=200)
    destination      = models.CharField(max_length=200)
    scheduled_date   = models.DateField()
    completed_date   = models.DateField(null=True, blank=True)

    # ── Cargo ─────────────────────────────────────────────
    cargo_description = models.CharField(max_length=200, blank=True)
    cargo_weight_kg   = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    # ── Financials ────────────────────────────────────────
    revenue          = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    distance_km      = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    # ── Status ────────────────────────────────────────────
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name      = 'Trip'
        verbose_name_plural = 'Trips'
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"Trip #{self.pk} | {self.origin} → {self.destination} [{self.get_status_display()}]"

    def clean(self):
        # ── Cargo weight validation ───────────────────────
        if self.cargo_weight_kg and self.vehicle_id:
            if self.cargo_weight_kg > self.vehicle.capacity_kg:
                raise ValidationError(
                    f"Cargo weight ({self.cargo_weight_kg} kg) exceeds vehicle capacity "
                    f"({self.vehicle.capacity_kg} kg)."
                )

        # ── Driver compliance validation ──────────────────
        if self.driver_id and self.status in ['draft', 'dispatched']:
            driver = self.driver
            if driver.is_license_expired:
                raise ValidationError(f"Driver {driver.full_name}'s license has expired. Cannot assign.")
            if driver.status == 'suspended':
                raise ValidationError(f"Driver {driver.full_name} is suspended. Cannot assign.")

        # ── Vehicle availability validation ───────────────
        if self.vehicle_id and self.status == 'dispatched':
            vehicle = self.vehicle
            if vehicle.status == 'on_trip' and self.pk:
                # Allow update of existing dispatched trip
                existing = Trip.objects.filter(vehicle=vehicle, status='dispatched').exclude(pk=self.pk)
                if existing.exists():
                    raise ValidationError(f"Vehicle {vehicle.license_plate} is already on a trip.")
            elif vehicle.status in ['in_shop', 'retired']:
                raise ValidationError(f"Vehicle {vehicle.license_plate} is {vehicle.get_status_display()} and cannot be dispatched.")

    def save(self, *args, **kwargs):
        """Auto-update vehicle and driver status on trip state change."""
        self.full_clean()

        if self.pk:
            old = Trip.objects.get(pk=self.pk)
            old_status = old.status
        else:
            old_status = None

        super().save(*args, **kwargs)

        # ── When dispatched → Lock vehicle & driver ───────
        if self.status == 'dispatched' and old_status != 'dispatched':
            Vehicle.objects.filter(pk=self.vehicle_id).update(status='on_trip')
            Driver.objects.filter(pk=self.driver_id).update(status='on_duty')

        # ── When completed / cancelled → Free vehicle & driver
        if self.status in ['completed', 'cancelled'] and old_status == 'dispatched':
            Vehicle.objects.filter(pk=self.vehicle_id).update(status='available')
            Driver.objects.filter(pk=self.driver_id).update(status='off_duty')

            if self.status == 'completed':
                Trip.objects.filter(pk=self.pk).update(completed_date=timezone.now().date())


# ═══════════════════════════════════════════════════════
# 5. FUEL LOG MODEL
# ═══════════════════════════════════════════════════════
class FuelLog(models.Model):
    """
    Fuel consumption tracking per vehicle per fill-up.
    """
    vehicle       = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_logs')
    trip          = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True, related_name='fuel_logs')
    logged_by     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    date          = models.DateField(default=timezone.now)
    liters        = models.DecimalField(max_digits=8, decimal_places=2)
    price_per_liter = models.DecimalField(max_digits=6, decimal_places=2)
    total_cost    = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    odometer_km   = models.DecimalField(max_digits=10, decimal_places=2)
    fuel_station  = models.CharField(max_length=100, blank=True)

    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Fuel Log'
        verbose_name_plural = 'Fuel Logs'
        ordering = ['-date']

    def __str__(self):
        return f"{self.vehicle.license_plate} | {self.date} | {self.liters}L"

    def save(self, *args, **kwargs):
        # Auto-calculate total cost
        self.total_cost = self.liters * self.price_per_liter
        super().save(*args, **kwargs)


# ═══════════════════════════════════════════════════════
# 6. MAINTENANCE MODEL
# ═══════════════════════════════════════════════════════
class Maintenance(models.Model):
    """
    Vehicle maintenance records.
    Auto-sets vehicle to 'In Shop' when created,
    and back to 'Available' when completed.
    """
    TYPE_CHOICES = [
        ('oil_change',    'Oil Change'),
        ('tire_rotation', 'Tire Rotation'),
        ('brake_service', 'Brake Service'),
        ('engine_repair', 'Engine Repair'),
        ('scheduled',     'Scheduled Service'),
        ('accident',      'Accident Repair'),
        ('inspection',    'Inspection'),
        ('other',         'Other'),
    ]

    STATUS_CHOICES = [
        ('pending',    'Pending'),
        ('in_progress','In Progress'),
        ('completed',  'Completed'),
    ]

    vehicle       = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_records')
    logged_by     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    maintenance_type  = models.CharField(max_length=30, choices=TYPE_CHOICES)
    description       = models.TextField()
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    start_date        = models.DateField(default=timezone.now)
    completed_date    = models.DateField(null=True, blank=True)

    cost              = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vendor            = models.CharField(max_length=100, blank=True)

    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Maintenance Record'
        verbose_name_plural = 'Maintenance Records'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.vehicle.license_plate} | {self.get_maintenance_type_display()} | {self.get_status_display()}"

    def save(self, *args, **kwargs):
        if self.pk:
            old = Maintenance.objects.get(pk=self.pk)
            old_status = old.status
        else:
            old_status = None

        super().save(*args, **kwargs)

        # ── New maintenance created → Send to shop ────────
        if old_status is None and self.status in ['pending', 'in_progress']:
            Vehicle.objects.filter(pk=self.vehicle_id).update(status='in_shop')

        # ── Maintenance completed → Return to fleet ───────
        if self.status == 'completed' and old_status != 'completed':
            Vehicle.objects.filter(pk=self.vehicle_id).update(status='available')
            if not self.completed_date:
                Maintenance.objects.filter(pk=self.pk).update(
                    completed_date=timezone.now().date()
                )


# ═══════════════════════════════════════════════════════
# 7. EXPENSE MODEL
# ═══════════════════════════════════════════════════════
class Expense(models.Model):
    """
    General operational expenses per vehicle or trip.
    """
    CATEGORY_CHOICES = [
        ('fuel',         'Fuel'),
        ('maintenance',  'Maintenance'),
        ('toll',         'Toll / Road Tax'),
        ('parking',      'Parking'),
        ('insurance',    'Insurance'),
        ('salary',       'Driver Salary'),
        ('other',        'Other'),
    ]

    vehicle       = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    trip          = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    logged_by     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    category      = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description   = models.CharField(max_length=200)
    amount        = models.DecimalField(max_digits=10, decimal_places=2)
    date          = models.DateField(default=timezone.now)
    receipt_photo = models.ImageField(upload_to='receipts/', null=True, blank=True)

    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        ordering = ['-date']

    def __str__(self):
        return f"{self.get_category_display()} | ₹{self.amount} | {self.date}"

    def clean(self):
        if self.amount is not None and self.amount < 0:
            raise ValidationError("Expense amount cannot be negative.")

