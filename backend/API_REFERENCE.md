# Backend API Reference

Single-file API list for team handoff.

Base URL (local): `http://localhost:4000`  
Auth header for protected routes: `Authorization: Bearer <token>`  
Content type: JSON unless noted.

## Roles

- `CORPORATE_ADMIN`
- `CEE`
- `VENDOR`
- `STORE_OWNER`

---

## Health

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Service health check |

---

## Auth

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register user with role |
| POST | `/auth/login` | Public | Login for admin/cee/vendor/store |
| POST | `/auth/login/store` | Public | Store-only login (rejects non-store users) |
| POST | `/auth/register/store` | Public | Store-only registration |
| POST | `/auth/forgot-password/request-otp` | Public | Send reset OTP to email |
| POST | `/auth/forgot-password/reset` | Public | Reset password with email + OTP |
| POST | `/auth/sync-store-owners` | `CORPORATE_ADMIN` | Create/link store-owner users from stores |
| POST | `/auth/bootstrap-admin` | Public (use carefully) | Bootstrap initial user |

---

## Products

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/vendors/products` | `VENDOR` | Create product (JSON or multipart with images) |
| POST | `/products/approve` | `CORPORATE_ADMIN` | Approve/reject product |
| GET | `/products` | Public | List approved products (catalog) |
| GET | `/admin/products/pending` | `CORPORATE_ADMIN` | List pending product approvals |
| GET | `/admin/products` | `CORPORATE_ADMIN` | List all products |
| GET | `/vendors/me/products` | `VENDOR` | List vendor’s products |
| GET | `/vendors/me/product?id=<id>` | `VENDOR` | Get single vendor product |
| PATCH | `/vendors/me/product` | `VENDOR` | Update vendor product (JSON or multipart) |

Notes:
- Product image upload uses multipart field `images`.
- Product update may set rejected product back to pending approval.

---

## Orders

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/stores/orders` | `STORE_OWNER` | Place order (creates `PENDING_CEE_APPROVAL`) |
| POST | `/orders/cee-approval` | `CEE`, `CORPORATE_ADMIN` | CEE approve/reject decision |
| POST | `/orders/vendor-decision` | `VENDOR` | Vendor accept/reject decision |
| POST | `/orders/estimate` | `VENDOR` | Create/update estimate and mark estimate sent |
| POST | `/orders/payment-verify` | `VENDOR` | Mark payment verified |
| GET | `/admin/cost-letters` | `CORPORATE_ADMIN` | Orders containing estimates |
| GET | `/admin/orders/pending-cee` | `CEE`, `CORPORATE_ADMIN` | Pending CEE queue |
| GET | `/vendors/me/orders` | `VENDOR` | Vendor order list |
| GET | `/stores/me` | `STORE_OWNER` | Current user’s store |
| GET | `/stores/me/orders` | `STORE_OWNER` | Store order history |
| GET | `/cee/orders` | `CEE` (and one version allows admin) | CEE territory order log |

Important workflow note:
- On vendor reject, `remarks` is required.
- Vendor reject sends order back to `PENDING_CEE_APPROVAL` and notifies CEE + store.

---

## Shipments

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/orders/shipment` | `VENDOR` | Create/update shipment with tracking, mark order shipped |
| POST | `/webhooks/shipment/:provider` | Public (webhook) | Shipment provider webhook stub |

---

## Admin

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/admin/vendors` | `CORPORATE_ADMIN` | List vendors with counts |
| PATCH | `/admin/vendors` | `CORPORATE_ADMIN` | Pause/activate vendor |
| GET | `/admin/stores` | `CORPORATE_ADMIN` | List stores with owner/CEE mapping |
| PATCH | `/admin/stores` | `CORPORATE_ADMIN` | Pause/activate store and/or update `ceeUserId` |
| GET | `/admin/cee-users` | `CORPORATE_ADMIN` | List CEE users for mapping |

---

## CEE

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/cee/me/stores` | `CEE` | Stores mapped to logged-in CEE |
| GET | `/cee/orders` | `CEE` | Full order log for CEE territory |

---

## Email Action

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/email/action?token=<token>` | Public (signed token) | One-click action from email (product/order approval links) |

---

## Quick Request Shapes (Most Used)

### 1) Place store order
`POST /stores/orders`
```json
{
  "storeId": "store_id",
  "vendorId": "vendor_id",
  "items": [
    { "productId": "prod_1", "quantity": 5, "unitPrice": 1000 }
  ],
  "currency": "INR",
  "contactName": "John",
  "contactPhone": "9876543210",
  "shippingAddress": "Address line",
  "shippingState": "Karnataka",
  "shippingCity": "Bengaluru",
  "shippingPincode": "560001",
  "gstNumber": "29ABCDE1234F1Z5"
}
```

### 2) CEE approval
`POST /orders/cee-approval`
```json
{
  "orderId": "order_id",
  "approve": true,
  "remarks": "optional remarks"
}
```

### 3) Vendor decision
`POST /orders/vendor-decision`
```json
{
  "orderId": "order_id",
  "accept": false,
  "remarks": "Mandatory when accept=false"
}
```

### 4) Forgot password flow
`POST /auth/forgot-password/request-otp`
```json
{ "email": "user@example.com" }
```

`POST /auth/forgot-password/reset`
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newStrongPassword123"
}
```

