from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError


MAX_IMAGE_SIZE = (1600, 1600)
WEBP_QUALITY = 82


def optimize_model_image_fields(instance, field_names):
    for field_name in field_names:
        image_field = getattr(instance, field_name, None)
        if not image_field or getattr(image_field, "_committed", True):
            continue
        optimized = optimize_uploaded_image(image_field)
        if optimized:
            getattr(instance, field_name).save(optimized["name"], optimized["content"], save=False)


def delete_replaced_model_image_fields(instance, field_names, old_file_names):
    for field_name in field_names:
        old_name = old_file_names.get(field_name)
        current_field = getattr(instance, field_name, None)
        current_name = current_field.name if current_field else ""
        if old_name and old_name != current_name:
            storage = current_field.storage if current_field else instance._meta.get_field(field_name).storage
            storage.delete(old_name)


def delete_model_image_fields(instance, field_names, file_names):
    for field_name in field_names:
        file_name = file_names.get(field_name)
        image_field = getattr(instance, field_name, None)
        if file_name:
            storage = image_field.storage if image_field else instance._meta.get_field(field_name).storage
            storage.delete(file_name)


def optimize_uploaded_image(image_field):
    try:
        image_field.file.seek(0)
        image = Image.open(image_field.file)
        image = ImageOps.exif_transpose(image)
    except (UnidentifiedImageError, OSError, ValueError):
        return None

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    image.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
    output = BytesIO()
    image.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
    output.seek(0)

    original_name = Path(image_field.name or "image").stem or "image"
    return {
        "name": f"{original_name}.webp",
        "content": ContentFile(output.read()),
    }
