What this system is:

HustleHub+ is a freelance marketplace platform where freelancers advertise services ("gigs") and clients browse and book them. The platform also records the resulting financial transactions and gives freelancers visibility into income earned and estimated tax owed.

This repository currently covers the secure backend foundation — user registration, authentication, and the security controls that protect them. Later parts build gig management, bookings, transactions, and the financial dashboard on top of this foundation.

 Intended users:

- Clients: browse gigs and book freelancer services.
- Freelancers:list gigs, fulfil bookings, and track income/tax estimates.
- Admin : oversee the platform (introduced in a later part).

All three roles authenticate through the same registration/login endpoints; the `role` field on each user record determines what they're permitted to do as more functionality is added.
Architecture


Tech stack

Backend: Node.js + Express
Database: MongoDB (Atlas cloud cluster)
Auth: JWT (JSON Web Tokens), passwords hashed with bcrypt
Validation: express-validator
Security middleware: Helmet, CORS
Transport: HTTPS via a locally generated self-signed certificate

 Backend structure


backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   └── auth.controller.js    # register / login / getMe logic
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification guard
│   │   └── validate.middleware.js # express-validator result handler
│   ├── models/
│   │   └── User.js               # Mongoose schema
│   ├── routes/
│   │   └── auth.routes.js        # /api/auth/* routes + validation rules
│   ├── utils/
│   │   └── token.js              # JWT signing helper
│   └── server.js                 # Express app, middleware chain, HTTPS listener
├── certs/                        # local SSL cert/key (gitignored, generated locally)
├── .env                          # environment config (gitignored)
└── .env.example                  # template for required env vars
```

API endpoints:

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| GET | `/api/health` | No | Basic liveness check |
| POST | `/api/auth/register` | No | Create a new user account |
| POST | `/api/auth/login` | No | Authenticate and receive a JWT |
| GET | `/api/auth/me` | Yes (Bearer token) | Return the authenticated user's own profile |

Security decisions:

assword hashing :Raw passwords are never stored. On registration, the password is hashed with `bcrypt` (cost factor 12) before being saved as `passwordHash`. On login, the submitted password is compared against the stored hash with `bcrypt.compare` — the plaintext password never touches the database or logs.

Token-based authentication (JWT) :On successful login, the server issues a signed JWT containing the user's id and role, with a 1-hour expiry. Protected routes (currently `/api/auth/me`) require this token in an `Authorization: Bearer <token>` header; a middleware verifies the signature and expiry on every request before the route handler runs. An invalid, expired, or missing token is rejected with a generic `401` — no route beyond login/register is reachable without a valid token.

Input validation. :Every request body is validated with `express-validator` before it reaches business logic: email format is checked and normalized, passwords must meet a minimum length, and free-text fields (like `name`) are escaped to neutralize HTML/script injection. Invalid input is rejected with a `400` and a list of validation errors — it never reaches the database layer.

Generic authentication errors (anti-enumeration):Login returns the same `401 Invalid credentials` message whether the email doesn't exist or the password is wrong, and registration returns the same `400 Registration failed` message for a duplicate email as any other registration failure. This prevents an attacker from using error messages to discover which emails are registered.

Secure error handling.: All controller logic is wrapped in try/catch and routed to a single central error-handling middleware. That middleware logs the full error server-side only, and always returns a generic `{ "message": "Something went wrong" }` to the client — stack traces, file paths, and internal error details are never exposed in an HTTP response.

HTTPS.: The API is served exclusively over HTTPS using a locally generated self-signed certificate (`certs/localhost.pem` / `localhost-key.pem`), so credentials and tokens are never transmitted in plaintext, even in local development.

Security headers and CORS.: `helmet()` applies a set of protective HTTP headers (e.g. disabling MIME-sniffing, setting a conservative `Content-Security-Policy` baseline) to every response, and `cors()` restricts which origins may call the API.

Setup instructions

 1. Prerequisites

- Node.js (v18+)
- `openssl` available on your PATH (ships with Git for Windows/Git Bash)
- A MongoDB Atlas account and free-tier cluster (or a local MongoDB instance)

 2. Install dependencies

bash
cd backend
npm install
```

 5. Run the server

```bash
npm run dev
```

The API will be available at `https://localhost:5000`. Your browser will show a certificate warning since this is a self-signed cert for local development — this is expected; proceed past it.

Testing with Postman

A Postman collection is included-
- Registration: valid input, duplicate email, invalid email format, password too short
- Login: valid credentials, wrong password, non-existent email
- Protected route (`/api/auth/me`): no token, invalid token, valid token


