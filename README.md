# Nexora Commerce

Nexora is a premium India-focused ecommerce storefront built with React, TypeScript and a Spring Boot commerce backend. It includes product discovery, search, verified product variants, comparison, persistent cart and wishlist, secure checkout, order history, payment review workflows, administration, support pages, SEO and installable web-app support.

## Development

```bash
npm install
npm run dev
npm test
```

The hosted storefront uses managed identity, SQL storage and protected object storage. Runtime bindings are declared in the hosting configuration and simulated locally by the Vite configuration.

## Production standards

- Never commit database, email, payment-gateway or signing secrets.
- Keep payment amounts authoritative on the backend.
- Never confirm manual payments before merchant verification.
- Run the complete test suite before publishing.
- Preserve accessible names, keyboard navigation and responsive layouts.

© 2026 Nexora Commerce. All Rights Reserved.
