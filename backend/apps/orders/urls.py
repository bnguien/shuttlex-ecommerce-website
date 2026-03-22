from django.urls import path
from . import views

urlpatterns = [
	path("shipping-methods/", views.shipping_methods),
	path("order-addresses/", views.order_addresses),
	path("checkout/", views.checkout),
	path("my-orders/", views.my_orders),
	path("my-orders/<str:code>/", views.order_detail),
]