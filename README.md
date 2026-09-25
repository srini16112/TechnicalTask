# NoBroker Dashboard — Backend API

Node.js + Express.js + PostgreSQL REST API with JWT access & refresh token authentication.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/download/) 15+

---

## Quick Start

### 1. Start PostgreSQL locally

During PostgreSQL installation, remember the password for the `postgres` user. Make sure the PostgreSQL service is running, then open Command Prompt or PowerShell and create the application database:

```cmd
psql -U postgres -c "CREATE DATABASE nobroker_db;"
```

If `psql` is not recognized, run it using the PostgreSQL installation path, for example:

```cmd
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE nobroker_db;"
```

Load the schema and built-in users:

```cmd
psql -U postgres -d nobroker_db -f database\schema.sql
```

### 2. Configure the database password

Edit `.env` and set `DB_PASSWORD` to the password chosen during PostgreSQL installation. The default local settings are:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nobroker_db
DB_USER=postgres
DB_PASSWORD=postgres
```

### 3. Install dependencies and start the API

From the backend folder:

```cmd
npm install
npm run db:seed
npm run dev
```

Use `npm start` instead of `npm run dev` when you do not want automatic restart on file changes.

Server runs at **http://localhost:3000**

---

## Seed Credentials

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@nobroker.com     | Admin@123  |
| User  | rahul@example.com      | Admin@123  |

---

## API Endpoints

### Auth
| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | /api/auth/register | ❌   | Register new user        |
| POST   | /api/auth/login    | ❌   | Login (returns tokens)   |
| POST   | /api/auth/google   | ❌   | Google SSO login (returns tokens) |
| POST   | /api/auth/refresh  | ❌   | Refresh access token     |
| POST   | /api/auth/logout   | ✅   | Logout (revoke token)    |
| GET    | /api/auth/me       | ✅   | Get current user profile |

### Users
| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| GET    | /api/users         | ✅   | List users (paginated)   |
| GET    | /api/users/stats   | ✅   | Dashboard stats          |
| GET    | /api/users/:id     | ✅   | Get user by ID           |
| PUT    | /api/users/:id     | ✅   | Update user              |
| DELETE | /api/users/:id     | ✅   | Soft-delete user         |

### Profile
| Method | Endpoint    | Auth | Description              |
|--------|-------------|------|--------------------------|
| GET    | /api/profile | ✅   | Get current user profile |
| PUT    | /api/profile | ✅   | Update current profile   |

### Properties
| Method | Endpoint            | Auth | Description                         |
|--------|---------------------|------|-------------------------------------|
| GET    | /api/properties     | ✅   | Search and filter properties        |
| GET    | /api/properties/:id | ✅   | Get a property                     |
| POST   | /api/properties     | ✅   | Create a buy/rent listing           |
| PUT    | /api/properties/:id | ✅   | Update your own listing             |
| DELETE | /api/properties/:id | ✅   | Delete your own listing             |

Property filters include `location`, `city`, `listingType`, `propertyType`, `bhk`,
`minPrice`, `maxPrice`, `isAvailable`, `page`, and `limit`.

### Home Services
| Method | Endpoint               | Auth | Description                     |
|--------|------------------------|------|---------------------------------|
| GET    | /api/home-services     | ✅   | Search available services       |
| GET    | /api/home-services/:id | ✅   | Get a service and provider info |
| POST   | /api/home-services     | ✅   | Create a provider listing       |
| PUT    | /api/home-services/:id | ✅   | Update your own service         |
| DELETE | /api/home-services/:id | ✅   | Delete your own service         |

Home-service filters include `category`, `serviceArea`, `isAvailable`, `page`,
and `limit`. All listing mutations enforce ownership using the authenticated user.

### Query Params (GET /api/users)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)
- `search` — search by name or email
- `role` — filter by `user` or `admin`

### Health
| Method | Endpoint    | Description  |
|--------|-------------|--------------|
| GET    | /api/health | Server check |

---

## Response Format

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "...", "email": "...", "role": "..." }
  }
}
```

---

## Token Strategy

- **Access Token** — 15 minutes, sent as `Authorization: Bearer <token>`
- **Refresh Token** — 7 days, stored in PostgreSQL + device secure storage
- On 401 → client calls `/api/auth/refresh` → receives new tokens → retries
- Refresh tokens are **rotated** on each use (old one deleted, new one issued)

## Google SSO Setup

1. In Google Cloud Console, create or select a project.
2. Open **APIs & Services → OAuth consent screen**, configure the app, and add your test Google account if the app is in testing mode.
3. Open **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Select **Web application** and copy the client ID. Add the frontend origin under **Authorized JavaScript origins** (for example `http://localhost:5173`).
5. Put the client ID in `.env` as `GOOGLE_CLIENT_ID` and restart the backend.
6. The frontend must obtain a Google ID token and send it to the backend:

```http
POST http://localhost:3000/api/auth/google
Content-Type: application/json

{"idToken":"<Google ID token>"}
```

The backend verifies the token with Google, creates or links the user by verified email, and returns the same `accessToken`, `refreshToken`, and `user` response as password login. Never send a Google client secret to the browser or use an access token in this endpoint.
