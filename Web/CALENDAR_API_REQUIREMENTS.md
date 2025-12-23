# Calendar API Requirements to Match Legacy Implementation

## Backend API Changes Needed

The `GetCalenderJobData` API endpoint needs to be updated to match the legacy ASP.NET implementation's stored procedure `aaTechCalendar_Module_Updated`.

### Current API Signature
```
GET /Jobs/GetCalenderJobData?ownerId={ownerId}&tech={tech}&state={state}&type={type}&startDate={startDate}&endDate={endDate}
```

### Required Response Format

The API should return a response matching this TypeScript interface:

```typescript
{
  "jobDetails": CalendarJobDetails[],  // Table[0] from stored procedure
  "statistics": {                       // Table[1] from stored procedure
    "overDue": number,
    "tomorrow": number,
    "due3": number,
    "due5": number,
    "due10": number
  }
}
```

### CalendarJobDetails Interface
Each job detail should include:
```typescript
{
  "description": string,        // Full job description with HTML/formatting
  "status": string,             // CON, FCD, APPT, VACATION, TRAINING, CONFERENCE, SICK, TRAVEL, DRUGTEST
  "startDate": Date,
  "startTime": Date,
  "endDate": Date,
  "endTime": Date,
  "address1": string,
  "siteContact": string,
  "sitePhone": string,
  "offname": string,
  "custName": string,
  "jobNotes": string,
  "backColor": string,
  "foreColor": string,
  "callNbr": string,           // Use "Federal Holiday" for federal holidays
  "techName": string
}
```

## Legacy Stored Procedure Behavior

The legacy implementation uses:
- **Stored Procedure**: `aaTechCalendar_Module_Updated` (when account manager dropdown is enabled)
- **Alternative**: `aaTechCalendar_Module` (older version)

### Parameters
```sql
exec dbo.aaTechCalendar_Module_Updated 
  @firstDate,      -- Previous month 15th
  @lastDate,       -- Next month 15th (or Jan 15 next year for Nov/Dec)
  'Tech',          -- Fixed value
  @Tech,           -- TechID or '0' if "All"
  @AccMgr,         -- Account Manager ID or "All"
  @State,          -- State code or "All"
  @ApptType        -- Appointment type or "All"
```

### Date Range Calculation
The Angular component now calculates dates matching the legacy logic:
- **firstDate**: 15th of previous month (or Dec 15 of previous year if current month is January)
- **lastDate**: 15th of next month (or Jan 15 of next year if current month is November or December)

## Statistics Calculation

The API should return statistics (Table[1]) with these fields:
- **OverDue**: Jobs past due date
- **Tomorrow**: Jobs due tomorrow
- **Due3**: Jobs due in 3 days
- **Due5**: Jobs due in 5 days
- **Due10**: Jobs due in 10 days

These correspond to the colored statistics bar in the UI:
- OVERDUE: Red (#e60000)
- DUE TOMORROW: Orange (#E8A90E)
- DUE 3 DAYS: Yellow (#f4d24e)
- DUE 5 DAYS: Greenish (#b3b300)
- DUE 10 DAYS: Green (#86b300)

## Multi-Day Event Handling

**Note**: The Angular implementation now handles multi-day event expansion client-side, matching the legacy behavior. The API does NOT need to split multi-day events - just return the event once with its actual start and end dates. The component will:
1. Calculate `daysDiff` between startDate and endDate
2. Create separate calendar entries for each day
3. Adjust start/end times appropriately (00:00 for middle days, original times for first/last days)

## Special Event Types

### Federal Holidays
- Set `callNbr` = "Federal Holiday"
- Displays in green (#76b007)
- Not clickable

### Vacation/Appointments
- Set `status` appropriately:
  - "VACATION" → Pink background (#fddbf9)
  - "APPT" → Pink background (#fddbf9)
  - "DRUGTEST" → Red background (#e60000) with white text
- Not clickable (no job details link)

### Regular Jobs
- Status: "CON", "FCD", etc.
- Blue background (#6bc6e1)
- Clickable - links to `/jobs/job-notes-info?CallNbr={callNbr}&TechName={techName}&Status={status}`

## Validation

The API should validate that at least one filter is NOT "All":
- If `ownerId`, `tech`, and `state` are ALL "All", the UI will show: "You must select at least one name"

## Backward Compatibility

If the API cannot immediately return the new format, the Angular code has a fallback:
```typescript
if (res && (res as any).jobDetails) {
  // New format with statistics
  const response = res as CalendarResponse;
  this.jobDetailList = response.jobDetails;
  this.statistics = response.statistics;
} else {
  // Old format - just array
  this.jobDetailList = res as any;
  this.statistics = null;
}
```

This allows the calendar to work with just the job array initially, but statistics won't display until the API is updated.

## Example API Response

```json
{
  "jobDetails": [
    {
      "description": "8:00 AM - 5:00 PM<br>ABC Company<br>Site Maintenance",
      "status": "CON",
      "startDate": "2025-12-22T00:00:00",
      "startTime": "2025-12-22T08:00:00",
      "endDate": "2025-12-22T00:00:00",
      "endTime": "2025-12-22T17:00:00",
      "address1": "123 Main St, City, ST 12345",
      "siteContact": "John Doe",
      "sitePhone": "555-1234",
      "offname": "Main Office",
      "custName": "ABC Company",
      "jobNotes": "Regular maintenance visit",
      "backColor": "#6bc6e1",
      "foreColor": "#000000",
      "callNbr": "J123456",
      "techName": "Smith, John"
    },
    {
      "description": "Christmas Holiday",
      "status": "",
      "startDate": "2025-12-25T00:00:00",
      "startTime": "2025-12-25T00:00:00",
      "endDate": "2025-12-25T00:00:00",
      "endTime": "2025-12-25T23:59:00",
      "address1": "",
      "siteContact": "",
      "sitePhone": "",
      "offname": "",
      "custName": "",
      "jobNotes": "",
      "backColor": "#76b007",
      "foreColor": "#ffffff",
      "callNbr": "Federal Holiday",
      "techName": ""
    }
  ],
  "statistics": {
    "overDue": 5,
    "tomorrow": 3,
    "due3": 7,
    "due5": 12,
    "due10": 18
  }
}
```

## Testing Checklist

1. ✅ Date range calculation (15th to 15th logic)
2. ✅ Multi-day event expansion
3. ✅ Statistics bar display
4. ✅ Federal holiday styling (green)
5. ✅ Vacation/appointment styling (pink)
6. ✅ Drug test styling (red)
7. ✅ Regular job styling (blue) with clickable links
8. ✅ Technician role: auto-select name, disable dropdowns
9. ✅ Manager role: enable all dropdowns
10. ✅ Filter validation (at least one must be selected)
11. ✅ Navigation on month change
12. ✅ "Get Jobs" button functionality
