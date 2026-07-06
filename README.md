# Nexora E-Commerce Platform

Nexora is a full-stack e-commerce application built with **Spring Boot, React, MySQL, Spring Security, JWT authentication, and email workflows**. The project focuses on real application structure: secure APIs, layered backend architecture, database persistence, shopping flows, and customer/admin features.

## Core Features

- User registration and login with JWT authentication.
- Product catalog APIs with category-aware product management.
- Cart, checkout, order placement, and order history workflows.
- Admin dashboard APIs for managing platform data.
- Email verification, password reset, and order confirmation email support.
- Profile and saved address management.
- PDF invoice generation and tested email builder logic.
- MySQL persistence with Spring Data JPA and Hibernate.

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend | Java, Spring Boot, Spring Security, Spring MVC |
| Persistence | MySQL, Spring Data JPA, Hibernate |
| Authentication | JWT, Spring Security filter chain |
| Email | JavaMail Sender / SMTP |
| Testing | JUnit, Spring Boot Test |
| Build | Gradle |

## Repository Layout

```text
src/main/java/ecommerce_backend/
  auth/       Authentication, JWT, verification, password reset
  product/    Product APIs and persistence
  category/   Category APIs and persistence
  order/      Checkout, orders, invoices
  profile/    Customer profile and address flows
  admin/      Admin dashboard APIs
  email/      Email delivery and templates
  config/     Security and development configuration
```

## Run Locally

```bash
./gradlew bootRun
```

On Windows:

```bash
gradlew.bat bootRun
```

Run tests:

```bash
./gradlew test
```

## Related Repository

- [Nexora Frontend](https://github.com/SURYAPRAKASH123671/nexora-frontend)

## Author

Surya Prakash K S  
[GitHub](https://github.com/SURYAPRAKASH123671) · [LinkedIn](https://www.linkedin.com/in/surya-prakash-k-s-25b177242)
