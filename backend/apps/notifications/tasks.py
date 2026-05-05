from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Notification
import logging

logger = logging.getLogger(__name__)

@shared_task(name="notifications.cleanup_old_notifications")
def cleanup_old_notifications():
    threshold = timezone.now() - timedelta(days=30)
    count, _ = Notification.objects.filter(is_read=True, created_at__lt=threshold).delete()
    suffix = "s" if count != 1 else ""
    msg = f"Deleted {count} read notification{suffix} older than 30 days."
    
    logger.info(f"[Notification Cleanup] {msg}")
    return msg
