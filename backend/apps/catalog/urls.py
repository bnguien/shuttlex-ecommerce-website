from django.urls import path
from . import views

urlpatterns = [
    path("products/", views.products, name="products"),
    path("product_detail/<slug:slug>/", views.product_detail, name="product_detail"),
    path("categories/", views.categories, name="categories"),
    path("brands/", views.brands, name="brands"),
    path("sizes/", views.sizes, name="sizes"),
]
