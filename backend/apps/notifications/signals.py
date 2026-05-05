from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.orders.models import Order, OrderStatus, PaymentStatus
from .utils import send_notification

ORDER_STATUS_MESSAGES = {
    OrderStatus.CONFIRMED: (
        "✅ Đơn hàng đã xác nhận",
        "Đơn hàng {code} với {count} sản phẩm đang được chuẩn bị."
    ),
    OrderStatus.PACKING: (
        "📦 Đang đóng gói",
        "Đơn hàng {code} đang đóng gói với {count} sản phẩm."
    ),
    OrderStatus.DELIVERED: (
        "🎉 Giao hàng thành công",
        "Đơn hàng {code} đã được giao thành công. Hãy đánh giá sản phẩm!"
    ),
    OrderStatus.CANCELLED: (
        "❌ Đơn hàng đã hủy",
        "Đơn hàng {code} đã bị hủy. Nhấn để xem chi tiết!"
    ),
}

@receiver(post_save, sender=Order)
def on_order_save(sender, instance, created, **kwargs):
    order = instance
    link = f"/orders/{order.code}"
    
    if created:
        send_notification(
            user=order.user,
            title="🛒 Đặt hàng thành công",
            message=f"Đơn hàng {order.code} đã được đặt. Vui lòng thanh toán để xử lý.",
            notif_type="ORDER",
            link=link,
        )
        return
    
    update_fields = kwargs.get("update_fields") or []
    if "payment_status" in update_fields or not update_fields:
        if order.payment_status == PaymentStatus.PAID:
            send_notification(
                user=order.user,
                title="💳 Thanh toán thành công",
                message=f"Đơn hàng {order.code} đã được thanh toán. Cảm ơn bạn đã lựa chọn ShuttleX!",
                notif_type="ORDER",
                link=link,
            )
            
        if order.status in ORDER_STATUS_MESSAGES:
            title_tpl, msg_tpl = ORDER_STATUS_MESSAGES[order.status]
            send_notification(
                user=order.user,
                title=title_tpl,
                message=msg_tpl.format(code=order.code),
                notif_type="ORDER",
                link=link,
            )
