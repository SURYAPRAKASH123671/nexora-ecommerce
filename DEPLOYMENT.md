# Nexora Deployment Layout

This repository now keeps the API, web storefront, and mobile storefront as separate deployable folders.

## Folders

- `ecommerce-backend` - Spring Boot REST API. Host this on a Java backend platform such as Render, Railway, or AWS.
- `ecommerce-frontend-web` - Desktop/web storefront. Deploy this folder as a Vercel project.
- `ecommerce-frontend-mobile` - Mobile-focused storefront. Deploy this folder as a separate Vercel project.
- `ecommerce-frontend` - Current responsive storefront used by the existing Vercel deployment.

## Vercel Settings

For the web project:

- Root Directory: `ecommerce-frontend-web`
- Build Command: `npm run build`
- Output Directory: `build`

For the mobile project:

- Root Directory: `ecommerce-frontend-mobile`
- Build Command: `npm run build`
- Output Directory: `build`

The backend API should not be deployed to Vercel as a static React project.
