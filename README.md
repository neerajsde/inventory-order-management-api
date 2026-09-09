# Inventory Order Management API

A robust, production-ready backend REST API for managing users, products, and orders. Built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **Authentication:** JWT-based auth with separate Access and Refresh tokens.
- **Product Management:** Full CRUD operations with advanced querying (pagination, category/availability filtering, text search, price ranges, and sorting).
- **Order Management:** Secure order creation with atomic stock reduction, rollback safety, and user-isolated order histories.
- **Validation:** Type-safe runtime schema validation using Zod.
- **Security:** Helmet headers, CORS, Rate Limiting, and robust error handling.
- **Logging:** Structured JSON logging using Pino.

---

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18 or higher)
- **MongoDB** (Local standalone/replica set or MongoDB Atlas)
- **Redis** (Required for rate limiting/caching layers)

---

## Setup Instructions

**1. Install Dependencies**
```bash
npm install
```

**2. Configure Environment Variables**
Create or update the `.env` file in the root directory. Use the following template:

```env
PORT=4000
HOST=127.0.0.1
NODE_ENV=development

# Database & Redis
MONGO_URI=mongodb://localhost:27017/inventory-management
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Authentication Secrets
JWT_SECRET=supersecretjwtkey12345
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecretrefreshtoken12345
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=supersecretcookiekey12345
```

**3. Run the Development Server**
```bash
npm run dev
```
The server will start on `http://localhost:4000` (by default) and auto-reload on file changes.

**4. Build for Production**
```bash
npm run build
npm start
```

---

## Project Structure

The codebase follows a modular, feature-based architecture:

```text
src/
├── config/         # Environment variables, MongoDB, and Redis setups
├── middlewares/    # Express middlewares (auth, errors, rate limits, logging)
├── models/         # Mongoose schemas & interfaces (User, Product, Order)
├── modules/        # Feature-based business logic and routing
│   ├── auth/       # Register, login, refresh token logic
│   ├── order/      # Order creation, listing, stock management
│   └── product/    # Product CRUD, search, filtering
├── routes/         # Main API router aggregating module routes
├── utils/          # Utilities (ApiError, logger, etc.)
├── app.ts          # Express app configuration
└── server.ts       # HTTP Server entry point
```

---

## API Structure

Base URL: `/api/v1`

### Authentication (`/auth`)
- `POST /auth/register` - Register a new user.
- `POST /auth/login` - Login to receive `accessToken` and `refreshToken`.
- `POST /auth/refresh` - Exchange a valid `refreshToken` for a new `accessToken`.

### Products (`/products`)
*Requires `Bearer <accessToken>`*
- `POST /products` - Create a new product.
- `GET /products` - List products. Supports query parameters:
  - `page`, `limit` (Pagination)
  - `search` (Name matching)
  - `category` (Exact match)
  - `inStock` (`true`/`false`)
  - `minPrice`, `maxPrice`
  - `sortBy`, `sortOrder`
- `GET /products/:id` - Get details of a single product.
- `PATCH /products/:id` - Partially update a product.
- `DELETE /products/:id` - Delete a product.

### Orders (`/orders`)
*Requires `Bearer <accessToken>`*
- `POST /orders` - Create a new order. Request body takes an array of `items` (productId, quantity). Safely validates and reduces product stock.
- `GET /orders` - List all orders belonging to the authenticated user. Supports pagination and `status` filtering.
- `GET /orders/:id` - Get a specific order (if owned by the user).

---

## Testing via Postman

A pre-configured Postman collection is included in the repository to easily test the APIs.

1. Open Postman and click **Import**.
2. Select the `postman_collection.json` file located in the root of this project.
3. The collection has scripts that **automatically capture and set** the `accessToken` and `refreshToken` when you use the Login API. Simply run the Login request, and you can immediately use the Product and Order APIs without manually copying tokens!
