import boto3
from django.conf import settings


def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        endpoint_url=f"https://s3.{settings.AWS_S3_REGION}.amazonaws.com",
    )


def generate_presigned_get_url(key, expiry=21600):  # 6 hours
    """
    Returns a CloudFront URL when CLOUDFRONT_DOMAIN is configured,
    otherwise falls back to a presigned S3 URL.

    CloudFront serves from edge locations near the user — much faster
    for large video files than direct S3.
    """
    # cloudfront_domain = getattr(settings, "CLOUDFRONT_DOMAIN", "")
    # if cloudfront_domain:
    #     return f"https://{cloudfront_domain}/{key}"

    # Fallback: direct presigned S3 URL (used until CloudFront is set up)
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.AWS_S3_BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=expiry,
    )
