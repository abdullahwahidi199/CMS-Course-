from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class EnterpriseSchemaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        paths = {}
        resources = [
            "assessments",
            "assessment-results",
            "fee-plans",
            "invoices",
            "payments",
            "student-ledger",
            "stationery-items",
            "inventory-transactions",
            "stationery-purchases",
            "dashboards",
            "reports",
            "notifications",
        ]
        for resource in resources:
            paths[f"/api/v1/{resource}/"] = {
                "get": {"summary": f"List {resource}", "tags": [resource]},
                "post": {"summary": f"Create {resource}", "tags": [resource]},
            }
            paths[f"/api/v1/{resource}/{{id}}/"] = {
                "get": {"summary": f"Retrieve {resource}", "tags": [resource]},
                "patch": {"summary": f"Update {resource}", "tags": [resource]},
                "delete": {"summary": f"Delete {resource}", "tags": [resource]},
            }

        paths.update({
            "/api/v1/assessments/{id}/publish/": {"post": {"summary": "Publish assessment results", "tags": ["assessments"]}},
            "/api/v1/assessments/{id}/bulk-results/": {"post": {"summary": "Bulk upload assessment marks", "tags": ["assessments"]}},
            "/api/v1/invoices/generate-monthly/": {"post": {"summary": "Generate monthly invoices", "tags": ["invoices"]}},
            "/api/v1/invoices/{id}/receipt/": {"get": {"summary": "Invoice receipt", "tags": ["invoices"]}},
            "/api/v1/stationery-items/stock-in/": {"post": {"summary": "Add stock", "tags": ["stationery-items"]}},
            "/api/v1/stationery-items/stock-out/": {"post": {"summary": "Remove stock", "tags": ["stationery-items"]}},
            "/api/v1/stationery-items/adjust/": {"post": {"summary": "Adjust stock", "tags": ["stationery-items"]}},
            "/api/v1/dashboards/admin/": {"get": {"summary": "Admin dashboard", "tags": ["dashboards"]}},
            "/api/v1/dashboards/teacher/": {"get": {"summary": "Teacher dashboard", "tags": ["dashboards"]}},
            "/api/v1/dashboards/student/": {"get": {"summary": "Student dashboard", "tags": ["dashboards"]}},
        })

        return Response({
            "openapi": "3.0.3",
            "info": {
                "title": "Course Management Enterprise API",
                "version": "1.0.0",
                "description": "Versioned SaaS API for assessments, billing, stationery, dashboards, reports, and notifications.",
            },
            "paths": paths,
        })

