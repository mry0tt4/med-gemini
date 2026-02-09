# Deploying Med-Gemini

Med-Gemini is built with Next.js 16 (App Router), leveraging server actions and edge functions. Here's how to deploy it to various platforms.

## Prerequisites

- **GitHub Repository**: Connected to your source code.
- **Environment Variables**: Use the env editor on your platform.
- **Database**: PostgreSQL (Supabase, Neon, or Railway)
- **Object Storage**: AWS S3 Bucket
- **Inngest Dashboard**: For AI orchestration management.

## 1. Vercel (Recommended)

1.  **Select Repository**: Import your GitHub repo.
2.  **Environment Variables**: Add all keys from `.env.example`.
3.  **Build Command**: `npx prisma generate && next build`
    *   (Prisma generate is crucial for the database client).
4.  **Install Command**: `npm install`
5.  **Hit Deploy**.

### Webhooks
For Inngest to work in production:
1.  Go to Inngest Dashboard > Functions > Deploy.
2.  Your function app URL will be `https://<your-vercel-domain>/api/inngest`.
3.  The Inngest signing key must be set in Vercel environment variables.

## 2. Docker (Any Platform)

The provided `Dockerfile` builds a production-ready image.

```dockerfile
# Dockerfile snippet
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate
RUN npm run build
...
```

### Build & Run
```bash
docker build -t med-gemini .
docker run -p 3000:3000 med-gemini
```

Ensure environment variables are passed to the container at runtime.

## 3. Database (Prisma)

When deploying, verify migrations run:

```bash
# In your build pipeline or pre-deploy hook
npx prisma migrate deploy
```

## Important Considerations

- **Long-Running Tasks**: Med-Gemini uses Inngest, so long-running AI tasks **do not** block the serverless function timeout (Vercel has limit of 10-60s). The tasks run asynchronously on Inngest's infrastructure, calling back your API endpoints.
- **S3 CORS**: Ensure your S3 bucket has CORS configured to allow PUT/GET from your production domain. See `docs/S3_CORS_SETUP.md`.
