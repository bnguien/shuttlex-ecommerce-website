from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.notifications.models import Notification
from apps.promotions.models import FlashSale


@shared_task(name="apps.promotions.tasks.run_flash_sale_scheduler")
def run_flash_sale_scheduler():
    now = timezone.now()

    with transaction.atomic():
        FlashSale.objects.filter(is_active=True, end_time__lte=now).update(is_active=False)

        sales_to_notify = list(
            FlashSale.objects.filter(
                is_active=True,
                start_time__lte=now,
                end_time__gt=now,
                notified=False,
            )
        )

        if not sales_to_notify:
            return

        user_ids = list(get_user_model().objects.filter(is_active=True).values_list("id", flat=True))
        if not user_ids:
            FlashSale.objects.filter(id__in=[sale.id for sale in sales_to_notify]).update(notified=True)
            return

        notifications = []
        for sale in sales_to_notify:
            for user_id in user_ids:
                notifications.append(
                    Notification(
                        user_id=user_id,
                        title=f"Flash Sale: {sale.name}",
                        message="Flash sale vừa bắt đầu, số lượng có hạn. Mua ngay trước khi hết lượt!",
                        notification_type=Notification.NotificationType.PROMOTION,
                        link="/flash-sale",
                    )
                )

        Notification.objects.bulk_create(notifications, batch_size=500)
        FlashSale.objects.filter(id__in=[sale.id for sale in sales_to_notify]).update(notified=True)
