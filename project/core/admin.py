from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils import timezone
from .models import User, Vehicle, Driver, Trip, Maintenance, FuelLog, Expense


# ─────────────────────────────────────────
# USER ADMIN
# ─────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display    = ["email", "get_full_name", "role_badge", "is_active", "created_at"]
    list_filter     = ["role", "is_active", "is_staff"]
    search_fields   = ["email", "first_name", "last_name"]
    ordering        = ["-created_at"]

    fieldsets = (
        ("Login Info",    {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name")}),
        ("Role & Access", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Permissions",   {"fields": ("groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields":  ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )

    def role_badge(self, obj):
        colors = {
            "manager":        "#28a745",
            "dispatcher":     "#007bff",
            "safety_officer": "#fd7e14",
            "analyst":        "#6f42c1",
        }
        color = colors.get(obj.role, "#6c757d")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = "Role"

    def get_full_name(self, obj):
        return obj.full_name
    get_full_name.short_description = "Full Name"

# ─────────────────────────────────────────
# VEHICLE ADMIN
# ─────────────────────────────────────────
@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display  = ["license_plate", "make", "model", "year", "status_badge", "capacity_kg", "odometer_km", "updated_at"]
    list_filter   = ["status", "vehicle_type", "year"]
    search_fields = ["license_plate", "make", "model"]
    readonly_fields = ["created_at", "updated_at"]
    def status_badge(self, obj):
        colors = {
            "available": "#28a745",
            "on_trip":   "#007bff",
            "in_shop":   "#ffc107",
            "retired":   "#6c757d",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"


# ─────────────────────────────────────────
# DRIVER ADMIN
# ─────────────────────────────────────────
@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display  = ["full_name", "license_number", "status_badge", "license_expiry", "license_status", "phone"]
    list_filter   = ["status"]
    search_fields = ["first_name", "last_name", "license_number", "phone"]

    def status_badge(self, obj):
        colors = {
            "off_duty":  "#6c757d",
            "on_duty":   "#28a745",
            "suspended": "#dc3545",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def license_status(self, obj):
        # FIX: Use is_license_expired instead of is_license_valid
        if not obj.is_license_expired:
            return format_html('<span style="color:green">✔ Valid</span>')
        return format_html('<span style="color:red">✘ Expired</span>')
    license_status.short_description = "License"
# ─────────────────────────────────────────
# TRIP ADMIN
# ─────────────────────────────────────────
@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display  = ["id", "vehicle", "driver", "origin", "destination", "status_badge", "scheduled_date", "revenue"]
    list_filter   = ["status", "scheduled_date"]
    search_fields = ["origin", "destination", "vehicle__license_plate", "driver__first_name"]
    readonly_fields = ["created_at", "updated_at", "completed_date"]
    def status_badge(self, obj):
        colors = {
            "draft":      "#6c757d",
            "dispatched": "#007bff",
            "completed":  "#28a745",
            "cancelled":  "#dc3545",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"


# ─────────────────────────────────────────
# MAINTENANCE ADMIN
# ─────────────────────────────────────────
@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display  = ["vehicle", "maintenance_type", "status", "cost", "start_date", "completed_date"]
    list_filter   = ["status", "maintenance_type"]
    search_fields = ["vehicle__license_plate", "description"]

# ─────────────────────────────────────────
# FUEL LOG ADMIN
# ─────────────────────────────────────────
@admin.register(FuelLog)
class FuelLogAdmin(admin.ModelAdmin):
    list_display  = ["vehicle", "liters", "total_cost", "odometer_km", "date"]
    list_filter   = ["date"]
    search_fields = ["vehicle__license_plate"]

# ─────────────────────────────────────────
# EXPENSE ADMIN
# ─────────────────────────────────────────
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display  = ["category", "amount", "vehicle", "trip", "date", "logged_by"]
    list_filter   = ["category", "date"]
    search_fields = ["description"]