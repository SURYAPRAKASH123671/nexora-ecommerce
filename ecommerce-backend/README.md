# Nexora Commerce Backend

Production-oriented ecommerce REST API built with Java 17 and Spring Boot 4. It covers secure identity, catalog administration, server-authoritative checkout, inventory consistency, order and payment lifecycles, invoices, email, database migrations, observability, containers, and CI.

The repository now also includes a responsive Nexora storefront in `frontend/`, covering discovery, search, product detail, cart, checkout, account and admin preview workflows. The full principal-level engineering, UX and product assessment is in [docs/GOOGLE_LEVEL_PRODUCT_REVIEW.md](docs/GOOGLE_LEVEL_PRODUCT_REVIEW.md).

Built by [Surya Prakash](https://www.linkedin.com/in/surya-prakash-25b177242/).

## Engineering highlights

- Stateless Spring Security with JWT, BCrypt, role-based authorization, configurable CORS, and a minimum-strength JWT secret.
- Email-verification and password-reset tokens are random, expire, and are stored only as SHA-256 hashes.
- Public catalog reads with admin-only catalog writes and email operations.
- Server-authoritative checkout: product names, prices, GST, shipping, totals, availability, and payment state are never trusted from the client.
- Pessimistic product locking plus optimistic entity versioning prevents overselling under concurrent checkout.
- Stock is reserved at checkout and restored exactly once when an order is cancelled.
- Controlled order and payment state machines reject invalid lifecycle transitions.
- Manual UPI checkout creates a server-side payment reference, accepts a validated screenshot, records a SHA-256 proof digest, and never confirms an order before an administrator reviews it.
- Razorpay checkout creates provider orders only from server-calculated totals, verifies callback signatures in constant time, validates captured payment details server-to-server, persists attempts, and processes signed idempotent webhooks.
- Payment-proof files use randomized storage keys and PNG/JPEG/WebP magic-byte validation; metadata, decisions, reviewer identity, and the append-only order history are persisted in MySQL.
- Searchable, pageable, sortable catalog and admin order operations.
- Flyway versioned schema, Hibernate production validation, OpenAPI, health checks, Prometheus metrics, Docker, Render configuration, and GitHub Actions CI.
- 29 automated tests covering security boundaries, checkout tampering, manual UPI intent generation, proof validation, verification transitions, inventory, lifecycle rules, token storage, JWT, email, invoices, and application startup.

## Architecture

```text
Web / mobile client
        |
        v
Spring Security + JWT filter
        |
        v
REST controllers -> application services -> JPA repositories
        |                    |                    |
        |                    +-> SMTP / PDF       +-> MySQL
        |
        +-> OpenAPI / Actuator / Prometheus

Production schema: Flyway migrations -> Hibernate validation
Delivery path: Maven tests -> Docker image -> Render / container platform
```

## Technology

| Concern | Implementation |
| --- | --- |
| Runtime | Java 17, Spring Boot 4, Spring MVC |
| Security | Spring Security, JJWT, BCrypt |
| Data | Spring Data JPA, Hibernate, MySQL 8, H2 tests |
| Schema | Flyway migrations |
| API | Jakarta Validation, centralized error responses, Springdoc OpenAPI |
| Operations | Actuator, Micrometer, Prometheus, Docker Compose |
| Delivery | Maven Wrapper, multi-stage Docker build, GitHub Actions, Render blueprint |

## API access model

| Area | Endpoint | Access |
| --- | --- | --- |
| Authentication | `/api/auth/**` | Public |
| Catalog reads | `GET /api/products/**`, `GET /api/categories/**` | Public |
| Catalog writes | `POST/PUT/PATCH/DELETE /api/products/**` and `/api/categories/**` | Admin |
| Product search | `GET /api/products/search?q=&categoryId=&page=&size=&sortBy=&direction=` | Public |
| Profile | `/api/profile/**` | Authenticated customer/admin |
| Checkout and orders | `/api/orders/**` | Authenticated customer/admin, ownership enforced |
| Admin analytics | `GET /api/admin/dashboard` | Admin |
| Admin orders | `GET /api/admin/orders` | Admin |
| Order lifecycle | `PATCH /api/admin/orders/{orderNumber}/status` | Admin |
| Payment lifecycle | `PATCH /api/admin/orders/{orderNumber}/payment-status` | Admin |
| UPI instructions | `GET /api/orders/{orderNumber}/payments/upi/instructions` | Authenticated order owner |
| Submit UPI proof | `POST /api/orders/{orderNumber}/payments/upi/proof` | Authenticated order owner |
| Create Razorpay checkout | `POST /api/orders/{orderNumber}/payments/razorpay/order` | Authenticated order owner |
| Verify Razorpay payment | `POST /api/orders/{orderNumber}/payments/razorpay/verify` | Authenticated order owner |
| Cancel Razorpay checkout | `POST /api/orders/{orderNumber}/payments/razorpay/cancel` | Authenticated order owner |
| Razorpay webhook | `POST /api/payments/razorpay/webhook` | Public endpoint; signed payload required |
| UPI review queue | `GET /api/admin/payments/upi?status=PENDING_VERIFICATION` | Admin |
| View protected proof | `GET /api/admin/payments/upi/{paymentId}/proof` | Admin |
| Approve/reject proof | `PATCH /api/admin/payments/upi/{paymentId}/review` | Admin |
| Order audit history | `GET /api/admin/payments/upi/orders/{orderNumber}/history` | Admin |
| Email relay | `/api/email/**` | Admin |
| Health | `GET /actuator/health` | Public |
| Metrics | `GET /actuator/prometheus` | Admin |
| API specification | `GET /v3/api-docs`, `/swagger-ui.html` | Public |

JWT-protected requests use `Authorization: Bearer <token>`.

## Run with Docker

Docker Compose starts MySQL and the production-profile backend, waits for a real database query to succeed, applies Flyway migrations, and validates the resulting schema.

```powershell
docker compose up --build
```

Then open:

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`
- Prometheus: `http://localhost:8080/actuator/prometheus` (admin JWT required)

The Compose credentials are development-only. Replace every password and the JWT secret before any shared deployment.

## Run the storefront

```powershell
cd frontend
npm install
npm run dev
```

The storefront runs at `http://localhost:3000` and reads `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080`). It labels its curated portfolio catalogue whenever the backend database is empty or unavailable.

## Run locally with seeded demo data

Prerequisites: Java 17+ and MySQL 8+.

```powershell
mysql -u root -p < .\scripts\setup-mysql.sql
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

The `dev` profile seeds sample catalog data and this local-only admin:

```text
Email: admin@nexora.com
Password: Admin12345
```

Never enable the development profile in production.

## Configuration

Copy `.env.example` into your deployment secret store and replace its example values. Important settings include:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, token lifetimes
- `FRONTEND_BASE_URL`, `BACKEND_BASE_URL`, `CORS_ALLOWED_ORIGINS`
- `MAIL_ENABLED`, SMTP credentials, and `MAIL_HEALTH_ENABLED`
- `CHECKOUT_GST_RATE`, `FREE_SHIPPING_THRESHOLD`, `SHIPPING_FEE`
- `UPI_MERCHANT_ID`, `UPI_MERCHANT_NAME`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `PAYMENT_PROOF_STORAGE_DIR` (must point to a persistent, backed-up volume in production)

Production uses `ddl-auto=validate`; schema changes belong in `src/main/resources/db/migration` and must never rely on automatic Hibernate mutation.

## Verification

```powershell
.\mvnw.cmd clean verify
docker compose config
docker compose up -d --build
```

The build must report `Tests run: 33, Failures: 0, Errors: 0`.

## Razorpay activation

Create an order with `paymentMethod` set to `RAZORPAY`, then request its provider checkout record from the authenticated Razorpay order endpoint. The browser may receive the public key ID and provider order ID, but it must never receive the key secret or webhook secret. After Razorpay Checkout returns, send its three signed callback values to the verification endpoint. Nexora confirms the order only after the callback signature and the captured payment fetched from Razorpay match the server-owned order ID, amount, and INR currency.

In the Razorpay dashboard, register `POST /api/payments/razorpay/webhook` on the public backend domain and subscribe to `payment.captured`, `payment.failed`, and `order.paid`. Store the live key secret and webhook secret only in the deployment secret manager. Use test-mode credentials and a test webhook before switching to live mode.

## Honest production boundary

Direct UPI is intentionally manual: a screenshot is review evidence, not settlement confirmation. The administrator must independently compare the recipient, amount, reference, and bank/UPI records before approving. Production hosting must provide durable proof storage; an ephemeral container filesystem is not sufficient. For automated payment confirmation, integrate a regulated payment gateway using server-created orders, signature verification, and idempotent signed webhooks. See [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md).
