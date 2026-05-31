import threading
from django.conf import settings
from django.core.mail import send_mail
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from apps.cart.models import Cart
from apps.orders.models import Order, PaymentMethod, PaymentStatus, OrderHistory
from apps.notifications.models import Notification

#Tạo OrderHistory, gửi email xác nhận, tạo Notification loại ORDER_STATUS
def _send_async_email(subject: str, message: str, recipient_list: list[str]) -> None:
     def _worker():
          send_mail(
               subject=subject,
               message=message,
               from_email=settings.DEFAULT_FROM_EMAIL,
               recipient_list=recipient_list,
               fail_silently=True,
          )
     threading.Thread(target=_worker, daemon=True).start()

@receiver(pre_save, sender=Order)
def order_pre_save(sender, instance: Order, **kwargs):
     if not instance.pk:
          instance._old_status = ""
          instance._old_payment_status = ""
          return 
     try:
          old = Order.objects.get(pk=instance.pk)
          instance._old_status = old.status
          instance._old_payment_status = old.payment_status
     except Order.DoesNotExist:
          instance._old_status = ""
          instance._old_payment_status = ""

@receiver(post_save, sender=Order)
def order_post_save(sender, instance: Order, created: bool, **kwargs):
     '''
     - Ghi OrderHistory khi status/payment_status thay đổi (chỉ khi update, KHÔNG khi tạo mới).
     - Gửi email & notification khi tạo mới hoặc thanh toán thành công.
     '''
     old_status = getattr(instance, "_old_status", "")
     old_payment_status = getattr(instance, "_old_payment_status", "")

     if not created:
          if old_status != instance.status or old_payment_status != instance.payment_status:
               OrderHistory.objects.create(
                    order=instance,
                    from_status=old_status,
                    to_status=instance.status,
                    from_payment_status=old_payment_status,
                    to_payment_status=instance.payment_status,
                    note="Đơn hàng được cập nhật (qua signal).",
               )

     if created and not instance.order_email_sent:
          if instance.payment_method == PaymentMethod.BANK_TRANSFER:
               subject = f"[ShuttleX] Đơn hàng {instance.code} đang chờ thanh toán"
               message = (
                    "Đơn hàng của bạn đã được tạo và đang chờ thanh toán chuyển khoản. "
                    "Vui lòng hoàn tất thanh toán để chúng tôi bắt đầu xử lý đơn hàng."
               )
               notification_message = "Đơn hàng của bạn đang chờ thanh toán chuyển khoản."
          else:
               subject = f"[ShuttleX] Xác nhận đơn hàng {instance.code}"
               message = "Cảm ơn bạn đã đặt hàng tại ShuttleX. Chúng tôi đang xử lý đơn hàng của bạn."
               notification_message = "Đơn hàng của bạn đang chờ xử lý."

          _send_async_email(subject, message, [instance.user.email])
          instance.order_email_sent = True
          instance.save(update_fields=["order_email_sent"])

          Notification.objects.create(
               user=instance.user,
               title=f"Đơn hàng {instance.code} đã được tạo",
               message=notification_message,
               notification_type=Notification.NotificationType.ORDER_STATUS,
               link=f"/orders/{instance.id}",
          )

     if (
          not created
          and instance.payment_status == PaymentStatus.PAID
          and not instance.payment_email_sent
     ):
          subject = f"[ShuttleX] Thanh toán thành công cho đơn {instance.code}"
          message = "Thanh toán của bạn đã được xác nhận. Đơn hàng sẽ sớm được xử lý và giao tới bạn."
          _send_async_email(subject, message, [instance.user.email])
          instance.payment_email_sent = True
          instance.save(update_fields=["payment_email_sent"])

          Notification.objects.create(
               user=instance.user,
               title=f"Thanh toán thành công - {instance.code}",
               message="Thanh toán của bạn đã được xác nhận.",
               notification_type=Notification.NotificationType.ORDER_STATUS,
               link=f"/orders/{instance.id}",
          )

          Cart.objects.filter(user=instance.user, is_active=True).delete()