"""
Fleet Management System - Main URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# ── Customize Admin Panel ──────────────────────────────
admin.site.site_header  = "Fleet Management System"
admin.site.site_title   = "Fleet Admin"
admin.site.index_title  = "Fleet Control Panel"

urlpatterns = [
    # Admin Panel
    path('admin/', admin.site.urls),

    # All API routes under /api/
    path('api/', include('core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)