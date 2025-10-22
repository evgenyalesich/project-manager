import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User


class ProjectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.room_group_name = f"project_{self.project_id}"
        self.user = self.scope["user"]

        has_access = await self.check_project_access()
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "project.broadcast", "message": data}
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"error": "Invalid JSON"}))

    async def project_broadcast(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def task_created(self, event):
        await self.send_json("task.created", event.get("task"))

    async def task_updated(self, event):
        await self.send_json("task.updated", event.get("task"))

    async def task_deleted(self, event):
        await self.send_json("task.deleted", {"id": event.get("task_id")})

    async def comment_created(self, event):
        await self.send_json("comment.created", event.get("comment"))

    async def comment_deleted(self, event):
        await self.send_json("comment.deleted", {"id": event.get("comment_id")})

    async def member_added(self, event):
        """Когда в проект добавлен новый участник"""
        await self.send_json("member.added", event.get("member"))

    async def member_removed(self, event):
        """Когда участник удалён из проекта"""
        await self.send_json("member.removed", {"user_id": event.get("user_id")})

    async def send_json(self, event_type: str, data):
        """Отправляет сообщение в формате {'type': ..., 'data': ...}"""
        await self.send(text_data=json.dumps({"type": event_type, "data": data}))

    @database_sync_to_async
    def check_project_access(self) -> bool:
        """Проверяет, состоит ли пользователь в проекте"""
        from .models import ProjectMember

        if not self.user.is_authenticated:
            return False

        return ProjectMember.objects.filter(
            project_id=self.project_id, user=self.user
        ).exists()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer для персональных уведомлений"""

    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.room_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def notification(self, event):
        """Отправка уведомлений пользователю"""
        await self.send(
            text_data=json.dumps({"type": "notification", "data": event.get("message")})
        )
