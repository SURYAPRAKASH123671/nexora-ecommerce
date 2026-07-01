# Nexora Deployment Layout

This repository keeps the API, web storefront, and mobile storefront as separate deployable folders.

## Folders

- `ecommerce-backend` - Spring Boot REST API. Deployed on Railway with Docker and connected to Railway MySQL.
- `ecommerce-frontend-web` - Desktop/web storefront. Deployed as the `nexora-web` Vercel project.
- `ecommerce-frontend-mobile` - Mobile-focused storefront. Deployed as the `nexora-mobile` Vercel project.

## Live URLs

- Backend API: `https://nexora-ecommerce-production.up.railway.app/api`
- Web storefront: `https://nexora-web-virid.vercel.app`
- Mobile storefront: `https://nexora-mobile.vercel.app`

## Railway Backend

Railway services:

- `nexora-ecommerce` - Spring Boot backend service
- `MySQL` - hosted production database

Important backend environment variables:

- `DB_URL` - Railway MySQL JDBC URL
- `DB_USERNAME` - Railway MySQL username
- `DB_PASSWORD` - Railway MySQL password
- `JWT_SECRET` - long random secret for JWT signing
- `MAIL_HOST` - SMTP host
- `MAIL_PORT` - SMTP port
- `MAIL_USERNAME` - SMTP username
- `MAIL_PASSWORD` - SMTP app/API password
- `MAIL_FROM` - sender email address
- `MAIL_ENABLED` - `true`
- `FRONTEND_BASE_URL` - `https://nexora-web-virid.vercel.app`
- `BACKEND_BASE_URL` - `https://nexora-ecommerce-production.up.railway.app`
- `CORS_ALLOWED_ORIGINS` - comma-separated frontend URLs allowed to call the API

Current CORS origins:

```text
https://nexora-web-virid.vercel.app,https://nexora-mobile.vercel.app,http://localhost:3000
```

Do not commit real database passwords, SMTP passwords, or JWT secrets.

## Vercel Settings

For the web project:

- Project Name: `nexora-web`
- Root Directory: `ecommerce-frontend-web`
- Build Command: `npm run build`
- Output Directory: `build`
- Environment Variable: `REACT_APP_API_BASE_URL=https://nexora-ecommerce-production.up.railway.app/api`

For the mobile project:

- Project Name: `nexora-mobile`
- Root Directory: `ecommerce-frontend-mobile`
- Build Command: `npm run build`
- Output Directory: `build`
- Environment Variable: `REACT_APP_API_BASE_URL=https://nexora-ecommerce-production.up.railway.app/api`

Removed duplicate projects:

- Old GitHub folder: `ecommerce-frontend`
- Old Vercel project: `nexora`
- Old Vercel project: `nexora-frontend`

The backend API should not be deployed to Vercel as a static React project.
