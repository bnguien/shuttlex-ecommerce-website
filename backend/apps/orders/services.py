import logging
import os
import time
import uuid
from decimal import Decimal
from contextlib import contextmanager
from typing import Optional

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

try:
     import redis  # type: ignore
except Exception:
     redis = None

from apps.cart.models import CartItem
from apps.catalog.models import Product, ProductVariant
from apps.orders.models import (
     Order,
     OrderAddress, 
     OrderItem, 
     OrderStatus, 
     PaymentMethod, 
     PaymentStatus, 
     OrderHistory, 
     ShippingMethod
)
from apps.promotions.models import FlashSaleItem, Voucher, VoucherUsage

logger = logging.getLogger(__name__)

CHECKOUT_LOCK_TIMEOUT_MS = int(os.getenv("CHECKOUT_LOCK_TIMEOUT_MS", "15000"))
CHECKOUT_LOCK_BLOCKING_SEC = float(os.getenv("CHECKOUT_LOCK_BLOCKING_SEC", "3"))


def _find_active_flash_sale_item(*, product_id: int, variant_id: int | None = None, now):
     from django.db import models
     qs = (
          FlashSaleItem.objects.select_related("flash_sale")
          .select_for_update()
          .filter(
               product_id=product_id,
               flash_sale__is_active=True,
               flash_sale__start_time__lte=now,
               flash_sale__end_time__gte=now,
          )
     )
     qs = qs.filter(models.Q(variant_id=variant_id) | models.Q(variant__isnull=True))
     return qs.order_by("variant_id", "flash_sale__end_time", "id").first()


def _validate_voucher_for_user(*, voucher: Voucher, user, subtotal: Decimal, shipping_fee: Decimal):
     if VoucherUsage.objects.filter(voucher=voucher, user=user).exists():
          raise ValueError("Bạn đã sử dụng voucher này rồi.")

     if voucher.new_customer_only:
          has_previous_orders = user.orders.exclude(status=OrderStatus.CANCELLED).exists()
          if has_previous_orders:
               raise ValueError("Voucher này chỉ áp dụng cho khách hàng đặt đơn lần đầu.")

     if voucher.voucher_type.code == "SHIPPING":
          discount_amount = voucher.calculate_discount(subtotal, shipping_fee)
     else:
          discount_amount = voucher.calculate_discount(subtotal)

     if discount_amount <= 0:
          raise ValueError(f"Voucher {voucher.code} không hợp lệ cho đơn hàng này.")

     return discount_amount


def _get_redis_client():
     if redis is None:
          return None

     redis_url = (
          os.getenv("REDIS_LOCK_URL")
          or os.getenv("CELERY_BROKER_URL")
          or "redis://127.0.0.1:6379/0"
     )
     try:
          return redis.Redis.from_url(redis_url, decode_responses=True)
     except Exception:
          logger.warning("Không khởi tạo được Redis client để lock checkout.", exc_info=True)
          return None


def _build_checkout_lock_keys(cart_items) -> list[str]:
     lock_keys = set()
     for ci in cart_items:
          if ci.variant_id:
               lock_keys.add(f"checkout:variant:{ci.variant_id}")
          elif ci.product_id:
               lock_keys.add(f"checkout:product:{ci.product_id}")
     return sorted(lock_keys)


@contextmanager
def _acquire_checkout_locks(cart_items):
     keys = _build_checkout_lock_keys(cart_items)
     if not keys:
          yield
          return

     client = _get_redis_client()
     if not client:
          yield
          return

     token = uuid.uuid4().hex
     acquired_keys = []
     deadline = time.monotonic() + CHECKOUT_LOCK_BLOCKING_SEC

     try:
          for key in keys:
               locked = False
               while time.monotonic() < deadline:
                    try:
                         locked = bool(client.set(key, token, nx=True, px=CHECKOUT_LOCK_TIMEOUT_MS))
                    except Exception:
                         logger.warning("Redis lock checkout bị lỗi, fallback DB lock.", exc_info=True)
                         locked = True
                         break

                    if locked:
                         break

                    time.sleep(0.05)

               if not locked:
                    raise ValueError("Hệ thống đang xử lý sản phẩm này. Vui lòng thử lại sau vài giây.")

               acquired_keys.append(key)

          yield
     finally:
          for key in acquired_keys:
               try:
                    client.eval(
                         """
                         if redis.call('get', KEYS[1]) == ARGV[1] then
                              return redis.call('del', KEYS[1])
                         end
                         return 0
                         """,
                         1,
                         key,
                         token,
                    )
               except Exception:
                    logger.warning("Không giải phóng được Redis lock key=%s", key, exc_info=True)

def validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> None:
     '''
     Kiểm tra kinh độ/vĩ độ cơ bản.
     '''
     if latitude is None or longitude is None:
          return
     if not(-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
          raise ValueError("Tọa độ không hợp lệ.")

#---- Phân vùng địa lý: define_region ----
class Region:
     MIEN_BAC = "MIEN_BAC"
     MIEN_TRUNG = "MIEN_TRUNG"
     MIEN_NAM = "MIEN_NAM"
     NOI_THANH = "NOI_THANH"
     MIEN_TRUNG_DANANG_NOI_THANH = "MIEN_TRUNG_DANANG_NOI_THANH"
     MIEN_TRUNG_DANANG_NGOAI_THANH = "MIEN_TRUNG_DANANG_NGOAI_THANH"

NORTHERN_PROVINCES = {
     "hà nội",
     "hải phòng",
     "quảng ninh",
     "bắc ninh",
     "bắc giang",
     "hưng yên",
     "thái nguyên",
     "vĩnh phúc",
     "phú thọ",
     "nam định",
     "thái bình",
     "ninh bình",
     #...còn thiếu
}

CENTRAL_PROVINCES = {
     "đà nẵng",
     "thừa thiên huế",
     "quảng trị",
     "quảng bình",
     "quảng nam",
     "quảng ngãi",
     "bình định",
     "phú yên",
     "khánh hòa",
     "ninh thuận",
     "bình thuận",
     "kon tum",
     "gia lai",
     "đắk lắk",
     "đắk nông",
     "lâm đồng",
}

SOUTHERN_PROVINCES = {
     "tp hồ chí minh",
     "hồ chí minh",
     "đồng nai",
     "bình dương",
     "bà rịa - vũng tàu",
     "cần thơ",
     "an giang",
     "đồng tháp",
     "long an",
     "tiền giang",
     "bến tre",
     "vĩnh long",
     "trà vinh",
     "kiên giang",
     "hậu giang",
     "bạc liêu",
     "cà mau",
     "sóc trăng",
     # ... bổ sung dần
}

DANANG_INNER_DISTRICTS = {
     "hải châu",
     "thanh khê",
     "sơn trà",
     "ngũ hành sơn",
     "liên chiểu",
     "cẩm lệ",
}

def normalize_name(value: str) -> str:
     return (value or "").strip().lower()

def define_region(address: OrderAddress) -> str:
     province = normalize_name(address.province)
     district = normalize_name(address.district)

     if province == "đà nẵng":
          if district in DANANG_INNER_DISTRICTS:
               return Region.MIEN_TRUNG_DANANG_NOI_THANH
          else:
               return Region.MIEN_TRUNG_DANANG_NGOAI_THANH
          
     if province in NORTHERN_PROVINCES:
          return Region.MIEN_BAC
     if province in CENTRAL_PROVINCES:
          return Region.MIEN_TRUNG
     if province in SOUTHERN_PROVINCES:
          return Region.MIEN_NAM
     
     return Region.MIEN_TRUNG

def calculate_shipping_fee(region, shipping_method, order_subtotal):
     bonus_cost = Decimal("0")
     minus_cost = Decimal("0")
     if region in (Region.MIEN_BAC, Region.MIEN_NAM):
          bonus_cost = Decimal("30000")
     elif region in (Region.MIEN_TRUNG, Region.MIEN_TRUNG_DANANG_NGOAI_THANH):
          bonus_cost = Decimal("15000")
     elif region == Region.MIEN_TRUNG_DANANG_NOI_THANH:
          bonus_cost = Decimal("0")

     if order_subtotal > Decimal("5000000"):
          minus_cost = Decimal("30000")
     elif order_subtotal > Decimal("3000000"):
          minus_cost = Decimal("15000")

     shipping_fee = shipping_method.base_cost + bonus_cost - minus_cost
     return shipping_fee if shipping_fee > 0 else Decimal("0")


@transaction.atomic
def create_order(
     *, 
     user, 
     cart, 
     address: OrderAddress, 
     shipping_method_code: str,
     payment_method: str,
     product_voucher_code: Optional[str]=None,
     shipping_voucher_code: Optional[str]=None,  
     item_ids: Optional[list[int]] = None,
     note: str = "",
) -> Order:
     now = timezone.now()
     qs = CartItem.objects.select_related("product", "variant").filter(cart=cart)
     if item_ids:
          qs = qs.filter(id__in=item_ids)
     cart_items = list(qs)

     if not cart_items:
          raise ValueError("Giỏ hàng trống.")

     with _acquire_checkout_locks(cart_items):
          variant_ids = [ci.variant_id for ci in cart_items if ci.variant_id]
          product_ids = [ci.product_id for ci in cart_items if ci.product_id]

          variants = (ProductVariant.objects.select_for_update()
                         .filter(id__in= variant_ids))
          products = (Product.objects.select_for_update()
                         .filter(id__in= product_ids))

          variant_map = {v.id: v for v in variants}
          product_map = {p.id: p for p in products}

          subtotal = Decimal("0")
          order_items_data = []
          flash_sale_usage_map = {}

          for ci in cart_items:
               if ci.variant_id:
                    variant = variant_map[ci.variant_id]
                    product = variant.product
                    unit_price = variant.get_effective_price()
               else:
                    product = product_map[ci.product_id]
                    unit_price = product.get_effective_price()

               flash_item = _find_active_flash_sale_item(product_id=product.id, variant_id=variant.id if variant else None, now=now)
               if flash_item:
                    remaining = flash_item.stock_limit - flash_item.sold_count
                    if remaining < ci.quantity:
                         raise ValueError(
                              f"Flash sale của sản phẩm {product.name} không đủ số lượng (còn {max(remaining, 0)})."
                         )
                    unit_price = min(unit_price, flash_item.sale_price)
                    flash_sale_usage_map[flash_item.id] = flash_sale_usage_map.get(flash_item.id, 0) + ci.quantity

               snapshot_price = ci.price if ci.price is not None else unit_price
               if snapshot_price != unit_price:
                    raise ValueError(
                         f"Giá sản phẩm {product.name} đã thay đổi. Vui lòng kiểm tra lại giỏ hàng."
                    )
               
               line_total = unit_price * ci.quantity
               subtotal += line_total

               order_items_data.append({
                    "cart_item": ci, 
                    "unit_price": unit_price,
                    "line_total": line_total,
               })

          validate_coordinates(address.latitude, address.longitude)
          region = define_region(address)

          shipping_method = ShippingMethod.get_method_by_code(shipping_method_code)
          if not shipping_method:
               raise ValueError("Không tìm thấy phương thức vận chuyển hoặc đã bị vô hiệu hóa.")

          shipping_fee = calculate_shipping_fee(region, shipping_method, subtotal)
          product_voucher = None
          shipping_voucher = None
          product_discount_amount = Decimal("0")
          shipping_discount_amount = Decimal("0")
          applied_vouchers = []

          if product_voucher_code:
               product_voucher = Voucher.objects.select_related("voucher_type", "discount_type").select_for_update().filter(
                    code=product_voucher_code,
                    voucher_type__code="PRODUCT",
                    is_active=True,
               ).first()
               if not product_voucher:
                    raise ValueError("Không tìm thấy voucher giảm giá sản phẩm hợp lệ.")
               product_discount_amount = _validate_voucher_for_user(
                    voucher=product_voucher,
                    user=user,
                    subtotal=subtotal,
                    shipping_fee=shipping_fee,
               )
               applied_vouchers.append(product_voucher)
          
          if shipping_voucher_code:
               shipping_voucher = Voucher.objects.select_related("voucher_type", "discount_type").select_for_update().filter(
                    code=shipping_voucher_code,
                    voucher_type__code="SHIPPING",
                    is_active=True,
               ).first()
               if not shipping_voucher:
                    raise ValueError("Không tìm thấy voucher vận chuyển hợp lệ.")
               shipping_discount_amount = _validate_voucher_for_user(
                    voucher=shipping_voucher,
                    user=user,
                    subtotal=subtotal,
                    shipping_fee=shipping_fee,
               )
               applied_vouchers.append(shipping_voucher)
          discount_amount = product_discount_amount + shipping_discount_amount

          total = subtotal + shipping_fee - discount_amount
          if total < 0:
               total = Decimal("0")
          is_freeship = shipping_fee == 0
          
          from django.utils.crypto import get_random_string
          order_code = f"SO-{get_random_string(10).upper()}"
          reservation_expires_at = (
               timezone.now() + timezone.timedelta(minutes=30) 
               if payment_method == PaymentMethod.BANK_TRANSFER 
               else None
          )
          order = Order.objects.create(
               user=user,
               code=order_code,
               status=OrderStatus.PENDING,
               payment_status=PaymentStatus.PENDING,
               shipping_address=address,
               subtotal=subtotal,
               shipping_method=shipping_method,
               shipping_fee=shipping_fee,
               is_freeship=is_freeship,
               product_voucher=product_voucher,
               shipping_voucher=shipping_voucher,
               product_discount_amount=product_discount_amount,
               shipping_discount_amount=shipping_discount_amount,
               discount_amount=discount_amount,
               total=total,
               payment_method=payment_method,
               reservation_expires_at=reservation_expires_at,
               note=note,
          )

          for item_data in order_items_data:
               ci = item_data["cart_item"]
               unit_price = item_data["unit_price"]
               line_total = item_data["line_total"]

               if ci.variant_id:
                    variant = variant_map[ci.variant_id]
                    if variant.stock < ci.quantity:
                         raise ValueError("Biến thể sản phẩm không đủ tồn kho.")
                    variant.stock -= ci.quantity
                    variant.save()
                    product = variant.product
               else:
                    product = product_map[ci.product_id]
                    if product.base_stock < ci.quantity:
                         raise ValueError("Sản phẩm không đủ tồn kho.")
                    product.base_stock -= ci.quantity
                    product.save()
               
               OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant=variant_map.get(ci.variant_id),
                    quantity=ci.quantity,
                    price_at_purchase=unit_price,
                    product_name_snapshot=product.name,
                    variant_display_snapshot=str(variant) if ci.variant_id else "",
                    line_total=line_total,
               )

          for flash_item_id, quantity in flash_sale_usage_map.items():
               updated = FlashSaleItem.objects.filter(
                    id=flash_item_id,
                    sold_count__lte=F("stock_limit") - quantity,
               ).update(sold_count=F("sold_count") + quantity)
               if not updated:
                    raise ValueError("Flash sale vừa hết lượt. Vui lòng đặt lại đơn.")

          for voucher in {v.id: v for v in applied_vouchers}.values():
               if not voucher.increase_usage():
                    raise ValueError(f"Voucher {voucher.code} đã hết lượt sử dụng.")
               try:
                    VoucherUsage.objects.create(voucher=voucher, user=user, order=order)
               except IntegrityError:
                    raise ValueError("Bạn đã sử dụng voucher này rồi.")

          OrderHistory.objects.create(
               order=order,
               from_status="",
               to_status=OrderStatus.PENDING,
               from_payment_status="",
               to_payment_status=PaymentStatus.PENDING,
               note="Đơn hàng được tạo.",
          )
          if payment_method != PaymentMethod.BANK_TRANSFER:
               if item_ids:
                    cart.items.filter(id__in=item_ids).delete()
               else:
                    cart.items.all().delete()
          return order

