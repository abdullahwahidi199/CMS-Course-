# Enterprise SaaS API

All new production-oriented endpoints live under `/api/v1/`.

## Cross-cutting behavior

- JWT/session authentication is required.
- Every ViewSet defines `rbac_resource` and is checked by `HasRBACPermission`.
- List endpoints use global page-number pagination.
- Query parameters supported by most resources:
  - `search`
  - `ordering`
  - resource-specific filters such as `status`, `student`, `course`, `month`, `year`
- OpenAPI schema is available at `/api/schema/`.

## Assessments

- `GET/POST /api/v1/assessments/`
- `GET/PATCH/DELETE /api/v1/assessments/{id}/`
- `POST /api/v1/assessments/{id}/publish/`
- `POST /api/v1/assessments/{id}/bulk-results/`
- `GET/POST /api/v1/assessment-results/`
- `POST /api/v1/assessment-results/bulk-upload/`

Grades and percentages are calculated in `enterprise_services.save_assessment_result`.

## Monthly Fees

- `GET/POST /api/v1/fee-plans/`
- `GET/POST /api/v1/invoices/`
- `POST /api/v1/invoices/generate-monthly/`
- `GET /api/v1/invoices/{id}/receipt/`
- `GET/POST /api/v1/payments/`
- `GET /api/v1/student-ledger/`

Payments support partial settlement and automatically update invoice status, balances, ledgers, receipts, and notifications.

## Stationery

- `GET/POST /api/v1/stationery-items/`
- `POST /api/v1/stationery-items/stock-in/`
- `POST /api/v1/stationery-items/stock-out/`
- `POST /api/v1/stationery-items/adjust/`
- `GET /api/v1/inventory-transactions/`
- `GET/POST /api/v1/stationery-purchases/`
- `GET /api/v1/stationery-purchases/{id}/receipt/`

Stock status is recalculated after each inventory mutation.

## Dashboards

- `GET /api/v1/dashboards/admin/`
- `GET /api/v1/dashboards/teacher/`
- `GET /api/v1/dashboards/student/`

## Reports

- `GET /api/v1/reports/attendance/`
- `GET /api/v1/reports/assessments/`
- `GET /api/v1/reports/fees/`
- `GET /api/v1/reports/revenue/`
- `GET /api/v1/reports/students/`
- `GET /api/v1/reports/teachers/`
- `GET /api/v1/reports/inventory/`
- `GET /api/v1/reports/stationery-sales/`

Use `?export=csv`, `?export=excel`, or `?export=pdf` for downloadable exports.

## Notifications

- `GET /api/v1/notifications/`
- `POST /api/v1/notifications/{id}/mark-read/`
