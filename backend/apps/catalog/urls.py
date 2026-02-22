from django.urls import path
from . import views

urlpatterns = [
    path("products/", views.products, name="products"),
    path("product_detail/<slug:slug>/", views.product_detail, name="product_detail"),
    path("categories/", views.categories, name="categories"),
    path("brands/", views.brands, name="brands"),
    path("sizes/", views.sizes, name="sizes"),
    path("create_product/", views.create_product, name="create_product"),
    path("update_product/<int:product_id>/", views.update_product, name="update_product"),
    path("delete_product/<int:product_id>/", views.delete_product, name="delete_product"),
]
