# Production checklist

## Required before launch

- Replace all Compose/example credentials; generate a high-entropy JWT secret of at least 32 characters.
- Set the production frontend/backend URLs and an exact CORS origin allow-list.
- Provide a managed MySQL database, backups, point-in-time recovery, TLS, and least-privilege credentials.
- Run Flyway migration validation in staging before production rollout.
- Configure SMTP credentials, sender-domain SPF/DKIM/DMARC, and enable mail health only when SMTP is configured.
- Integrate a real payment provider with signature verification, idempotency keys, replay protection, and an audit trail.
- Put the API behind HTTPS, a reverse proxy/load balancer, request-size limits, and rate limiting/WAF controls.
- Send logs and Prometheus metrics to monitored storage; alert on latency, error rate, saturation, stock conflicts, and failed payments.
- Add integration tests against MySQL/Testcontainers and load tests for concurrent checkout before high-traffic launch.
- Establish dependency scanning, container scanning, secret scanning, and a documented key-rotation process.

## Deployment gates

1. `mvnw clean verify` passes.
2. Docker image builds as the non-root runtime user.
3. Flyway applies successfully to an empty database and upgrades a copy of production data.
4. `/actuator/health` is `UP`; `/actuator/prometheus` is scrapeable using configured admin authentication.
5. Public reads work, anonymous writes fail, and customer ownership/admin boundaries are verified.
6. Checkout rejects price/total tampering and simultaneous orders cannot make stock negative.
7. Backup restoration and rollback procedures have been rehearsed.
