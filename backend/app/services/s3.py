import os
import uuid

import boto3
from botocore.config import Config

from dotenv import load_dotenv
from fastapi import UploadFile


# ============================================================
# Environment
# ============================================================

load_dotenv()


# ============================================================
# S3 configuration
# ============================================================

AWS_ACCESS_KEY_ID = os.getenv(
    "AWS_ACCESS_KEY_ID"
)

AWS_SECRET_ACCESS_KEY = os.getenv(
    "AWS_SECRET_ACCESS_KEY"
)

AWS_REGION = os.getenv(
    "AWS_REGION",
    "ap-south-1"
)

S3_BUCKET_NAME = os.getenv(
    "S3_BUCKET_NAME"
)


# ============================================================
# S3 Client
# ============================================================

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
    config=Config(
        signature_version="s3v4",
        s3={
            "addressing_style": "virtual",
        },
    ),
)


# ============================================================
# S3 Service
# ============================================================

class S3Service:

    # --------------------------------------------------------
    # Upload image
    # --------------------------------------------------------

    async def upload_image(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        folder: str = "uploads",
    ):
        try:

            if not file_bytes:
                raise ValueError(
                    "Uploaded file is empty."
                )

            if "." in filename:
                extension = (
                    filename
                    .rsplit(".", 1)[1]
                    .lower()
                )
            else:
                extension = "jpg"

            object_key = (
                f"{folder}/"
                f"{uuid.uuid4().hex}."
                f"{extension}"
            )

            s3.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=object_key,
                Body=file_bytes,
                ContentType=(
                    content_type
                    or "application/octet-stream"
                ),
            )

            return object_key

        except Exception as e:

            print(
                f"Error uploading image to S3: {e}"
            )

            return None
    
    # --------------------------------------------------------
    # Generate display URL
    # --------------------------------------------------------

    def generate_presigned_url(
        self,
        object_key: str,
        expiration: int = 3600,
    ):
        """
        Generate a temporary URL that the frontend
        can use to display the image.
        """
        if not object_key:
            return None

        # Handle full http/https URLs
        if object_key.startswith("http://") or object_key.startswith("https://"):
            return object_key

        # Clean up s3://<bucket>/<key> or s3:// prefix if present in legacy records
        if object_key.startswith("s3://"):
            clean_key = object_key.replace("s3://", "")
            parts = clean_key.split("/", 1)
            if len(parts) == 2:
                object_key = parts[1]
            else:
                object_key = parts[0]

        try:
            url = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": S3_BUCKET_NAME,
                    "Key": object_key,
                },
                ExpiresIn=expiration,
            )

            return url

        except Exception as e:
            print(
                f"Error generating S3 URL for key {object_key}: {e}"
            )

            return None

    # --------------------------------------------------------
    # Delete image
    # --------------------------------------------------------

    def delete_image(
        self,
        object_key: str,
    ):
        """
        Delete an image from S3.
        """

        try:

            s3.delete_object(
                Bucket=S3_BUCKET_NAME,
                Key=object_key,
            )

            return True

        except Exception as e:

            print(
                f"Error deleting image from S3: {e}"
            )

            return False


# ============================================================
# Service instance
# ============================================================

s3_service = S3Service()