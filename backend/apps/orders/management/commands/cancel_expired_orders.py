import logging

from django.core.management import BaseCommand
from django.db.models import F
from django.db import transaction
from django.utils import timezone

from apps.catalog.models import Product, ProductVariant
from apps.orders.models import Order, OrderHistory, OrderStatus, PaymentStatus
from apps.promotions.models import FlashSaleItem, Voucher, VoucherUsage

logger = logging.getLogger(__name__)


class Command(BaseCommand):
     help = "Cancel expired bank transfer orders and restore stock."

     def handle(self, *args, **options):
          now = timezone.now()
          expired_orders = list(
               Order.objects.filter(
               payment_method="BANK_TRANSFER",
               status=OrderStatus.PENDING,
               payment_status=PaymentStatus.PENDING,
               reservation_expires_at__lt=now,
               )
               .select_related("user", "product_voucher", "shipping_voucher")
               .prefetch_related("items")
          )

          if not expired_orders:
               self.stdout.write(self.style.SUCCESS("Không có đơn hàng nào quá hạn cần xử lý."))
               return

          variant_return_map = {}  
          product_return_map = {} 
          flash_sale_return_map = {}  
          order_ids = []

          for order in expired_orders:
               order_ids.append(order.id)
               for item in order.items.all():
                    if item.variant_id:
                         variant_return_map[item.variant_id] = variant_return_map.get(item.variant_id, 0) + item.quantity
                    elif item.product_id:
                         product_return_map[item.product_id] = product_return_map.get(item.product_id, 0) + item.quantity

                    flash_item = (
                         FlashSaleItem.objects.filter(
                              product_id=item.product_id,
                              sale_price=item.price_at_purchase,
                              flash_sale__start_time__lte=order.created_at,
                              flash_sale__end_time__gt=order.created_at,
                         )
                         .order_by("flash_sale__end_time", "id")
                         .first()
                    )
                    if flash_item:
                         flash_sale_return_map[flash_item.id] = flash_sale_return_map.get(flash_item.id, 0) + item.quantity

          try:
               with transaction.atomic():
                    for v_id, qty in variant_return_map.items():
                         ProductVariant.objects.filter(id=v_id).select_for_update().update(stock=F("stock") + qty)

                    for p_id, qty in product_return_map.items():
                         Product.objects.filter(id=p_id).select_for_update().update(base_stock=F("base_stock") + qty)

                    for fs_item_id, qty in flash_sale_return_map.items():
                         updated = FlashSaleItem.objects.filter(
                              id=fs_item_id,
                              sold_count__gte=qty,
                         ).select_for_update().update(sold_count=F("sold_count") - qty)
                         if not updated:
                              FlashSaleItem.objects.filter(id=fs_item_id).select_for_update().update(sold_count=0)

                    usages = VoucherUsage.objects.filter(order_id__in=order_ids)
                    voucher_usage_counts = {}
                    for usage in usages:
                         voucher_usage_counts[usage.voucher_id] = voucher_usage_counts.get(usage.voucher_id, 0) + 1

                    usages.delete()

                    for voucher_id, usage_count in voucher_usage_counts.items():
                         Voucher.objects.filter(id=voucher_id, used_count__gte=usage_count).update(
                              used_count=F("used_count") - usage_count
                         )

                    Order.objects.filter(id__in=order_ids).update(status=OrderStatus.CANCELLED, updated_at=now)

                    history_logs = [
                         OrderHistory(
                              order_id=oid,
                              from_status=OrderStatus.PENDING,
                              to_status=OrderStatus.CANCELLED,
                              note="Hệ thống tự hủy đơn và hoàn kho do quá hạn thanh toán (30 phút).",
                         )
                         for oid in order_ids
                    ]
                    OrderHistory.objects.bulk_create(history_logs)

                    success_msg = f"Đã hủy {len(order_ids)} đơn hàng thành công."
                    self.stdout.write(self.style.SUCCESS(success_msg))
                    logger.info(success_msg)
          except Exception as e:
               error_msg = f"Lỗi nghiêm trọng khi hoàn kho: {str(e)}. Không thể hoàn kho."
               self.stdout.write(self.style.ERROR(error_msg))
               logger.error(error_msg)

