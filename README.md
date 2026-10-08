# Backend Ledger

Backend Ledger is a REST API for user registration, account management, and transfers between accounts. It is built with Node.js, Express, and MongoDB using Mongoose. Account balances are derived from ledger entries rather than stored as a mutable balance.

## Features

- **Authentication:** Register and log in with an email and password. Successful registration and login return a JSON Web Token (JWT) and set it in a cookie.
- **Account management:** Authenticated users can create accounts, list their own accounts, and check the balance of an account they own.
- **Transfers:** Authenticated users can transfer funds from their own active account to another active account. Transfers use an idempotency key and create paired debit and credit ledger entries.
- **System funding:** A separate system-user-only endpoint can credit an account through a transaction from the system user's account.
- **Email notifications:** Registration and successful transfer emails are sent through Gmail with OAuth2 credentials. A failed-transfer email helper also exists, but the current transfer flow does not call it.
- **Logout and token revocation:** Logout blacklists the cookie token. Blacklist documents expire after three days.

## Tech stack

- Node.js (CommonJS)
- Express 5
- MongoDB and Mongoose
- `jsonwebtoken` for JWTs
- `bcryptjs` for password hashing
- `nodemailer` for email

## Getting started

### Requirements

- Node.js and npm
- MongoDB. Transfers use MongoDB transactions, so run MongoDB as a replica set (including for a single-node local development database).
- A Gmail OAuth2 configuration if you want registration and transfer emails to be delivered.

### Install and configure

```bash
npm install
```

Create a `.env` file in the project root:

```dotenv
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/backend-ledger
JWT_SECRET=replace-with-a-long-random-secret

# Gmail OAuth2 settings for Nodemailer
EMAIL_USER=your-sender@gmail.com
CLIENT_ID=your-google-oauth-client-id
CLIENT_SECRET=your-google-oauth-client-secret
REFRESH_TOKEN=your-google-oauth-refresh-token
```

Keep `.env` private; it is excluded from Git. The email variables are needed for email delivery; the API's database and JWT configuration are required for the service to operate.

Start the development server:

```bash
npm run dev
```

The server listens on `PORT` and connects to the database specified by `MONGO_URI`.

## API

All routes are mounted under `/api`. JSON request bodies are accepted. For protected endpoints, authenticate with the JWT in the `token` cookie or send it as a bearer token:

```http
Authorization: Bearer <token>
```

### Authentication — `/api/auth`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/register` | Public | Register a user; sets and returns a JWT and sends a registration email. |
| `POST` | `/login` | Public | Verify credentials; sets and returns a JWT. |
| `POST` | `/logout` | Cookie required | Blacklists the cookie token and clears the cookie. |

Example registration/login body:

```json
{
  "name": "Alex Example",
  "email": "alex@example.com",
  "password": "choose-a-password"
}
```

Login requires `email` and `password`; registration requires `name`, `email`, and `password`.

### Accounts — `/api/accounts`

All account endpoints require authentication.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create an account for the authenticated user. New accounts default to `ACTIVE` and `INR`. |
| `GET` | `/` | List accounts belonging to the authenticated user. |
| `GET` | `/:accountId` | Get the balance for an account belonging to the authenticated user. |

### Transactions — `/api/transactions`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/` | Authenticated user | Transfer funds from the user's account to a receiver account. |
| `POST` | `/system/initial-funds` | System user | Credit a receiver account from the system user's account. |

Transfer request:

```json
{
  "fromAccount": "<sender-account-id>",
  "toAccount": "<receiver-account-id>",
  "amount": 25,
  "idempotencyKey": "unique-key-for-this-transfer"
}
```

The regular transfer endpoint checks that the sender account belongs to the authenticated user and that both accounts are active. The idempotency key is unique across transactions; retrying a completed transaction with the same key returns the existing transaction rather than creating another one.

System funding request:

```json
{
  "toAccount": "<receiver-account-id>",
  "amount": 100,
  "idempotencyKey": "unique-key-for-this-funding"
}
```

The funding endpoint requires an authenticated user whose database record has `systemUser: true`. Public registration does not enable this role; provision a system user through a trusted administrative process.

## How balances and transfers work

Balances are calculated by summing an account's `CREDIT` ledger entries and subtracting its `DEBIT` entries. A regular transfer creates a pending transaction, writes debit and credit entries in a MongoDB session, marks the transaction completed, and commits the session. Ledger entries are intended to be append-only: their main fields are immutable and update/delete operations are blocked by Mongoose middleware.

The transfer controller currently waits 15 seconds between writing the debit and credit ledger entries. This is part of the current implementation and should be reviewed or removed before production use.

## Security controls currently implemented

- Passwords are hashed with bcryptjs (10 salt rounds) before being saved.
- JWTs are signed using `JWT_SECRET` and expire after three days.
- Protected middleware verifies JWTs and removes the password field from standard authenticated-user lookups.
- The system-user middleware checks the `systemUser` role before allowing initial-funds operations. The role defaults to `false`, is excluded from normal user queries, and is immutable in the schema.
- The transfer controller checks sender-account ownership to prevent a user from debiting another user's account.
- Account lookup for balance checks is scoped to the authenticated user.
- Idempotency keys have a unique database index.
- Ledger entries are designed to be immutable, and MongoDB transactions keep transfer writes together.
- Logout records the cookie JWT in a blacklist with a three-day TTL index. Authentication middleware rejects blacklisted tokens.
- `.env` is ignored by Git to help keep configuration and credentials out of commits.

These measures are a starting point, not a complete production security posture. In particular, cookies are currently set without explicit `httpOnly`, `secure`, or `sameSite` options; logout only reads the cookie and does not revoke a bearer-only token; request validation and rate limiting are limited; and transport security/CSRF defenses must be configured for the deployment. Review these areas, validate positive finite transaction amounts, and perform a security review before handling real funds.

## Project structure

```text
.
├── server.js
└── src
    ├── app.js
    ├── config
    │   └── db.js
    ├── controllers
    │   ├── account.controller.js
    │   ├── auth.controller.js
    │   └── transaction.controller.js
    ├── middleware
    │   └── auth.middleware.js
    ├── models
    │   ├── account.model.js
    │   ├── blacklist.model.js
    │   ├── ledger.model.js
    │   ├── transaction.model.js
    │   └── user.model.js
    ├── routes
    │   ├── account.routes.js
    │   ├── auth.routes.js
    │   └── transaction.routes.js
    └── services
        └── email.service.js
```

## Development and testing

Run the development server with `npm run dev`. The `npm test` script is currently a placeholder and exits with an error; automated tests have not yet been configured.
