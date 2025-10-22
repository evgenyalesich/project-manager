from django.contrib import admin
from django.urls import path, include, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings

urlpatterns = [
    # --- API endpoints ---
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # --- Статика из dist/assets ---
    re_path(
        r"^assets/(?P<path>.*)$",
        serve,
        {"document_root": settings.FRONTEND_DIR / "assets"},
    ),
    # --- Корневые файлы (vite.svg и т.д.) ---
    re_path(
        r"^(?P<path>vite\.svg|favicon\.ico)$",
        serve,
        {"document_root": settings.FRONTEND_DIR},
    ),
    # --- React frontend (последним!) ---
    re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),
]
