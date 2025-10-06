# Mobile Receipts Backend Integration

## API Endpoints Required

### 1. Get Mobile Receipts
**Endpoint:** `GET /api/MobileReceipts/GetMobileReceipts`

**Parameters:**
- `callNbr` (string): Job/Call Number
- `techID` (string): Technician ID

**Response:** Array of MobileReceipt objects
```json
[
  {
    "codeDesc": "Travel expenses for job site visit",
    "expenseTableIndex": 123,
    "techPaid": 25.50,
    "companyPaid": 75.00,
    "callNbr": "12345",
    "techId": "TECH001"
  }
]
```

### 2. Show Receipt Image
**Endpoint:** `GET /api/receipts/show`

**Parameters:**
- `id` (number): ExpenseTableIndex
- `ViewMode` (string): "Thumbnail" or "Full"

**Response:** Image file (JPEG/PNG)

## Legacy ASP.NET Equivalent
- **Data Method:** `EtechDataAcess.ETechEquipmentData.GetMobileReceipts(CallNbr, TechID, ref Result)`
- **Image Handler:** `ShowReceipt.ashx?id={ExpenseTableIndex}&ViewMode={ViewMode}`

## Implementation Notes
1. The Angular component expects the same data structure as the legacy GridView
2. Images should be served with proper MIME types
3. Error handling should return appropriate HTTP status codes
4. The ViewMode parameter determines image size (Thumbnail vs Full)

## Database Schema (Expected)
The backend should query tables that contain:
- Expense records with associated receipt images
- Purpose/Description of the expense
- Tech/Company paid amounts
- Expense table index for image retrieval