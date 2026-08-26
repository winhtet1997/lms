from django.contrib import admin
from django.contrib.auth.models import Permission
from .models import User, UserOTP, CustomGroupMembership

admin.site.register(User)
admin.site.register(UserOTP)
admin.site.register(CustomGroupMembership)
admin.site.register(Permission)
