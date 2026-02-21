"""
Fleet Management System - URL Routes
======================================
All API endpoints organized by feature.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView, LogoutView, MeView, ChangePasswordView,
    UserViewSet,
    VehicleViewSet,
    DriverViewSet,
    TripViewSet,
    FuelLogViewSet,
    MaintenanceViewSet,
    ExpenseViewSet,
    DashboardView,
    RegisterView
)

# ── Router auto-generates CRUD routes ─────────────────
router = DefaultRouter()
router.register(r'users',       UserViewSet,       basename='user')
router.register(r'vehicles',    VehicleViewSet,    basename='vehicle')
router.register(r'drivers',     DriverViewSet,     basename='driver')
router.register(r'trips',       TripViewSet,       basename='trip')
router.register(r'fuel',        FuelLogViewSet,    basename='fuel')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')
router.register(r'expenses',    ExpenseViewSet,    basename='expense')

urlpatterns = [
    # ── Authentication ────────────────────────────────
    path('auth/login/',           LoginView.as_view(),          name='login'),
    path('auth/logout/',          LogoutView.as_view(),         name='logout'),
    path('auth/token/refresh/',   TokenRefreshView.as_view(),   name='token_refresh'),
    path('auth/me/',              MeView.as_view(),             name='me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/register/',        RegisterView.as_view(),       name='register'),
    # ── Dashboard ─────────────────────────────────────
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    # ── All CRUD Routes (auto-generated) ──────────────
    path('', include(router.urls)),
]

# ─────────────────────────────────────────────────────
# FULL API REFERENCE SUMMARY
# ─────────────────────────────────────────────────────
#
# AUTH:
#   POST  /api/auth/login/               → Get JWT tokens
#   POST  /api/auth/logout/              → Blacklist refresh token
#   POST  /api/auth/token/refresh/       → Get new access token
#   GET   /api/auth/me/                  → My profile
#   POST  /api/auth/change-password/     → Change my password
#
# DASHBOARD:
#   GET   /api/dashboard/                → All KPIs (all roles)
#
# USERS (Manager only):
#   GET   /api/users/                    → List users
#   POST  /api/users/                    → Create user
#   GET   /api/users/{id}/               → User detail
#   PUT   /api/users/{id}/               → Update user
#   DELETE /api/users/{id}/              → Delete user
#
# VEHICLES (Manager / Dispatcher):
#   GET   /api/vehicles/                 → List vehicles
#   POST  /api/vehicles/                 → Add vehicle
#   GET   /api/vehicles/{id}/            → Vehicle detail
#   PUT   /api/vehicles/{id}/            → Update vehicle
#   DELETE /api/vehicles/{id}/           → Delete vehicle
#   GET   /api/vehicles/available/       → Available vehicles only
#   POST  /api/vehicles/{id}/retire/     → Retire vehicle (Manager)
#   GET   /api/vehicles/{id}/roi/        → ROI report (Analyst/Manager)
#
# DRIVERS (Manager / Safety Officer):
#   GET   /api/drivers/                  → List drivers
#   POST  /api/drivers/                  → Add driver
#   GET   /api/drivers/{id}/             → Driver detail
#   PUT   /api/drivers/{id}/             → Update driver
#   DELETE /api/drivers/{id}/            → Delete driver
#   GET   /api/drivers/available/        → Available drivers only
#   GET   /api/drivers/compliance-alerts/ → Expired/suspended alerts
#   POST  /api/drivers/{id}/suspend/     → Suspend driver
#   POST  /api/drivers/{id}/reinstate/   → Reinstate driver
#
# TRIPS (Manager / Dispatcher):
#   GET   /api/trips/                    → List trips
#   POST  /api/trips/                    → Create trip
#   GET   /api/trips/{id}/               → Trip detail
#   PUT   /api/trips/{id}/               → Update trip
#   POST  /api/trips/{id}/dispatch/      → Dispatch trip
#   POST  /api/trips/{id}/complete/      → Complete trip
#   POST  /api/trips/{id}/cancel/        → Cancel trip
#
# FUEL LOGS (Manager / Dispatcher):
#   GET   /api/fuel/                     → List fuel logs
#   POST  /api/fuel/                     → Add fuel log
#   GET   /api/fuel/{id}/                → Fuel log detail
#   PUT   /api/fuel/{id}/                → Update fuel log
#   GET   /api/fuel/efficiency/          → Efficiency report (Analyst/Manager)
#
# MAINTENANCE (Manager / Safety Officer):
#   GET   /api/maintenance/              → List maintenance records
#   POST  /api/maintenance/              → Create maintenance record
#   GET   /api/maintenance/{id}/         → Record detail
#   PUT   /api/maintenance/{id}/         → Update record
#   POST  /api/maintenance/{id}/complete/ → Mark complete (returns vehicle)
#
# EXPENSES (Manager / Analyst):
#   GET   /api/expenses/                 → List expenses (all roles read)
#   POST  /api/expenses/                 → Add expense
#   GET   /api/expenses/{id}/            → Expense detail
#   PUT   /api/expenses/{id}/            → Update expense