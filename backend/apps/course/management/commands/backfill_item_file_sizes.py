from botocore.exceptions import ClientError
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.course.models import Item
from apps.course.s3 import get_s3_client


class Command(BaseCommand):
    help = "Backfill Item.file_size for items uploaded before file_size was tracked."

    def handle(self, *args, **options):
        s3 = get_s3_client()
        items = Item.objects.filter(file_size__isnull=True)
        updated = 0
        skipped = 0

        for item in items:
            if not item.file or not item.file.name:
                continue

            try:
                response = s3.head_object(
                    Bucket=settings.AWS_S3_BUCKET_NAME,
                    Key=item.file.name,
                )
            except ClientError as e:
                self.stderr.write(
                    f"Skipping item {item.id} ({item.file.name}): {e}"
                )
                skipped += 1
                continue

            item.file_size = response["ContentLength"]
            item.save(update_fields=["file_size"])
            updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Updated {updated} item(s), skipped {skipped}.")
        )
