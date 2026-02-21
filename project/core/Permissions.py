"""
Fleet Management System - Role-Based Permissions
=================================================
Controls which role can do what on each API endpoint.
"""
from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    """Full access — Manager only."""
    message = "Access denied. Manager role required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == 'manager')


class IsManagerOrDispatcher(BasePermission):
    """Trip & vehicle management — Manager or Dispatcher."""
    message = "Access denied. Manager or Dispatcher role required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ['manager', 'dispatcher'])


class IsManagerOrSafetyOfficer(BasePermission):
    """Driver compliance — Manager or Safety Officer."""
    message = "Access denied. Manager or Safety Officer role required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ['manager', 'safety_officer'])


class IsAnalystOrManager(BasePermission):
    """Financial reports — Analyst or Manager."""
    message = "Access denied. Analyst or Manager role required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ['manager', 'analyst'])


class ReadOnly(BasePermission):
    """Allow any authenticated user to READ, but not write."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.method in ['GET', 'HEAD', 'OPTIONS']


class IsManagerOrReadOnly(BasePermission):
    """
    Managers can do everything.
    Other authenticated roles can only read (GET).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.role == 'manager'