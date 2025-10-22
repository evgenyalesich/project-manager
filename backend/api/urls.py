from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import ProjectViewSet, TaskViewSet, CommentViewSet, UserViewSet
from .auth_views import register, login, logout, me, refresh_token

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("auth/register/", register, name="auth-register"),
    path("auth/login/", login, name="auth-login"),
    path("auth/logout/", logout, name="auth-logout"),
    path("auth/me/", me, name="auth-me"),
    path("auth/token/refresh/", refresh_token, name="auth-token-refresh"),
    path("", include(router.urls)),
]
