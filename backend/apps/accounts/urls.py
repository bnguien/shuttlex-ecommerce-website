from django.urls import path
from .views import (
    UserRegisterView, get_username, get_first_name, get_last_name, get_email, get_user_role,
    list_users, get_user, create_user, update_user, delete_user,
    user_addresses, user_address_detail, set_default_address,
    get_system_settings, update_system_settings
)

urlpatterns = [
    path('register/', UserRegisterView, name='register'),
    path('get_username/', get_username, name='get-username'),
    path('get_first_name/', get_first_name, name='get-first-name'),
    path('get_last_name/', get_last_name, name='get-last-name'),
    path('get_email/', get_email, name='get-email'),
    path('get_user_role/', get_user_role, name='get-user-role'),
    
    path('users/', list_users, name='list-users'),
    path('users/<int:user_id>/', get_user, name='get-user'),
    path('users/create/', create_user, name='create-user'),
    path('users/<int:user_id>/update/', update_user, name='update-user'),
    path('users/<int:user_id>/delete/', delete_user, name='delete-user'),
    
    path('addresses/', user_addresses, name='user-addresses'),
    path('addresses/<int:address_id>/', user_address_detail, name='user-address-detail'),
    path('addresses/<int:address_id>/set-default/', set_default_address, name='set-default-address'),

    path('system/', get_system_settings, name='get-system-settings'),
    path('system/update/', update_system_settings, name='update-system-settings'),
]
