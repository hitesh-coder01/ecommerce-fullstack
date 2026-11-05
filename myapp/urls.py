from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),

    # Products & Categories
    path('api/products/', views.product_list, name='product-list'),
    path('api/products/<int:pk>/', views.product_detail, name='product-detail'), # <-- Naya Detail Route
    path('api/categories/', views.category_list, name='category-list'),

    # Cart APIs
    path('api/cart/', views.view_cart, name='view-cart'),
    path('api/cart/add/', views.add_to_cart, name='add-to-cart'),
    path('api/cart/update/<int:pk>/', views.update_cart_quantity, name='update-cart-quantity'),
    path('api/cart/remove/<int:pk>/', views.remove_from_cart, name='remove-from-cart'),

    # Orders & Checkout
    path('api/checkout/', views.checkout_order, name='checkout-order'),
    path('api/orders/', views.order_history, name='order-history'),
]