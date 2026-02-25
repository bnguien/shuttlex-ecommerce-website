from datetime import timedelta
import logging
from django.core.management import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.db import F

from apps.orders.models import Order, OrderStatus, PaymentStatus, OrderHistory
from apps.catalog.models import Product, ProductVariant

logger = logging.getLogger(__name__)
class Command(BaseCommand):
     help = "Cancel expired bank transfer orders and restore stock."
     def handle(self, *args, **options):
          now = timezone.now()
          expired_orders = Order.objects.filter(
               payment_method="BANK_TRANSFER",
               status=OrderStatus.PENDING,
               payment_status=PaymentStatus.PENDING,
               reservation_expires_at__lt=now,
          ).prefetch_related("items")

          if not expired_orders.exists():
               self.stdout.write(self.style.SUCCESS("Không có đơn hàng nào quá hạn cần xử lý."))
               return

          variant_return_map = {} #{id_biến_thể: tổng_số_lượng_hoàn}
          product_return_map = {} #{id_sản_phẩm: tổng_số_lượng_hoàn}
          order_ids = []

          for order in expired_orders:
               order_ids.append(order.id)
               for item in order.items.all():
                    if item.variant_id:
                         variant_return_map[item.variant_id] = variant_return_map.get(item.variant_id, 0) + item.quantity
                    elif item.product_id:
                         product_return_map[item.product_id] = product_return_map.get(item.product_id, 0) + item.quantity
               try:
                    with transaction.atomic():
                         for v_id, qty in variant_return_map.items():
                              ProductVariant.objects.filter(id=v_id).select_for_update().update(
                                   stock=F('stock') + qty
                              )
                         for p_id, qty in product_return_map.items():
                              Product.objects.filter(id=p_id).select_for_update().update(
                                   base_stock=F('base_stock') + qty
                              )
                         Order.objects.filter(id__in = order_ids).update(
                              status = OrderStatus.CANCELLED,
                              updated_at = now
                         )

                         history_logs = [
                              OrderHistory(
                                   order_id=oid,
                                   from_status=OrderStatus.PENDING,
                                   to_status=OrderStatus.CANCELLED,
                                   note="Hệ thống tự hủy đơn và hoàn kho do quá hạn thanh toán (30 phút)."
                              ) for oid in order_ids
                         ]
                         OrderHistory.objects.bulk_create(history_logs)

                         success_msg = f"Đã hủy {len(order_ids)} đơn hàng thành công."
                         self.stdout.write(self.style.SUCCESS(success_msg))
                         logger.info(success_msg)
               except Exception as e:
                    error_msg = f"Lỗi nghiêm trọng khi hoàn kho: {str(e)}. Không thể hoàn kho."
                    self.stdout.write(self.style.ERROR(error_msg))
                    logger.error(error_msg)

