# Tech Tools API Documentation

This document outlines the API endpoints required for the Tech Tools feature.

## Base URL
All endpoints should be prefixed with the API base URL configured in `environment.ts` (`/TechTools`)

## Endpoints

### 1. Get Technicians List
**GET** `/TechTools/GetTechnicians`

Returns a list of all technicians available for selection.

**Response:**
```json
[
  {
    "techID": "string",
    "techname": "string"
  }
]
```

**Implementation Notes:**
- Corresponds to C# methods: `GetEmployeeStatusForJobList()` and `GetTechNamesByEmpID()`
- Should return technicians based on current user's role (Manager/TechManager/Technician)
- Frontend adds "All" option automatically

---

### 2. Get Tech Tools Kit
**GET** `/TechTools/GetTechToolsKit/{techID}`

Returns technician information and tool kit grid data.

**Parameters:**
- `techID` (path): The technician ID

**Response:**
```json
{
  "technicianInfo": {
    "techID": "string",
    "name": "string",
    "address": "string",
    "phone": "string",
    "techEmail": "string",
    "manager": "string"
  },
  "toolKitItems": [
    {
      "toolKitPNMisc": "string",
      "description": "string",
      "techValue": "string",  // "YS", "NO", or "NA"
      "columnOrder": 0,
      "groupName": "string"
    }
  ]
}
```

**Implementation Notes:**
- Corresponds to C# method: `DisplayTechToolsKit()` which calls `GetTechToolsMiscKit()`
- Returns data from two tables (technician info and tool kit items)
- Tool kit items should be ordered by `columnOrder` and grouped by `groupName`

---

### 3. Get Tech Tools Data
**GET** `/TechTools/GetTechToolsData/{techID}`

Returns all PPE, meters, badges, and misc items data for a technician.

**Parameters:**
- `techID` (path): The technician ID

**Response:**
```json
{
  "techID": "string",
  
  // Badges
  "rapidGate": "string",
  "twic": "string",  // Date in format "M/d/yyyy" or "1/1/1900" for empty
  "mineSafety": "string",
  "cprfaaed": "string",
  "osha10": "string",
  "swac": "string",
  
  // Meters
  "clampMeter": "string",
  "clampMeterDt": "string",
  "multimeter": "string",
  "multimeterDt": "string",
  "torqueWrench": "string",
  "torqueWrenchDt": "string",
  "irGun": "string",
  "irGunDt": "string",
  "midtronics6000": "string",
  "midtronics6000Dt": "string",
  "phSeqTester": "string",
  "phSeqRecvdDt": "string",
  
  // PPE/Clothing
  "arcFlashSuitSize": "string",  // Size: "XS", "S", "M", "L", "2L", "3L", "4L", "5L", "NA"
  "arcFlashSuitDate": "string",
  "arc40FlashSize": "string",
  "arc40FlashDate": "string",
  "gloveSize": "string",  // "1" through "15"
  "gloveRecDate": "string",
  "chFrJacket": "string",  // Size
  "chFrJacketDate": "string",
  "kleinProTechBP": "string",  // "YS", "NO", "NA"
  "cal12IUSoftHood": "string",
  "linemansSleeves": "string",
  "linemannSlStraps": "string",
  "nitrileGloves": "string",
  "hardHatFaceSh": "string",
  "rubberGloves": "string",
  "acidApron": "string",
  "acidFaceShield": "string",
  "acidFSHeadGear": "string",
  "acidSleeves": "string",
  "bagForGloves": "string",
  "bagForFaceSh": "string",
  
  // Misc Items
  "tsaLocks": "string",
  "dcgCarMagnet": "string",
  "chickenWire": "string",
  "potentiometer": "string",
  "dewalt": "string",
  "techToolBox": "string",
  "meterHKit": "string",
  "fluke225": "string",
  "fuseKit": "string",
  "panduitLockout": "string",
  "neikoToolSet": "string",
  "usbCamera": "string",
  "vacuum": "string",
  "lockoutKit": "string",
  "batterySpillKit": "string",
  "heatSinkPaste": "string",
  "gfciCord": "string",
  "miniGrabber2": "string",
  "miniGrabber4": "string",
  "compactFAKit": "string",
  "insMagnTool": "string",
  "mattedFloorMat": "string",
  
  // Notes
  "notes": "string"
}
```

**Implementation Notes:**
- Corresponds to C# method: `DisplayTechToolsPPEMETERS()` which calls `GetTechToolsPPEMeterMisc()`
- Empty dates should be returned as "1/1/1900" or "1/1/0001"
- Frontend will convert these to empty strings for display

---

### 4. Save Tech Tools
**POST** `/TechTools/SaveTechTools`

Saves all tech tools data including PPE, meters, badges, misc items, and tool kit grid data.

**Request Body:**
```json
{
  "techToolsData": {
    // Same structure as GetTechToolsData response
    "techID": "string",
    "rapidGate": "string",
    "twic": "string",
    // ... all other fields
  },
  "toolKitItems": [
    {
      "toolKitPNMisc": "string",
      "description": "string",
      "techValue": "string",
      "columnOrder": 0,
      "groupName": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Update Successful"
}
```

**Implementation Notes:**
- Corresponds to C# methods: `SaveUpdateTechToolsPPEMETERS()` and `DeleteInsertTechToolsMiscData()`
- Should handle both PPE/meters data and tool kit items in a transaction
- Empty date strings from frontend should be converted to "1/1/1900" before saving
- For tool kit items:
  - Delete existing records for the technician
  - Insert all new records
  - Should be wrapped in transaction for data integrity

---

## Field Mapping (C# to TypeScript)

### Data Class Properties (C#) → Angular Component Fields

| C# Property | Angular Field | Type | Notes |
|------------|---------------|------|-------|
| RapidGate | rapidGate | string | "YS", "NO", "NA" |
| TWIC | twic | string | Date field |
| MineSafety | mineSafety | string | Date field |
| CPRFAAED | cprfaaed | string | Date field |
| OSHA10 | osha10 | string | Date field |
| SWAC | swac | string | Date field |
| ArcFlashSuitSize | arcFlashSuitSize | string | Size dropdown |
| ArcFlashSuitDate | arcFlashSuitDate | string | Date field |
| Arc40FlashSize | arc40FlashSize | string | Size dropdown |
| Arc40FlashDate | arc40FlashDate | string | Date field |
| GloveSize | gloveSize | string | "1" to "15" |
| GloveRecDate | gloveRecDate | string | Date field |
| ChFrJacket | chFrJacket | string | Size dropdown |
| ChFrJacketDate | chFrJacketDate | string | Date field |
| KleinProTechBP | kleinProTechBP | string | "YS", "NO", "NA" |
| Cal12IUSoftHood | cal12IUSoftHood | string | "YS", "NO", "NA" |
| LinemansSleeves | linemansSleeves | string | "YS", "NO", "NA" |
| LinemannSlStraps | linemannSlStraps | string | "YS", "NO", "NA" |
| NitrileGloves | nitrileGloves | string | "YS", "NO", "NA" |
| HardHatFaceSh | hardHatFaceSh | string | "YS", "NO", "NA" |
| RubberGloves | rubberGloves | string | "YS", "NO", "NA" |
| AcidApron | acidApron | string | "YS", "NO", "NA" |
| AcidFaceShield | acidFaceShield | string | "YS", "NO", "NA" |
| AcidFSHeadGear | acidFSHeadGear | string | "YS", "NO", "NA" |
| AcidSleeves | acidSleeves | string | "YS", "NO", "NA" |
| BagForGloves | bagForGloves | string | "YS", "NO", "NA" |
| BagForFaceSh | bagForFaceSh | string | "YS", "NO", "NA" |
| ClampMeter | clampMeter | string | Serial number |
| ClampMeterDt | clampMeterDt | string | Date field |
| Multimeter | multimeter | string | Serial number |
| MultimeterDt | multimeterDt | string | Date field |
| TorqueWrench | torqueWrench | string | Serial number |
| TorqueWrenchDt | torqueWrenchDt | string | Date field |
| IRGun | irGun | string | Serial number |
| IRGunDt | irGunDt | string | Date field |
| Midtronics6000 | midtronics6000 | string | Serial number |
| Midtronics6000Dt | midtronics6000Dt | string | Date field |
| PhSeqTester | phSeqTester | string | Serial number |
| PhSeqRecvdDt | phSeqRecvdDt | string | Date field |
| TSALocks | tsaLocks | string | "YS", "NO", "NA" |
| DCGCarMagnet | dcgCarMagnet | string | "YS", "NO", "NA" |
| ChickenWire | chickenWire | string | "YS", "NO", "NA" |
| Potentiometer | potentiometer | string | "YS", "NO", "NA" |
| DEWALT | dewalt | string | "YS", "NO", "NA" |
| TechToolBox | techToolBox | string | "YS", "NO", "NA" |
| MeterHKit | meterHKit | string | "YS", "NO", "NA" |
| Fluke225 | fluke225 | string | "YS", "NO", "NA" |
| FuseKit | fuseKit | string | "YS", "NO", "NA" |
| PanduitLockout | panduitLockout | string | "YS", "NO", "NA" |
| NeikoToolSet | neikoToolSet | string | "YS", "NO", "NA" |
| USBCamera | usbCamera | string | "YS", "NO", "NA" |
| Vacuum | vacuum | string | "YS", "NO", "NA" |
| LockoutKit | lockoutKit | string | "YS", "NO", "NA" |
| BatterySpillKit | batterySpillKit | string | "YS", "NO", "NA" |
| HeatSinkPaste | heatSinkPaste | string | "YS", "NO", "NA" |
| GFCICord | gfciCord | string | "YS", "NO", "NA" |
| MiniGrabber2 | miniGrabber2 | string | "YS", "NO", "NA" |
| MiniGrabber4 | miniGrabber4 | string | "YS", "NO", "NA" |
| CompactFAKit | compactFAKit | string | "YS", "NO", "NA" |
| InsMagnTool | insMagnTool | string | "YS", "NO", "NA" |
| MattedFloorMat | mattedFloorMat | string | "YS", "NO", "NA" |
| Notes | notes | string | Multi-line text |

---

## Database Tables

### Tables Referenced in C# Code:
1. **TechToolsPPEMETERS** - Stores badges, meters, PPE/clothing, and misc items
2. **TechToolsMiscKitPNo** - Stores tool kit items grid data
3. **Employee/Technician tables** - For technician information

### Key Columns:
- `TechID` - Primary key linking to technician
- Date fields - Stored as DateTime, empty dates as '1/1/1900'
- Dropdown values - Stored as "YS", "NO", "NA"
- Size fields - Stored as "XS", "S", "M", "L", "2L", "3L", "4L", "5L", "NA"
- Glove size - Stored as "1" through "15"

---

## Navigation

The Tech Tools page is accessible via:
- **Route:** `/tools/tech-tools`
- **Module:** Lazy-loaded `ToolsModule`
- **Guard:** Protected by `AuthGuard`

Add to navigation menu as "Tools" > "Tech Tools"
