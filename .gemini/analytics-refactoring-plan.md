<!-- @format -->

# Analytics Refactoring Plan

## Completed ✅

- **User Analytics** (`/analytics/users`)
  - Created `getUserDetailedTrends()` method in UserService
  - Created `getUserDetailedTrendsAction()` server action
  - Updated UserStatsCards to use real trend data
  - Each stat card shows unique data: totalUsers, activeUsers, admins, tenants

## To Do 📋

### 1. Dashboard (`/dashboard`)

**Current State:**

- Uses ShipmentService.getStats() and ShipmentService.getShipmentTrends()
- Shows 6 stat cards with mini charts
- Uses real shipment trend data

**Action Required:**

- ✅ Already using real data from ShipmentService.getShipmentTrends()
- The dashboard is already properly implemented with real trend data
- No changes needed

### 2. Shipment Analytics (`/shipments/analytics`)

**Action Required:**

- Check if it exists and what data it shows
- Apply same pattern if using mock data

### 3. Leads Analytics (`/analytics/leads`)

**Action Required:**

- Create `getLeadDetailedTrends()` method in LeadsService
- Create server action for detailed trends
- Update LeadStatsCards to use real trend data
- Implement proper data mapping for each stat type

## Implementation Steps

### For Leads Analytics:

1. **Backend (LeadsService)**

   ```typescript
   async getLeadDetailedTrends(days: number = 30) {
     // Fetch leads with status, created_at, etc.
     // Group by date and calculate:
     // - totalLeads: new leads per day
     // - convertedLeads: leads converted to customers
     // - activeLeads: leads in progress
     // - closedLeads: leads closed/lost
   }
   ```

2. **Server Action**

   ```typescript
   export async function getLeadDetailedTrendsAction(days: number = 30);
   ```

3. **Update LeadStatsCards**
   - Accept detailed trend data
   - Map each stat to its corresponding data field
   - Remove any mock/derived data generation

### For Shipment Analytics (if needed):

1. Check current implementation
2. If using ShipmentService.getShipmentTrends(), verify it returns detailed data
3. Update stat cards if they're using mock data

## Benefits

✅ **Accurate Data**: Real historical trends instead of approximations ✅
**Unique Patterns**: Each stat shows its actual trend ✅ **Consistent UX**: Same
pattern across all analytics pages ✅ **Better Insights**: Users can see real
patterns in their data
