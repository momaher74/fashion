# Offer Logic Explanation

## Overview

The offer system supports two types of offers that can be applied to products:

1. **Global Offers**: Apply to all products when active
2. **Product-Specific Offers**: Apply only to a specific product

## Key Rule: Bigger Discount Wins

**If a product has both a global and product-specific offer active, the bigger discount is applied.**

## How It Works

### 1. Offer Types

Offers can be either:
- **Percentage**: Discount is calculated as a percentage of the product price
- **Fixed Amount**: Discount is a fixed amount subtracted from the price

### 2. Offer Scope

- **Global (`scope: 'global'`)**: 
  - Applies to all products
  - No `productId` required
  
- **Product-Specific (`scope: 'product'`)**:
  - Applies only to the specified product
  - Requires `productId` field

### 3. Offer Validity

An offer is considered active when:
- `isActive === true`
- Current date is between `startDate` and `endDate`

### 4. Discount Calculation

The `ProductFormatterService` handles all offer logic:

```typescript
// For each active offer (global or product-specific)
for (const offer of activeOffers) {
  const discount = calculateDiscount(product.price, offer);
  // Keep track of the biggest discount
  if (discount > bestDiscount) {
    bestDiscount = discount;
    bestOffer = offer;
  }
}

// Apply the best discount
finalPrice = product.price - bestDiscount;
```

### 5. Example Scenarios

#### Scenario 1: Only Global Offer
- Product price: 100 EGP
- Global offer: 10% off
- **Result**: Final price = 90 EGP (10 EGP discount)

#### Scenario 2: Only Product-Specific Offer
- Product price: 100 EGP
- Product offer: 15% off
- **Result**: Final price = 85 EGP (15 EGP discount)

#### Scenario 3: Both Offers Active
- Product price: 100 EGP
- Global offer: 10% off → discount: 10 EGP
- Product offer: 15% off → discount: 15 EGP
- **Result**: Final price = 85 EGP (15 EGP discount applied - bigger discount wins)

#### Scenario 4: Mixed Offer Types
- Product price: 100 EGP
- Global offer: 10% off → discount: 10 EGP
- Product offer: 20 EGP fixed → discount: 20 EGP
- **Result**: Final price = 80 EGP (20 EGP discount applied - bigger discount wins)

## Implementation Location

The offer logic is implemented in:
- **Service**: `src/common/services/product-formatter.service.ts`
- **Method**: `formatProduct(product, offers, language)`

## Usage

All product responses automatically go through the formatter:

```typescript
// In ProductService
const products = await this.productModel.find(query);
const offers = await this.offerModel.find({ isActive: true });
return this.productFormatter.formatProducts(products, offers, language);
```

The formatter:
1. Finds all active offers (global + product-specific)
2. Calculates discount for each
3. Applies the biggest discount
4. Returns formatted product with `finalPrice` and `offerApplied` fields

## Response Format

Products returned from the API include:

```json
{
  "id": "product-id",
  "name": "Product Name",
  "price": 100,
  "finalPrice": 85,
  "offerApplied": {
    "title": "15% Off",
    "type": "percentage",
    "value": 15,
    "discount": 15
  }
}
```

If no offer is applied, `offerApplied` will be `undefined` and `finalPrice` equals `price`.

