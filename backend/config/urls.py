"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from apps.accounts.views import EmailOrUsernameTokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    # Email confirmation: render lightweight template that redirects to frontend
    path(
        "auth/registration/account-confirm-email/<str:key>/",
        TemplateView.as_view(template_name="account_confirm_email.html"),
        name="account_confirm_email",
    ),
    # Password reset confirmation: redirect to frontend with uid and token
    path(
        "auth/password/reset/confirm/<str:uid>/<str:token>/",
        TemplateView.as_view(template_name="registration/password_reset_confirm.html"),
        name="password_reset_confirm",
    ),
    path("",include("apps.accounts.urls")),
    path("auth/", include("dj_rest_auth.urls")),  # login/logout/password change/reset
    path("auth/registration/", include("dj_rest_auth.registration.urls")),  # register + email verify
    # JWT endpoints (SimpleJWT) - Custom view supports email or username login
    path("auth/jwt/create/", EmailOrUsernameTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh/", TokenRefreshView.as_view(), name="jwt-refresh"),
    path("auth/jwt/verify/", TokenVerifyView.as_view(), name="jwt-verify"),
    path("", include("apps.catalog.urls")),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
