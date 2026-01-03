# Express Starter Kit

Production-ready REST API starter built with **Express 5** and **TypeScript**, featuring Prisma ORM for PostgreSQL, JWT authentication with refresh tokens, rate limiting, email delivery, and optional cloud file storage helpers (DigitalOcean Spaces, Cloudinary, Cloudflare R2).

## Tech Stack

| Technology                            | Purpose                           |
| ------------------------------------- | --------------------------------- |
| **Express 5**                         | HTTP server & routing             |
| **TypeScript**                        | Types & DX                        |
| **Prisma 7** + **PostgreSQL**         | Database ORM & migrations         |
| **Zod**                               | Request validation                |
| **JWT (access/refresh)**              | Auth tokens                       |
| **bcrypt**                            | Password hashing                  |
| **Nodemailer**                        | Email delivery (SMTP/Gmail ready) |
| **express-rate-limit**                | Throttling auth flows             |
| **Winston + Chalk**                   | Structured logging                |
| **Multer + S3/Cloudinary/R2 helpers** | File uploads & storage utilities  |

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm (or pnpm/yarn)
- PostgreSQL database
- Git

## Getting Started

1. **Clone and install**

   ```bash
   git clone <repository-url> express-starter-kit
   cd express-starter-kit
   npm install
   ```

2. **Configure environment**
   Create a `.env` in the project root:

   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/express_starter?schema=public"
   CORS_ORIGIN=http://localhost:3000
   FRONTEND_BASE_URL=http://localhost:3000

   JWT_ACCESS_TOKEN_SECRET=change-me
   JWT_ACCESS_TOKEN_EXPIRES_IN=15m
   JWT_REFRESH_TOKEN_SECRET=change-me-too
   JWT_REFRESH_TOKEN_EXPIRES_IN=7d
   JWT_PASSWORD_RESET_TOKEN_EXPIRES_IN=1h

   EMAIL_SENDER_EMAIL=your@gmail.com
   EMAIL_SENDER_APP_PASS=your-app-password

   # Optional: DigitalOcean Spaces / S3-compatible
   DO_SPACES_ENDPOINT=
   DO_SPACES_REGION=
   DO_SPACES_ACCESS_KEY=
   DO_SPACES_SECRET_KEY=
   DO_SPACES_BUCKET=

   # Optional: Cloudinary
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=

   # Optional: Cloudflare R2
   CLOUDFLARE_R2_ACCOUNT_ID=
   CLOUDFLARE_R2_ACCESS_KEY_ID=
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=
   CLOUDFLARE_R2_BUCKET_NAME=
   CLOUDFLARE_R2_PUBLIC_URL=
   ```

3. **Database & Prisma**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations against DATABASE_URL
   npm run prisma:migrate
   ```

4. **Run the API**

   ```bash
   # Development (ts-node + nodemon)
   npm run dev

   # Production build & start
   npm run build
   npm start
   ```

5. **Optional tooling**

   ```bash
   # Open Prisma Studio
   npm run prisma:studio

   # Scaffolding helper
   npm run generate:module
   ```

API will be available at `http://localhost:<PORT>/api/v1`.

## Project Structure

```
express-stater-kit/
├── prisma/
│   ├── schema.prisma          # Database models (User, File, Role)
│   └── migrations/            # Prisma migrations
├── src/
│   ├── app.ts                 # Express app wiring (CORS, parsing, routes)
│   ├── server.ts              # HTTP server bootstrap
│   ├── config/                # Env config loader
│   ├── modules/
│   │   └── auth/              # Auth routes, services, templates, validation
│   ├── middlewares/           # Auth guard, rate limiting, error handlers
│   ├── utils/                 # Logger, mailer, file helpers, pagination
│   └── routes/                # Route registry (/api/v1)
└── package.json
```

## Environment Variables Reference

| Variable                              | Required              | Default     | Description                               |
| ------------------------------------- | --------------------- | ----------- | ----------------------------------------- |
| `NODE_ENV`                            | No                    | development | Runtime environment                       |
| `PORT`                                | No                    | 3000        | Port the API listens on                   |
| `DATABASE_URL`                        | Yes                   | —           | PostgreSQL connection string              |
| `CORS_ORIGIN`                         | Yes                   | —           | Comma-separated allowed origins           |
| `FRONTEND_BASE_URL`                   | Yes                   | —           | Used in password reset email links        |
| `JWT_ACCESS_TOKEN_SECRET`             | Yes                   | —           | Access token signing secret               |
| `JWT_ACCESS_TOKEN_EXPIRES_IN`         | Yes                   | —           | Access token lifetime (e.g., 15m)         |
| `JWT_REFRESH_TOKEN_SECRET`            | Yes                   | —           | Refresh token signing secret              |
| `JWT_REFRESH_TOKEN_EXPIRES_IN`        | Yes                   | —           | Refresh token lifetime (e.g., 7d)         |
| `JWT_PASSWORD_RESET_TOKEN_EXPIRES_IN` | Yes                   | —           | Reset token lifetime (e.g., 1h)           |
| `EMAIL_SENDER_EMAIL`                  | Yes (if sending mail) | —           | SMTP username/sender                      |
| `EMAIL_SENDER_APP_PASS`               | Yes (if sending mail) | —           | SMTP app password                         |
| `DO_SPACES_*`                         | No                    | —           | DigitalOcean Spaces / S3-compatible creds |
| `CLOUDINARY_*`                        | No                    | —           | Cloudinary credentials                    |
| `CLOUDFLARE_R2_*`                     | No                    | —           | Cloudflare R2 credentials                 |

## Available Scripts

| Command                   | Description                             |
| ------------------------- | --------------------------------------- |
| `npm run dev`             | Start dev server with nodemon + ts-node |
| `npm run build`           | TypeScript build to `dist/`             |
| `npm start`               | Run compiled server                     |
| `npm run generate:module` | Scaffold a new module from template     |
| `npm run prisma:generate` | Generate Prisma client                  |
| `npm run prisma:migrate`  | Run Prisma migrations (dev)             |
| `npm run prisma:deploy`   | Apply migrations in deploy environments |
| `npm run prisma:reset`    | Reset database (dev only)               |
| `npm run prisma:pull`     | Introspect database into Prisma schema  |
| `npm run prisma:push`     | Push Prisma schema to database          |
| `npm run prisma:studio`   | Launch Prisma Studio GUI                |

## API Overview (v1)

- **Auth**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me` (auth)
  - `POST /api/v1/auth/refresh-token`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `POST /api/v1/auth/change-password` (auth)
  - `POST /api/v1/auth/logout` (auth)

## Features

- JWT auth with access/refresh tokens, role support, and token invalidation on password change.
- Zod-powered request validation and structured error handling.
- Rate limiting on sensitive auth endpoints.
- Password reset flow with email delivery (Nodemailer/Gmail ready).
- Prisma data layer for PostgreSQL with generated client.
- File helpers for S3-compatible storage, Cloudinary, and Cloudflare R2.
- Structured logging via Winston with colorized console output.

## Deployment Notes

- Set `NODE_ENV=production` and strong JWT secrets before deploying.
- Run `npm run build` then `npm start` for production.
- Apply database migrations with `npm run prisma:deploy` against your production `DATABASE_URL`.
- Configure CORS and SMTP to match your frontend and email provider.
