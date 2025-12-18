# Fashion Ecommerce Backend

A clean, scalable NestJS ecommerce backend for a Flutter clothes shopping app.

## Tech Stack

- **NestJS** (TypeScript)
- **MongoDB** with Mongoose
- **Firebase Admin SDK** (social auth + push notifications)
- **Cloudinary** for image uploads
- **JumiaPay** payment gateway + Cash on Delivery
- **Multilingual support** (Arabic `ar` and English `en`)

## Architecture

The project follows clean architecture principles with:
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **Schemas**: MongoDB models
- **DTOs**: Data validation with class-validator
- **Common Module**: Shared utilities (formatter, Cloudinary, etc.)

## Project Structure

```
src/
├── admin/              # Admin module (CRUD operations)
├── auth/               # Authentication with Firebase
├── cart/               # Shopping cart management
├── common/             # Shared utilities and services
│   ├── decorators/     # Custom decorators
│   ├── enums/          # Enumerations
│   ├── filters/        # Exception filters
│   ├── interceptors/   # Response interceptors
│   ├── interfaces/     # TypeScript interfaces
│   ├── pipes/          # Validation pipes
│   └── services/       # Shared services (formatter, Cloudinary)
├── notification/       # Firebase Cloud Messaging
├── offers/             # Product offers (global & product-specific)
├── order/              # Order management
├── payment/            # Payment processing (JumiaPay + COD)
├── product/            # Product management
├── schemas/            # MongoDB schemas
└── user/               # User profile management
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/fashion-ecommerce

# Firebase Admin SDK Configuration
# Get this from Firebase Console -> Project Settings -> Service Accounts
# Copy the entire JSON and paste it here as a single line
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JumiaPay Configuration
JUMIAPAY_API_URL=https://api.jumiapay.com
JUMIAPAY_API_KEY=your-jumiapay-api-key
JUMIAPAY_SECRET_KEY=your-jumiapay-secret-key
JUMIAPAY_MERCHANT_ID=your-merchant-id
JUMIAPAY_TEST_MODE=true
JUMIAPAY_CALLBACK_URL=http://localhost:3000/api/payment/jumiapay/callback
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Core Modules

### 1. Auth Module
- Firebase authentication verification
- Social login (Google / Facebook / Apple via Firebase)
- Auto-creates user in MongoDB after first login
- Supports user language preference (`ar` or `en`)
- Roles: USER, ADMIN

**Endpoints:**
- `POST /api/auth/login` - Login with Firebase token

### 2. User Module
- Profile management
- Language setting (ar / en)
- FCM token for notifications

**Endpoints:**
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `PATCH /api/users/me/fcm-token` - Update FCM token

### 3. Product Module
- Multilingual product data (name, description)
- Images stored as Cloudinary URLs
- Price with currency support
- Sizes and colors arrays
- Category filtering
- Active/inactive status

**Filters:**
- By size
- By color
- By price range
- By category

**Endpoints:**
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `GET /api/products/categories` - Get all categories
- `POST /api/products` - Create product (Admin only)
- `PATCH /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### 4. Offers Module
Supports two types of offers:
- **Global offer**: Applies to all products
- **Product-specific offer**: Applies to a single product

**Offer Logic:**
- Can be percentage or fixed amount
- If a product has both global and private offer → **APPLY THE BIGGER DISCOUNT**
- Must have start and end date
- Supports ar/en titles

**Endpoints:**
- `GET /api/offers` - List all offers
- `GET /api/offers/active` - List active offers
- `GET /api/offers/:id` - Get offer details
- `POST /api/offers` - Create offer (Admin only)
- `PATCH /api/offers/:id` - Update offer (Admin only)
- `DELETE /api/offers/:id` - Delete offer (Admin only)

### 5. Product Formatter Service
A reusable formatter function that:
- Takes raw product + offers
- Calculates final price
- Applies the correct offer logic (bigger discount wins)
- Returns unified response shape

**All product responses go through this formatter.**

**Example Response:**
```json
{
  "id": "product-id",
  "name": "Product Name",
  "description": "Product Description",
  "images": ["url1", "url2"],
  "price": 100,
  "finalPrice": 80,
  "currency": "EGP",
  "offerApplied": {
    "title": "20% Off",
    "type": "percentage",
    "value": 20,
    "discount": 20
  },
  "sizes": ["S", "M", "L"],
  "colors": ["Red", "Blue"]
}
```

### 6. Cart Module
- Add/remove products
- Handle selected size & color
- Calculate totals using formatter

**Endpoints:**
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add item to cart
- `PATCH /api/cart/:itemIndex` - Update cart item
- `DELETE /api/cart/:itemIndex` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### 7. Order Module
- Create order from cart
- Store snapshot of product data
- Order status (pending, paid, shipped, delivered, canceled)
- Support language-based messages

**Endpoints:**
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status (Admin only)

### 8. Payment Module
- **JumiaPay integration**
  - Create payment session
  - Verify callback
  - Test mode support
- **Cash on Delivery**
- Save payment method & status in order

**Endpoints:**
- `POST /api/payment/jumiapay/create` - Create JumiaPay session
- `POST /api/payment/jumiapay/callback` - JumiaPay callback
- `POST /api/payment/cod/confirm` - Confirm Cash on Delivery

### 9. Notification Module
- Firebase Cloud Messaging
- Send notifications for:
  - Order created
  - Order paid
  - Order status updated
- Messages support ar/en

**Endpoints:**
- `POST /api/notifications/test` - Test notification (for development)

### 10. Admin Module
- Admin authentication required
- CRUD products
- CRUD offers (global & product)
- Choose product currency
- Enable/disable products
- View orders

**Endpoints:**
- `GET /api/admin/dashboard` - Dashboard stats
- All product/offer CRUD endpoints (see above)
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status

## Offer Logic Explanation

The offer system works as follows:

1. **Global Offers**: Apply to all products when active
2. **Product-Specific Offers**: Apply only to the specified product
3. **Priority Rule**: If a product has both a global and product-specific offer active, **the bigger discount is applied**

**Example:**
- Product price: 100 EGP
- Global offer: 10% off → discount: 10 EGP
- Product-specific offer: 15% off → discount: 15 EGP
- **Result**: Final price = 85 EGP (15 EGP discount applied)

The `ProductFormatterService` handles all this logic automatically.

## Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

Admin endpoints require the user to have `ADMIN` role.

## Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Multilingual Support

All product and offer data supports Arabic and English:
- Product names and descriptions
- Offer titles
- Notification messages

The language is determined by:
1. Query parameter `?language=ar` or `?language=en`
2. User's language preference (stored in user profile)
3. Default: English (`en`)

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure all environment variables
3. Build the project: `npm run build`
4. Start: `npm run start:prod`

## License

UNLICENSED

