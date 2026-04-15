# Tanishq Corporate Gifting Platform

This platform is designed to manage the full corporate gifting order cycle across four business roles:

- **Store**
- **CEE (City / Territory Manager)**
- **Vendor**
- **Corporate Admin**

It creates a controlled workflow so every order is validated, approved, fulfilled, and tracked with clear accountability.

---

## 1) Role-by-Role Responsibility

### Store
- Browses approved product catalog.
- Places order with contact and delivery details.
- Receives order updates, estimate, and shipment progress.

### CEE
- Reviews all store orders from assigned territory.
- Approves or rejects before vendor action.
- Monitors all territory orders in a complete order log.

### Vendor
- Receives only CEE-approved orders.
- Accepts/rejects with mandatory reason.
- Sends estimate, confirms payment, and dispatches shipment.

### Corporate Admin
- Governs master data and process.
- Monitors pending approvals and overall flow.
- Ensures policy and SLA compliance across teams.

---

## 2) End-to-End Order Workflow (Order to Delivery)

### Step 1: Order Creation by Store
1. Store user selects products and quantity.
2. System validates quantity rules (minimum, maximum, stock).
3. Store submits checkout information (contact, address, city/state/pincode, GST optional).
4. Order is created and tagged for CEE approval.

**Business outcome:** only valid, complete orders enter pipeline.

### Step 2: CEE Territory Review
1. CEE sees incoming order in queue.
2. CEE approves or rejects based on business checks.
3. Decision is recorded in order history.

**If CEE rejects:** order stops with rejection status.  
**If CEE approves:** order moves to vendor acceptance stage.

### Step 3: Vendor Decision
1. Vendor reviews approved order.
2. Vendor either accepts or rejects.
3. If vendor rejects, **reason is mandatory**.

**If vendor rejects:**
- Order is automatically routed back to CEE for re-review.
- Email notification is sent to:
  - Assigned CEE
  - Store who placed the order
- Rejection reason is included for transparency.

**If vendor accepts:** order proceeds to estimate stage.

### Step 4: Estimate / Cost Letter
1. Vendor prepares estimate (subtotal, tax, shipping, total).
2. Estimate is sent to store and linked to the order.

**Business outcome:** store gets formal cost view before completion.

### Step 5: Payment Confirmation
1. Vendor verifies payment (as per offline/business process).
2. Order moves to payment confirmed status.

### Step 6: Shipment and Delivery
1. Vendor adds shipment details (courier, tracking).
2. Order is marked shipped.
3. Final status moves to delivered on completion.

**Business outcome:** end-to-end traceability from order creation to delivery.

---

## 3) Exception Handling and Control Points

- **Invalid quantities** are blocked before order creation.
- **Missing CEE mapping** blocks order creation and flags admin dependency.
- **Vendor rejection requires reason** (cannot reject silently).
- **CEE order log** keeps historical visibility (orders do not disappear after action).
- **Email notifications** provide action awareness across stakeholders.

---

## 4) Visibility by Stakeholder

- **Store view:** own order history, current status, estimates, shipment progress.
- **CEE view:** all orders in assigned territory (pending + historical log).
- **Vendor view:** actionable order queue + post-acceptance operations.
- **Admin view:** governance dashboards and approval oversight.

---

## 5) Why This Flow Works for Business

- Prevents unapproved direct vendor fulfillment.
- Enforces regional accountability through CEE ownership.
- Maintains audit trail for every decision.
- Reduces communication gaps through automatic notifications.
- Scales cleanly across many stores, CEEs, and vendors.

---

## 6) Short Demo Story (for Leadership Presentation)

1. Store places order for gifting inventory.
2. CEE approves based on territory and policy.
3. Vendor accepts and sends estimate.
4. Payment is verified.
5. Shipment dispatched and tracked.
6. If vendor rejects, order returns to CEE with reason and both CEE/store are informed immediately.

This demonstrates a controlled, enterprise-friendly approval-to-fulfillment operating model.

