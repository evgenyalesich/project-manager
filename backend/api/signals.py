from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Task, Comment, TaskHistory
from .serializers import TaskListSerializer, CommentSerializer


@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_task = Task.objects.get(pk=instance.pk)

            tracked_fields = ["status", "priority", "assignee_id", "deadline"]

            for field in tracked_fields:
                old_value = getattr(old_task, field)
                new_value = getattr(instance, field)

                if old_value != new_value:
                    changed_by = getattr(instance, "_changed_by", None)

                    if changed_by:
                        TaskHistory.objects.create(
                            task=instance,
                            changed_by=changed_by,
                            field_name=field,
                            old_value=str(old_value) if old_value else "",
                            new_value=str(new_value) if new_value else "",
                        )
        except Task.DoesNotExist:
            pass


@receiver(post_save, sender=Task)
def broadcast_task_update(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    room_group_name = f"project_{instance.project_id}"

    serializer = TaskListSerializer(instance)

    event_type = "task_created" if created else "task_updated"

    async_to_sync(channel_layer.group_send)(
        room_group_name, {"type": event_type, "task": serializer.data}
    )

    if instance.assignee and not created:
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.assignee.id}",
            {
                "type": "notification",
                "message": {
                    "title": "Task Updated",
                    "body": f'Task "{instance.title}" has been updated',
                    "task_id": instance.id,
                },
            },
        )


@receiver(post_delete, sender=Task)
def broadcast_task_delete(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    room_group_name = f"project_{instance.project_id}"

    async_to_sync(channel_layer.group_send)(
        room_group_name, {"type": "task_deleted", "task_id": instance.id}
    )


@receiver(post_save, sender=Comment)
def broadcast_comment_created(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        room_group_name = f"project_{instance.task.project_id}"

        serializer = CommentSerializer(instance)

        async_to_sync(channel_layer.group_send)(
            room_group_name, {"type": "comment_created", "comment": serializer.data}
        )

        if instance.task.assignee and instance.task.assignee != instance.author:
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.task.assignee.id}",
                {
                    "type": "notification",
                    "message": {
                        "title": "New Comment",
                        "body": f'{instance.author.username} commented on "{instance.task.title}"',
                        "task_id": instance.task.id,
                    },
                },
            )
