from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase

from apps.catalog.models import Category, Product, ProductVariant, Brand, Size
from apps.cart.models import Cart, CartItem

class CartAPITestCase(APITestCase):
     def setUp(self):
          '''Initialize metadata for badminton products'''
          self.category = Category.objects.create(name="Shoes", slug="shoes")
          self.brand = Brand.objects.create(name="Yonex", slug="yonex")
          self.size_42 = Size.objects.create(name="42", type="shoes")

          '''Create a specific Badminton Shoe product'''
          self.shoe = Product.objects.create(
               name="Yonex Power Cushion 65Z3",
               slug="yonex-65z3-white",
               base_price=Decimal("2565000.00"),
               category=self.category,
               brand=self.brand,
               is_active=True,
          )
          self.shoe_variant = ProductVariant.objects.create(
               product=self.shoe,
               size=self.size_42,
               color="White/Tiger",
               stock=5,
               price=Decimal("2800000.00"),
               sale_price=Decimal("2650000.00"),
               sale_ends_at=timezone.now() + timedelta(days=2),
               is_active=True,
          )

          self.add_url = reverse("cart:add-item")
          self.get_cart_stat_url = reverse("cart:get-cart-stat")

     def test_add_badminton_shoe_to_cart(self):
          '''Test adding a specific shoe variant to cart and verify effective price logic'''
          data = {
               "product_id": self.shoe.id,
               "variant_id": self.shoe_variant.id,
               "quantity": 1,
          }
          response = self.client.post(self.add_url, data, format="json")

          self.assertEqual(response.status_code, status.HTTP_201_CREATED)
          self.assertEqual(Decimal(response.data["price"]), Decimal("2650000.00"))
          self.assertIn('cart_code', response.data)

     def test_add_item_insufficient_stock(self):
          '''Test that adding more items than available stock returns 400 Bad Request'''
          data = {
               "product_id": self.shoe.id,
               "variant_id": self.shoe_variant.id,
               "quantity": 10
          }

          response = self.client.post(self.add_url, data, format="json")
          self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
          self.assertIn("Không đủ sản phẩm", response.data['detail'])

     def test_decrease_by_change_button(self):
          '''Test pressing the minus button on GUI sends change: -1'''
          cart = Cart.objects.create(cart_code="shuttlex-test")
          item = CartItem.objects.create(
               cart=cart, 
               product=self.shoe, 
               variant=self.shoe_variant,
               quantity=2, 
               price=Decimal("2650000.00"), 
               total=Decimal("5300000.00")
          )

          url = reverse('cart:update-item-quantity', kwargs={'product_id': self.shoe.id})
          response = self.client.patch(
               url,
               {"cart_code": "shuttlex-test", "change": -1, "variant_id": self.shoe_variant.id},
               format='json'
          )

          self.assertEqual(response.status_code, 200)
          self.assertEqual(response.data['quantity'], 1)

     def test_decrease_quantity_to_zero_removes_item(self):
          '''Test: Decreasing quantity to 0 via change: -1 should delete the item'''
          cart = Cart.objects.create(cart_code="delete-test")
          CartItem.objects.create(
               cart=cart, 
               product=self.shoe, 
               variant=self.shoe_variant,
               quantity=1, 
               price=Decimal("2650000.00"), 
               total=Decimal("2650000.00")
          )

          url = reverse('cart:update-item-quantity', kwargs={'product_id': self.shoe.id})
          response = self.client.patch(
               url,
               {
                    "cart_code": "delete-test", 
                    "change": -1, 
                    "variant_id": self.shoe_variant.id
               },
               format='json'
          )

          self.assertEqual(response.status_code, status.HTTP_200_OK)
          self.assertEqual(response.data['detail'], "Sản phẩm đã được xóa khỏi giỏ hàng.")
          
          exists = CartItem.objects.filter(cart=cart, product=self.shoe).exists()
          self.assertFalse(exists)
     
     def test_cart_item_limit_protection(self):
          '''Test: Cannot add more than 50 unique items to a single cart'''
          cart = Cart.objects.create(cart_code="limit-test")
          
          for i in range(50):
               p = Product.objects.create(
                    name=f"Vợt ảo {i}", slug=f"vot-ao-{i}", 
                    base_price=1000, category=self.category
               )
               CartItem.objects.create(cart=cart, product=p, quantity=1, price=1000, total=1000)
               
          data = {
               "cart_code": "limit-test",
               "product_id": self.shoe.id,
               "variant_id": self.shoe_variant.id,
               "quantity": 1
          }
          response = self.client.post(self.add_url, data, format="json")

          self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
          self.assertIn("Giỏ hàng tối đa 50 sản phẩm", response.data['detail'])