import django.utils.timezone
from django.core.management.color import no_style
from django.db import migrations


def reset_model_sequences(schema_editor, models):
    statements = schema_editor.connection.ops.sequence_reset_sql(no_style(), models)
    with schema_editor.connection.cursor() as cursor:
        for statement in statements:
            cursor.execute(statement)


def migrate_user_roles(apps, schema_editor):
    User = apps.get_model("app", "User")
    Role = apps.get_model("app", "Role")
    Permission = apps.get_model("app", "RBACPermission")
    all_permissions = list(Permission.objects.filter(is_active=True))
    role_map = {
        "super_admin": "super-admin",
        "super-admin": "super-admin",
        "admin": "admin",
        "teacher": "teacher",
        "student": "student",
    }
    for user in User.objects.all():
        existing_role_id = getattr(user, "custom_role_id", None)
        if existing_role_id:
            user.role = str(existing_role_id)
            user.save(update_fields=["role"])
            continue

        raw_role = (user.role or "").replace("_", "-")
        if raw_role.isdigit() and Role.objects.filter(pk=int(raw_role)).exists():
            continue

        slug = role_map.get(raw_role, "student")
        role, _ = Role.objects.get_or_create(
            tenant=user.tenant,
            slug=slug,
            defaults={"name": slug.replace("-", " ").title(), "is_system": True},
        )
        if slug in ["super-admin", "admin"]:
            role.permissions.set(all_permissions)
        user.role = str(role.id)
        user.save(update_fields=["role"])


def create_courses_from_batches(apps, schema_editor):
    Course = apps.get_model("app", "Course")
    Classes = apps.get_model("app", "Classes")
    for batch in Classes.objects.all():
        course, _ = Course.objects.get_or_create(
            id=batch.id,
            defaults={
                "tenant": batch.tenant,
                "name": batch.name,
                "code": f"BATCH-{batch.id}",
                "description": batch.subjects or "",
            },
        )
        if batch.course_id != course.id:
            batch.course_id = course.id
            batch.save(update_fields=["course"])
    reset_model_sequences(schema_editor, [Course])


def migrate_assessment_batches(apps, schema_editor):
    Assessment = apps.get_model("app", "Assessment")
    for assessment in Assessment.objects.all():
        if assessment.course_id and not assessment.batch_id:
            assessment.batch_id = assessment.course_id
            assessment.save(update_fields=["batch"])


def create_enrollments_from_student_class(apps, schema_editor):
    Enrollment = apps.get_model("app", "Enrollment")
    Students = apps.get_model("app", "Students")
    for student in Students.objects.exclude(studentClass_id=None):
        batch = student.studentClass
        if not batch or not batch.course_id:
            continue
        Enrollment.objects.get_or_create(
            tenant=student.tenant,
            student=student,
            batch=batch,
            course_id=batch.course_id,
            defaults={
                "enrollment_date": getattr(student, "enrollment_date", None) or django.utils.timezone.localdate(),
                "status": "active",
                "remarks": "Migrated from legacy studentClass.",
            },
        )


def migrate_assessment_results(apps, schema_editor):
    AssessmentResult = apps.get_model("app", "AssessmentResult")
    Enrollment = apps.get_model("app", "Enrollment")
    for result in AssessmentResult.objects.select_related("assessment", "student").all():
        assessment = result.assessment
        enrollment = Enrollment.objects.filter(student=result.student, batch_id=assessment.batch_id or assessment.course_id).first()
        if enrollment:
            result.enrollment_id = enrollment.id
            result.course_id = enrollment.course_id
            result.batch_id = enrollment.batch_id
        else:
            result.course_id = assessment.course_id
            result.batch_id = assessment.batch_id
        result.teacher_id = assessment.teacher_id
        result.save(update_fields=["enrollment", "course", "batch", "teacher"])


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('app', '0018_enrollment_remove_students_studentclass_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_user_roles, migrations.RunPython.noop),
        migrations.RunPython(create_courses_from_batches, migrations.RunPython.noop),
        migrations.RunPython(migrate_assessment_batches, migrations.RunPython.noop),
        migrations.RunPython(create_enrollments_from_student_class, migrations.RunPython.noop),
        migrations.RunPython(migrate_assessment_results, migrations.RunPython.noop),
    ]
