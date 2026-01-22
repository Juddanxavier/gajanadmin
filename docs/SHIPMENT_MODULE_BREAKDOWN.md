<!-- @format -->

# 📦 Shipment Module Breakdown

This document provides a comprehensive overview of how the Shipment Module works
in the Kajen Gajan Admin Dashboard. It covers the creation, management,
tracking, and visualization workflows.

---

## 1. Core Workflow: Creating a Shipment

### **User Interface**

- **Component**: `CreateShipmentDialog`
- **Input**:
  - **Tracking Number**: Required (min 3 chars). Includes auto-detection logic.
  - **Courier**: Optional (Auto-detected if possible, or selected from list).
  - **Customer**: Name (Required), Email/Phone (Optional). Can be linked to an
    existing User.
  - **Amount**: Optional invoice value.

### **Process Flow**

1.  **Initiation**: User submits the form.
2.  **Server Action**: `createShipmentAction` is called.
    - Verifies staff permissions.
    - Initializes `ShipmentService` with Admin privileges.
3.  **Service Logic** (`ShipmentService.createShipment`):
    - **Duplicate Check**: Checks if the tracking number exists.
      - If found and **soft-deleted**: Restores it.
      - If found and **active**: Throws error (prevents duplicates).
    - **Provider Registration**: Calls the external tracking API (e.g.,
      Track123) to register the tracking number.
    - **Database Insert**: Creates a new record in the `shipments` table with:
      - `status`: Initial status from API (or 'pending').
      - `origin/destination`: Country codes from API.
      - `latest_location`: Current location string.
    - **Checkpoints**: Inserts initial tracking history into `tracking_events`.

### **Post-Add Actions**

- **UI Update**: The list refetches automatically (`revalidatePath`).
- **Tracking**: The external provider begins monitoring the package.
- **Webhooks**: The system listens for future updates from the provider.

---

## 2. Managing Shipments

### **Deleting**

- **Soft Delete** (Default):
  - Sets `deleted_at` timestamp.
  - Shipment is hidden from main views but preserved in DB.
  - Can be restored by re-adding the same tracking number.
- **Hard Delete** (Optional/Admin):
  - Calls Provider API to **stop tracking** (save costs).
  - Permanently removes record from DB.

### **Syncing (Updates)**

Shipments are updated in two ways:

1.  **Manual Sync**: User clicks "Refresh" -> Calls `syncShipment` -> Pulls
    latest data from API immediately.
2.  **Webhooks (Automated)**:
    - Provider pushes update -> `api/webhooks/track123` ->
      `ShipmentService.processWebhook`.
    - Updates status, location, and checkpoints.
    - **Triggers Notifications**: If status changes (e.g., `In Transit` ->
      `Delivered`), the `NotificationService` sends emails/alerts to the
      customer.

---

## 3. Analytics & Visualization

### **Charts & Stats**

Data is aggregated real-time (suitable for current scale, may need optimization
for high scale).

| Component       | metric                                        | Source Function                                           |
| :-------------- | :-------------------------------------------- | :-------------------------------------------------------- |
| **StatCards**   | Total, Active, Pending, Exceptions, Delivered | `getShipmentStats()` (Counts by status)                   |
| **Trend Chart** | Daily Volume, Delivery Performance            | `getShipmentTrends()` (30-day history)                    |
| **World Map**   | Geographic Distribution                       | `getActiveShipmentDestinations()` (Aggregates by country) |

### **The New World Map (Dotted)**

- **Visual**: Displays global reach using a dotted grid pattern.
- **Data**: Groups active shipments by `destination_country` code.
- **Interaction**: Hover to see shipment counts per country.

---

## 4. Improvements & Recommendations

### **🚀 Performance & Scale**

1.  **Materialized Views**: Currently, stats are calculated by counting rows on
    every page load. For >10k shipments, use Postgres Materialized Views or
    separate `analytics` tables updated via triggers.
2.  **Batch Sync**: Add a background cron job to batch-sync "Pending" shipments
    that haven't updated in >24h, as a fallback to webhooks.

### **🛡️ Robustness**

1.  **Carrier Detection**: Move `detectCarrier` logic to the server or use the
    Provider's "identify" API for higher accuracy.
2.  **Webhook Security**: Ensure strictly verified signatures for all incoming
    webhooks to prevent spoofing.
3.  **Validation**: Stricter regex validation for tracking numbers per carrier
    to catch typos early.

### **✨ User Experience**

1.  **Carrier Logos**: Display carrier logos in the list and dialog (URL is
    available in `carriers` table).
2.  **Est. Delivery Countdown**: detailed "Arrives in X days" widget for active
    shipments.
3.  **Issue Resolution**: "Resolve Exception" workflow to flag shipments that
    need manual attention.

---

## 5. DB Schema Reference

### `shipments`

- `id` (UUID)
- `carrier_tracking_code` (Unique)
- `carrier_id` (e.g., 'dhl', 'fedex')
- `status` (pending, in_transit, delivered, exception, etc.)
- `customer_details` (JSONB: name, email, phone)
- `destination_country` (ISO code, e.g., 'US')

### `tracking_events`

- `shipment_id` (FK)
- `status` (Event status)
- `location` (City, Country)
- `occurred_at` (Timestamp)
