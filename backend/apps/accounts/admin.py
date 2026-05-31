from django.contrib import admin
from .models import CustomUser, SystemSetting
# Register your models here.
admin.site.register([CustomUser, SystemSetting])