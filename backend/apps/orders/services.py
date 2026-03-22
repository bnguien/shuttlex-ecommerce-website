from decimal import Decimal
from typing import Optional

from django.db import transaction
from django.utils import timezone

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
from apps.promotions.models import Voucher

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
     note: str = "",
) -> Order:
     cart_items = (
          CartItem.objects
          .select_related("product", "variant")
          .filter(cart=cart)
     )

     if not cart_items.exists():
          raise ValueError("Giỏ hàng trống.")

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

     for ci in cart_items:
          if ci.variant_id:
               variant = variant_map[ci.variant_id]
               unit_price = variant.get_effective_price()
          else:
               product = product_map[ci.product_id]
               unit_price = product.get_effective_price()
          
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

     if product_voucher_code:
          product_voucher = Voucher.objects.filter(
               code=product_voucher_code,
               voucher_type=Voucher.VoucherType.PRODUCT,
          ).first()
          if product_voucher:
               product_discount_amount = product_voucher.calculate_discount(subtotal)
     
     if shipping_voucher_code:
          shipping_voucher = Voucher.objects.filter(
               code=shipping_voucher_code,
               voucher_type=Voucher.VoucherType.SHIPPING,
          ).first()
          if shipping_voucher:
               shipping_discount_amount = shipping_voucher.calculate_discount(
                    order_subtotal=subtotal, shipping_fee=shipping_fee
               )
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

     OrderHistory.objects.create(
          order=order,
          from_status="",
          to_status=OrderStatus.PENDING,
          from_payment_status="",
          to_payment_status=PaymentStatus.PENDING,
          note="Đơn hàng được tạo.",
     )
     if payment_method != PaymentMethod.BANK_TRANSFER:
          cart.items.all().delete()
     return order

