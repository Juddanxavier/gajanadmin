<!-- @format -->

# Lead Trends Sparkline - Debugging & Fixes

## 🐛 Issue Reported

"Lead Trends is not showing any data, but I have 1 completed lead"

## 🔍 Root Causes

### 1. **Date Range Issue**

The `getLeadTrends()` function defaults to 30 days:

```typescript
async getLeadTrends(days: number = 30, tenantIds?: string[])
```

**Problem**: If your lead was created more than 30 days ago, it won't appear in
the trends.

### 2. **Empty Data Detection**

The sparkline was checking `hasData` (array exists) but not checking if there's
actual lead data in those days.

**Problem**: Even with leads, if they're outside the date range, you'd see empty
days but no "no data" message.

## ✅ Fixes Implemented

### 1. **Better Data Validation**

```typescript
// Check if there's any actual lead data (not just empty days)
const hasActualData =
  hasData && data.some((d) => d.total > 0 || d.converted > 0 || d.lost > 0);
```

**Benefit**: Distinguishes between "no data array" vs "array with no leads"

### 2. **Debug Logging**

```typescript
console.log('LeadTrendsSparkline - Data:', {
  hasData,
  hasActualData,
  dataLength: data?.length,
  totalLeads,
  convertedLeads,
  lostLeads,
  sampleData: data?.slice(0, 3),
});
```

**Benefit**: You can now see in the browser console:

- If data is being received
- How many days of data
- What the actual values are
- Sample of the first 3 days

### 3. **Improved Empty State Message**

```typescript
{
  hasData
    ? 'No leads found in the selected period'
    : 'Data will appear here once leads are created';
}
```

**Benefit**: Clearer messaging about WHY there's no data

### 4. **Safer Value Extraction**

```typescript
const latestData = hasData ? data[data.length - 1] : null;
const totalLeads = latestData?.total || 0;
const convertedLeads = latestData?.converted || 0;
const lostLeads = latestData?.lost || 0;
```

**Benefit**: Prevents errors if data array is empty

## 🧪 How to Debug

### Step 1: Check Browser Console

Open DevTools (F12) and look for:

```
LeadTrendsSparkline - Data: {
  hasData: true,
  hasActualData: false,  // ← If false, no leads in date range
  dataLength: 30,
  totalLeads: 0,
  convertedLeads: 0,
  lostLeads: 0,
  sampleData: [...]
}
```

### Step 2: Check the Sample Data

Look at `sampleData` in the console:

```javascript
sampleData: [
  { date: '2026-01-10', total: 0, converted: 0, lost: 0 },
  { date: '2026-01-09', total: 0, converted: 0, lost: 0 },
  { date: '2026-01-08', total: 1, converted: 1, lost: 0 }, // ← Lead found here!
];
```

### Step 3: Check Lead Creation Date

If all days show 0, your lead might be older than 30 days.

Check in database:

```sql
SELECT id, created_at, status FROM leads ORDER BY created_at DESC LIMIT 5;
```

## 🔧 Solutions

### Solution 1: Lead is Too Old

If your lead was created more than 30 days ago:

**Option A**: Create a new test lead **Option B**: Increase the date range (see
below)

### Solution 2: Increase Date Range

Update the leads analytics page to fetch more days:

```typescript
// In app/(dashboard)/analytics/leads/page.tsx
const trendsResult = await getLeadTrends(90); // 90 days instead of 30
```

### Solution 3: Enable Mock Data

Toggle mock data in Settings → Developer to see sample data

## 📊 Expected Behavior

### With 1 Completed Lead (Created Today)

```
Total Leads: 1
Converted: 1
Lost: 0

Sparklines show:
- Total: Line with spike on today
- Converted: Line with spike on today
- Lost: Flat line at 0
```

### With 1 Completed Lead (Created 40 Days Ago)

```
Total Leads: 0
Converted: 0
Lost: 0

Message: "No leads found in the selected period"
```

## 🎯 Quick Test

### Test 1: Check Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to Leads Analytics
4. Look for the debug log

### Test 2: Check Data

Look at the console output:

- `hasData: true` → Data array exists ✅
- `hasActualData: true` → Leads found in range ✅
- `totalLeads: 1` → 1 lead showing ✅

### Test 3: Check Database

```sql
-- Check when your lead was created
SELECT
  id,
  created_at,
  status,
  NOW() - created_at as age
FROM leads
ORDER BY created_at DESC
LIMIT 5;
```

## 📝 Next Steps

1. **Check the console logs** - This will tell you exactly what's happening
2. **Verify lead creation date** - Make sure it's within 30 days
3. **Try mock data** - Enable in Settings to see if charts work
4. **Report findings** - Share the console log output

## 💡 Common Issues

### Issue: "No leads found in the selected period"

**Cause**: Lead created > 30 days ago  
**Fix**: Create new lead OR increase date range to 90 days

### Issue: Console shows `hasData: false`

**Cause**: API call failing or returning empty  
**Fix**: Check network tab for API errors

### Issue: Console shows data but chart is blank

**Cause**: Recharts rendering issue  
**Fix**: Check if `total`, `converted`, `lost` fields exist in data

## 🚀 Summary

**Changes Made**:

1. ✅ Added `hasActualData` check
2. ✅ Added console logging for debugging
3. ✅ Improved empty state messages
4. ✅ Safer value extraction

**Next Action**:

- Check browser console for debug output
- Share the console log to diagnose further
- Verify lead creation date is within 30 days
