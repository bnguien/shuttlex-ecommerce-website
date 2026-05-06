from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

def send_notification(user, title, message, notif_type="ORDER", link=None):
    notif = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notif_type,
        link=link,
    )
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send) (
                f"notifications_user_{user.id}",
                {
                    "type": "notify.new",
                    "payload": {
                        "id": notif.id,
                        "title": notif.title,
                        "message": notif.message,
                        "link": notif.link,
                        "is_read": False,
                        "created_at": notif.created_at.isoformat(),
                    }
                }
            )
    except Exception:
        pass
    return notif

