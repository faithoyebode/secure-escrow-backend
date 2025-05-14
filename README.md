
# Escrow Platform API

A RESTful API backend for the Escrow Platform, built with Express.js, TypeScript, TypeORM, and SQLite.

## Features

- User authentication & authorization
- Product management
- Escrow transaction handling
- Dispute resolution system
- Seller wallet management
- File uploads for products and dispute evidence

## Prerequisites

- Node.js (v14+)
- npm or yarn

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/faithoyebode/secure-escrow-backend.git
cd escrow-platform-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env file with your configuration
```

4. Run database migrations and seed the database
```bash
npm run migration:run
npm run seed
```

5. Start the development server
```bash
npm run dev
```

The API will be available at `https://secure-escrow-backend.onrender.com/api`

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Products Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product (sellers only)
- `PUT /api/products/:id` - Update a product (seller or admin)
- `DELETE /api/products/:id` - Delete a product (seller or admin)
- `GET /api/products/seller/:sellerId` - Get products by seller

### Escrow Endpoints
- `GET /api/escrows` - Get user's escrows
- `GET /api/escrows/:id` - Get escrow by ID
- `POST /api/escrows` - Create a new escrow
- `PATCH /api/escrows/:id/status` - Update escrow status
- `GET /api/escrows/all` - Get all escrows (admin only)

### Dispute Endpoints
- `GET /api/disputes` - Get user's disputes
- `GET /api/disputes/:id` - Get dispute by ID
- `POST /api/disputes` - Create a new dispute
- `PATCH /api/disputes/:id/resolve` - Resolve a dispute (admin only)
- `GET /api/disputes/all` - Get all disputes (admin only)
- `GET /api/disputes/:id/comments` - Get comments for a dispute
- `POST /api/disputes/:id/comments` - Add a comment to a dispute

### Wallet Endpoints
- `GET /api/wallet/balance` - Get wallet balance (sellers only)
- `POST /api/wallet/withdraw` - Withdraw funds (sellers only)

## Default Users

After running the seed script, you can use these accounts:

- **Admin:** admin@escrow.com / admin123
- **Seller:** john@example.com / seller123
- **Buyer:** alice@example.com / buyer123

## License

MIT
