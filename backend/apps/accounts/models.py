from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.
class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    email = models.EmailField(unique=True)  

    def __str__(self):
        return self.username
    
class UserAddress(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='addresses')
    
    receiver_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=10)
    
    province = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    street_detail = models.CharField(max_length=255)
    
    latitude = models.FloatField(null=True, blank=True)
    longtitude = models.FloatField(null=True, blank=True)
    
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-is_default', '-created_at'] 
    def __str__(self):
        return f"{self.receiver_name} - {self.street_detail}, {self.ward}, {self.province}"

class SystemSetting(models.Model):
    phone_contact = models.CharField(max_length=20, default="0123456789")
    zalo_link = models.CharField(
        max_length=255, 
        default="https://zalo.me/0123456789",
        verbose_name="Link Zalo",
        help_text="Link Zalo để hỗ trợ khách hàng",
    )
    facebook_link = models.CharField(max_length=255, default="https://m.me/shuttlex", verbose_name="Link Messenger")
    email_contact = models.EmailField(default="contact@shuttlex.com", verbose_name="Email liên hệ")
    address_contact = models.CharField(max_length=255, default="642 đường Tôn Đức Thắng, Phường Hòa Khánh, Thành phố Đà Nẵng", verbose_name="Địa chỉ")
    class Meta:
        verbose_name = "Cấu hình hệ thống"
        verbose_name_plural = "Cấu hình hệ thống"
    def __str__(self):
        return "Cấu hình hệ thống ShuttleX"