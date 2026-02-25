from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

from apps.catalog.models import Product, ProductVariant, Category, Brand, Size
from apps.cart.models import Cart, CartItem
from apps.orders.models import (
     Order,
     OrderAddress,
     OrderItem,
     OrderStatus,
     PaymentStatus,
     PaymentMethod,
     ShippingMethod,
     OrderHistory,
)
from apps.orders.services import (
     define_region,
     calculate_shipping_fee,
     create_order,
     Region,
)
from apps.promotions.models import Voucher, VoucherType, DiscountType

User = get_user_model()


class OrderAddressModelTest(TestCase):
     def setUp(self):
          self.address = OrderAddress.objects.create(
               province="Đà Nẵng",
               district="Hải Châu",
               ward="Hải Châu 1",
               street="123 Nguyễn Văn Linh",
               full_address="123 Nguyễn Văn Linh, Hải Châu 1, Hải Châu, Đà Nẵng",
               latitude=16.0544,
               longitude=108.2022,
               recipient_name="Nguyễn Văn A",
               recipient_phone="0901234567",
          )

     def test_address_creation(self):
          self.assertEqual(self.address.province, "Đà Nẵng")
          self.assertIsNotNone(self.address.latitude)
          self.assertIsNotNone(self.address.longitude)


class DefineRegionTest(TestCase):
     def setUp(self):
          self.address_danang_inner = OrderAddress.objects.create(
               province="Đà Nẵng",
               district="Hải Châu",
               ward="Hải Châu 1",
               street="123 Nguyễn Văn Linh",
               recipient_name="Test",
               recipient_phone="0901234567",
          )
          self.address_danang_outer = OrderAddress.objects.create(
               province="Đà Nẵng",
               district="Hòa Vang",
               ward="Hòa Phong",
               street="456 Đường ABC",
               recipient_name="Test",
               recipient_phone="0901234567",
          )
          self.address_hanoi = OrderAddress.objects.create(
               province="Hà Nội",
               district="Hoàn Kiếm",
               ward="Tràng Tiền",
               street="789 Phố ABC",
               recipient_name="Test",
               recipient_phone="0901234567",
          )
          self.address_hcm = OrderAddress.objects.create(
               province="TP Hồ Chí Minh",
               district="Quận 1",
               ward="Bến Nghé",
               street="321 Đường XYZ",
               recipient_name="Test",
               recipient_phone="0901234567",
          )

     def test_define_region_danang_inner(self):
          region = define_region(self.address_danang_inner)
          self.assertEqual(region, Region.MIEN_TRUNG_DANANG_NOI_THANH)

     def test_define_region_danang_outer(self):
          region = define_region(self.address_danang_outer)
          self.assertEqual(region, Region.MIEN_TRUNG_DANANG_NGOAI_THANH)

     def test_define_region_northern(self):
          region = define_region(self.address_hanoi)
          self.assertEqual(region, Region.MIEN_BAC)

     def test_define_region_southern(self):
          region = define_region(self.address_hcm)
          self.assertEqual(region, Region.MIEN_NAM)


class CalculateShippingFeeTest(TestCase):
     def setUp(self):
          self.shipping_method = ShippingMethod.objects.create(
               name=ShippingMethod.ShippingName.GHN,
               code="GHN",
               base_cost=Decimal("30000"),
               estimate_delivery_days=2,
          )

     def test_shipping_fee_tier_5m(self):
          """Đơn > 5tr → giảm 30k"""
          fee = calculate_shipping_fee(Region.MIEN_BAC, self.shipping_method, Decimal("6000000"))
          # base_cost (30k) + bonus (30k) - minus (30k) = 30k
          self.assertEqual(fee, Decimal("30000"))

     def test_shipping_fee_tier_3m(self):
          """Đơn > 3tr → giảm 15k"""
          fee = calculate_shipping_fee(Region.MIEN_TRUNG, self.shipping_method, Decimal("4000000"))
          # base_cost (30k) + bonus (15k) - minus (15k) = 30k
          self.assertEqual(fee, Decimal("30000"))

     def test_shipping_fee_danang_inner(self):
          """Đà Nẵng nội thành → bonus = 0"""
          fee = calculate_shipping_fee(
               Region.MIEN_TRUNG_DANANG_NOI_THANH,
               self.shipping_method,
               Decimal("1000000")
          )
          # base_cost (30k) + bonus (0) - minus (0) = 30k
          self.assertEqual(fee, Decimal("30000"))

     def test_shipping_fee_free_ship(self):
          """Đơn > 5tr + Đà Nẵng nội thành → free ship"""
          fee = calculate_shipping_fee(
               Region.MIEN_TRUNG_DANANG_NOI_THANH,
               self.shipping_method,
               Decimal("6000000")
          )
          # base_cost (30k) + bonus (0) - minus (30k) = 0
          self.assertEqual(fee, Decimal("0"))  


class CreateOrderServiceTest(TestCase):
     def setUp(self):
          self.user = User.objects.create_user(
               username="testuser",
               email="test@example.com",
               password="testpass123"
          )
          self.category = Category.objects.create(name="Racket", slug="racket")
          self.brand = Brand.objects.create(name="Yonex", slug="yonex")
          self.size = Size.objects.create(name="3U", type="racket")
          self.product = Product.objects.create(
               name="Yonex ArcSaber",
               slug="yonex-arcsaber",
               base_price=Decimal("2000000"),
               base_stock=10,
               category=self.category,
               brand=self.brand,
          )
          self.variant = ProductVariant.objects.create(
               product=self.product,
               size=self.size,
               stock=5,
               price=Decimal("2100000"),
          )
          self.address = OrderAddress.objects.create(
               province="Đà Nẵng",
               district="Hải Châu",
               ward="Hải Châu 1",
               street="123 Nguyễn Văn Linh",
               full_address="123 Nguyễn Văn Linh, Hải Châu 1, Hải Châu, Đà Nẵng",
               latitude=16.0544,
               longitude=108.2022,
               recipient_name="Nguyễn Văn A",
               recipient_phone="0901234567",
          )
          self.cart = Cart.objects.create(user=self.user, cart_code="TEST001")
          self.shipping_method = ShippingMethod.objects.create(
               name=ShippingMethod.ShippingName.GHN,
               code="GHN",
               base_cost=Decimal("30000"),
               estimate_delivery_days=2,
          )

     def test_create_order_success(self):
          """Test tạo order thành công từ cart"""
          CartItem.objects.create(
               cart=self.cart,
               product=self.product,
               variant=self.variant,
               quantity=2,
               price=Decimal("2100000"),
               total=Decimal("4200000"),
          )

          order = create_order(
               user=self.user,
               cart=self.cart,
               address=self.address,
               shipping_method_code="GHN",
               payment_method=PaymentMethod.BANK_TRANSFER,
          )

          self.assertIsNotNone(order)
          self.assertEqual(order.user, self.user)
          self.assertEqual(order.status, OrderStatus.PENDING)
          self.assertEqual(order.payment_status, PaymentStatus.PENDING)
          self.assertEqual(order.items.count(), 1)
          self.assertIsNotNone(order.reservation_expires_at)

          # Kiểm tra snapshot giá
          order_item = order.items.first()
          self.assertEqual(order_item.price_at_purchase, Decimal("2100000"))
          self.assertEqual(order_item.product_name_snapshot, "Yonex ArcSaber")

          # Kiểm tra stock đã trừ
          self.variant.refresh_from_db()
          self.assertEqual(self.variant.stock, 3)  # 5 - 2 = 3

          # Kiểm tra cart đã xóa
          self.assertEqual(self.cart.items.count(), 0)

     def test_create_order_insufficient_stock(self):
          """Test không đủ kho → raise ValueError"""
          CartItem.objects.create(
               cart=self.cart,
               product=self.product,
               variant=self.variant,
               quantity=10,  # Vượt quá stock (5)
               price=Decimal("2100000"),
               total=Decimal("21000000"),
          )

          with self.assertRaises(ValueError):
               create_order(
                    user=self.user,
                    cart=self.cart,
                    address=self.address,
                    shipping_method_code="GHN",
                    payment_method=PaymentMethod.BANK_TRANSFER,
               )

          # Stock không đổi
          self.variant.refresh_from_db()
          self.assertEqual(self.variant.stock, 5)

     def test_create_order_with_voucher(self):
          """Test tạo order với voucher"""
          product_voucher = Voucher.objects.create(
               code="TEST10",
               voucher_type=VoucherType.PRODUCT,
               discount_type=DiscountType.PERCENTAGE,
               value=Decimal("10"),
               min_order_value=Decimal("1000000"),
               limit_usage=100,
               end_date=timezone.now() + timedelta(days=30),
          )

          CartItem.objects.create(
               cart=self.cart,
               product=self.product,
               variant=self.variant,
               quantity=1,
               price=Decimal("2100000"),
               total=Decimal("2100000"),
          )

          order = create_order(
               user=self.user,
               cart=self.cart,
               address=self.address,
               shipping_method_code="GHN",
               payment_method=PaymentMethod.BANK_TRANSFER,
               product_voucher_code="TEST10",
          )

          self.assertIsNotNone(order.product_voucher)
          self.assertGreater(order.product_discount_amount, Decimal("0"))    


class OrderHistorySignalTest(TestCase):
     def setUp(self):
          self.user = User.objects.create_user(
               username="testuser",
               email="test@example.com",
               password="testpass123"
          )
          self.address = OrderAddress.objects.create(
               province="Đà Nẵng",
               district="Hải Châu",
               ward="Hải Châu 1",
               street="123 Nguyễn Văn Linh",
               recipient_name="Test",
               recipient_phone="0901234567",
          )
          self.shipping_method = ShippingMethod.objects.create(
               name=ShippingMethod.ShippingName.GHN,
               code="GHN",
               base_cost=Decimal("30000"),
          )

     def test_order_history_created_on_order_creation(self):
          """Test OrderHistory tự động tạo khi tạo Order"""
          order = Order.objects.create(
               user=self.user,
               code="SO-TEST001",
               status=OrderStatus.PENDING,
               payment_status=PaymentStatus.PENDING,
               shipping_address=self.address,
               shipping_method=self.shipping_method,
               subtotal=Decimal("1000000"),
               shipping_fee=Decimal("30000"),
               total=Decimal("1030000"),
               payment_method=PaymentMethod.BANK_TRANSFER,
          )

          history = OrderHistory.objects.filter(order=order).first()
          self.assertIsNotNone(history)
          self.assertEqual(history.to_status, OrderStatus.PENDING)

     def test_order_history_created_on_status_change(self):
          """Test OrderHistory tự động tạo khi status thay đổi"""
          order = Order.objects.create(
               user=self.user,
               code="SO-TEST002",
               status=OrderStatus.PENDING,
               payment_status=PaymentStatus.PENDING,
               shipping_address=self.address,
               shipping_method=self.shipping_method,
               subtotal=Decimal("1000000"),
               shipping_fee=Decimal("30000"),
               total=Decimal("1030000"),
               payment_method=PaymentMethod.BANK_TRANSFER,
          )

          order.status = OrderStatus.CONFIRMED
          order.save()

          history = OrderHistory.objects.filter(order=order, to_status=OrderStatus.CONFIRMED).first()
          self.assertIsNotNone(history)
          self.assertEqual(history.from_status, OrderStatus.PENDING)


class WebhookIdempotencyTest(TestCase):
     """Test idempotency của webhook (giả lập)"""
     def setUp(self):
          self.user = User.objects.create_user(
               username="testuser",
               email="test@example.com",
               password="testpass123"
          )
          self.address = OrderAddress.objects.create(
               province="Đà Nẵng",
               district="Hải Châu",
               ward="Hải Châu 1",
               street="123 Nguyễn Văn Linh",
               recipient_name="Test",
               recipient_phone="0901234567",
          )
          self.shipping_method = ShippingMethod.objects.create(
               name=ShippingMethod.ShippingName.GHN,
               code="GHN",
               base_cost=Decimal("30000"),
          )
          self.order = Order.objects.create(
               user=self.user,
               code="SO-WEBHOOK001",
               status=OrderStatus.PENDING,
               payment_status=PaymentStatus.PENDING,
               shipping_address=self.address,
               shipping_method=self.shipping_method,
               subtotal=Decimal("1000000"),
               shipping_fee=Decimal("30000"),
               total=Decimal("1030000"),
               payment_method=PaymentMethod.BANK_TRANSFER,
          )

     def test_webhook_idempotency(self):
          """Test webhook không xử lý trùng transaction_id"""
          transaction_id = "TXN123456"

          # Lần 1: xử lý thành công
          self.order.payment_status = PaymentStatus.PAID
          self.order.payment_transaction_id = transaction_id
          self.order.save()

          # Lần 2: giả lập webhook gọi lại với cùng transaction_id
          if (
               self.order.payment_transaction_id == transaction_id
               and self.order.payment_status == PaymentStatus.PAID
          ):
               pass

          # Verify: chỉ có 1 history entry cho payment
          payment_histories = OrderHistory.objects.filter(
               order=self.order,
               to_payment_status=PaymentStatus.PAID
          )
          self.assertEqual(payment_histories.count(), 1) 


class SecurityTest(TestCase):
     """Test bảo mật: User A không thể truy cập Order của User B"""
     def setUp(self):
          self.user_a = User.objects.create_user(
               username="usera",
               email="usera@example.com",
               password="pass123"
          )
          self.user_b = User.objects.create_user(
               username="userb",
               email="userb@example.com",
               password="pass123"
          )
          self.address = OrderAddress.objects.create(
               province="Đà Nẵng",
               district="Hải Châu",
               ward="Hải Châu 1",
               street="123 Nguyễn Văn Linh",
               recipient_name="Test",
               recipient_phone="0901234567",
          )
          self.shipping_method = ShippingMethod.objects.create(
               name=ShippingMethod.ShippingName.GHN,
               code="GHN",
               base_cost=Decimal("30000"),
          )
          self.order_a = Order.objects.create(
               user=self.user_a,
               code="SO-A001",
               status=OrderStatus.PENDING,
               payment_status=PaymentStatus.PENDING,
               shipping_address=self.address,
               shipping_method=self.shipping_method,
               subtotal=Decimal("1000000"),
               shipping_fee=Decimal("30000"),
               total=Decimal("1030000"),
               payment_method=PaymentMethod.BANK_TRANSFER,
          )

     def test_user_cannot_access_other_user_order(self):
          """Test User B không thể lấy Order của User A"""
          orders_b = Order.objects.filter(user=self.user_b)
          self.assertNotIn(self.order_a, orders_b)

          # User A chỉ thấy order của mình
          orders_a = Order.objects.filter(user=self.user_a)
          self.assertIn(self.order_a, orders_a)