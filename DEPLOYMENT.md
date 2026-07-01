# Nexora Deployment Layout

This repository keeps the API, web storefront, and mobile storefront as separate deployable folders.

## Folders

- `ecommerce-backend` - Spring Boot REST API. Deploy this to Render using the included Docker setup.
- `ecommerce-frontend-web` - Desktop/web storefront. Deploy this folder as a Vercel project.
- `ecommerce-frontend-mobile` - Mobile-focused storefront. Deploy this folder as a separate Vercel project.
- `ecommerce-frontend` - Current responsive storefront used by the existing Vercel deployment.

## Backend Deployment: Render

Use the root-level `render.yaml` blueprint or create a Render Web Service manually.

Recommended Render settings:

- Service Type: `Web Service`
- Environment: `Docker`
- Root Directory: `ecommerce-backend`
- Health Check Path: `/api/products`
- Auto Deploy: `Yes`

Required backend environment variables:

- `DB_URL` - MySQL JDBC URL, for example `jdbc:mysql://host:3306/database?useSSL=true&serverTimezone=UTC`
- `DB_USERNAME` - MySQL username
- `DB_PASSWORD` - MySQL password
- `JWT_SECRET` - long random secret for JWT signing
- `MAIL_HOST` - `smtp.gmail.com`
- `MAIL_PORT` - `587`
- `MAIL_USERNAME` - Gmail address used for SMTP
- `MAIL_PASSWORD` - Gmail app password
- `MAIL_FROM` - sender email address
- `MAIL_ENABLED` - `true`
- `FRONTEND_BASE_URL` - production web frontend URL
- `BACKEND_BASE_URL` - production backend URL after Render creates it
- `CORS_ALLOWED_ORIGINS` - comma-separated frontend URLs allowed to call the API

Example `CORS_ALLOWED_ORIGINS`:

```text
https://nexora-web-virid.vercel.app,https://nexora-mobile.vercel.app,https://nexora-frontend-livid.vercel.app,http://localhost:3000
```

Do not commit real database passwords, Gmail app passwords, or JWT secrets.

## Vercel Settings

For the web project:

- Root Directory: `ecommerce-frontend-web`
- Build Command: `npm run build`
- Output Directory: `build`
- Environment Variable: `REACT_APP_API_BASE_URL=https://your-render-backend-url/api`

For the mobile project:

- Root Directory: `ecommerce-frontend-mobile`
- Build Command: `npm run build`
- Output Directory: `build`
- Environment Variable: `REACT_APP_API_BASE_URL=https://your-render-backend-url/api`

The backend API should not be deployed to Vercel as a static React project.
