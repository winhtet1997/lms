from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import Group

from .models import User

ROLE_GROUP_MAP = {
    1: 'Student',
    2: 'Parent',
    3: 'Tutor',
    4: 'Admin',
    999: 'Super Admin',
}


@receiver(pre_save, sender=User)
def enforce_superadmin(sender, instance, **kwargs):
    if instance.role == 999:
        instance.is_superuser = True
        instance.is_staff = True


@receiver(post_save, sender=User)
def assign_user_group(sender, instance, created, **kwargs):
    if instance.role == 999:
        return
    group_name = ROLE_GROUP_MAP.get(instance.role)

    if not group_name:
        return
    group, _ = Group.objects.get_or_create(name=group_name)

    if not instance.groups.filter(name=group_name).exists():
        instance.groups.add(group)
