import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token_list = query_params.get("token")

        if token_list:
            token = token_list[0]
            try:
                access_token = AccessToken(token)
                user_id = access_token["user_id"]
                user = await self.get_user(user_id)
                scope["user"] = user
            except Exception:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)

    @staticmethod
    async def get_user(user_id):
        from channels.db import database_sync_to_async

        return await database_sync_to_async(User.objects.get)(id=user_id)


class DisableCSRFForAPIMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path.startswith("/api/"):
            setattr(request, "_dont_enforce_csrf_checks", True)
        return None
