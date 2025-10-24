# Edit Parts Component - Enhancement Requirements

## Overview
Based on analysis of legacy EditDTechJobParts.aspx and .aspx.cs files, the following enhancements are needed to match the legacy functionality.

## ❌ Missing Features to Implement

### 1. **Inventory Check Feature (Display=1 Only)**

**Legacy Behavior**:
- "Check In Inventory" button next to DCG Part Number field
- Calls `IsPartExistsInInventory(dcPartNum)` API
- Shows green checkmark ✅ if exists, red X ❌ if not
- Auto-populates Description field from inventory when found
- Also triggers on DCG Part Number text change (blur event)

**Implementation Needed**:
```typescript
// Add to edit-parts.component.ts
isCheckingInventory: boolean = false;
inventoryCheckResult: 'success' | 'error' | null = null;

onCheckInventory(): void {
  if (!this.editForm.get('dcPartNum')?.value) {
    this.toastr.error('Please enter DCG Part Number');
    return;
  }

  this.isCheckingInventory = true;
  this.jobPartsService.checkInventoryItem(this.editForm.get('dcPartNum')?.value).subscribe({
    next: (result) => {
      if (result.exists) {
        this.inventoryCheckResult = 'success';
        this.editForm.patchValue({
          description: result.description
        });
        this.toastr.success('Item found in inventory');
      } else {
        this.inventoryCheckResult = 'error';
        this.toastr.error('DCGroup Part Number does not exist in Inventory');
      }
      this.isCheckingInventory = false;
    },
    error: (error) => {
      this.inventoryCheckResult = 'error';
      this.isCheckingInventory = false;
      this.toastr.error('Error checking inventory');
    }
  });
}

onDCPartNumChange(): void {
  // Auto-check inventory when DCG Part Number changes
  this.inventoryCheckResult = null;
  if (this.editForm.get('dcPartNum')?.value) {
    this.onCheckInventory();
  }
}
```

**HTML Addition**:
```html
<!-- For Display=1 only -->
<div class="row mb-5" *ngIf="displayMode === 1">
  <div class="col-md-6">
    <label class="form-label fw-bold">DC Part Number</label>
    <div class="input-group">
      <input type="text" class="form-control" formControlName="dcPartNum" 
             (blur)="onDCPartNumChange()" maxlength="50">
      <button type="button" class="btn btn-outline-primary" 
              (click)="onCheckInventory()" 
              [disabled]="isCheckingInventory">
        <span *ngIf="!isCheckingInventory">Check Inventory</span>
        <span *ngIf="isCheckingInventory">
          <span class="spinner-border spinner-border-sm"></span>
        </span>
      </button>
    </div>
    <div *ngIf="inventoryCheckResult === 'success'" class="text-success mt-1">
      <i class="bi bi-check-circle"></i> Item exists in inventory
    </div>
    <div *ngIf="inventoryCheckResult === 'error'" class="text-danger mt-1">
      <i class="bi bi-x-circle"></i> Item not found
    </div>
  </div>
</div>
```

**API Method Needed**:
```typescript
// Add to job-parts.service.ts
checkInventoryItem(dcPartNum: string): Observable<{exists: boolean, description: string}> {
  return this.http.post<any>(`${this.API}/JobParts/CheckInventoryItem`, { dcPartNum });
}
```

---

### 2. **Duplicate Part Request Check (Display=1)**

**Legacy Behavior**:
```csharp
int PartExist = CheckIfPartReqExist(); // Check if part already requested
if (PartExist > 0 && Source != "Pen") {
    lblErrMsg.Text = "Error : Please make sure job status is equal to Initiated.";
}
```

**Implementation Needed**:
```typescript
// Add validation before save for Display=1
if (this.displayMode === 1 && this.mode === 'add') {
  this.jobPartsService.checkPartRequestExists(this.callNbr, dcPartNum).subscribe({
    next: (exists) => {
      if (exists) {
        this.toastr.error('This part has already been requested for this job');
        return;
      }
      // Continue with save
      this.savePartsRequest(formData);
    }
  });
}
```

---

### 3. **Cascading Inserts**

#### **3A. Parts Request → Shipping (Display=1)**

**Legacy Logic** (UpdatePartsData):
```csharp
// After saving Parts Request, if Source != "Pen" (i.e., new request)
// Automatically create a Shipping record with same data
Ship.Service_Call_ID = CallNbr;
Ship.Part_Num = txtPartNo.Text;
Ship.DC_Part_Num = Req.DC_Part_Num;
Ship.Description = txtDesc.Text;
Ship.Destination = txtDest.Text;
Ship.Ship_Date = DateTime.Today;
Ship.Qty = Qty;
Ship.Shipment_Type = Req.Shipping_Method;
Ship.ETA = Req.ReqDate;
Ship.BackOrder = Req.BackOrder;
// ... with defaults for tracking, costs, etc.
da.SaveUpdatePartShipping(Ship, ref ErrMsg);
```

**Backend API Must Handle**: The POST to SavePartsRequest should automatically create Shipping record

#### **3B. Shipping → Tech Parts (Display=2)**

**Legacy Logic** (UpdateShippingPartsData):
```csharp
// After saving Shipping info
// Automatically create Tech Parts record with defaults
PT.Service_Call_ID = CallNbr;
PT.Part_Num = Ship.Part_Num;
PT.DC_Part_Num = Ship.DC_Part_Num;
PT.Description = Ship.Description;
PT.TotalQty = Ship.Qty;
PT.InstalledParts = 0;
PT.UnusedParts = 0;
PT.FaultyParts = 0;
PT.Unused_Desc = "None";
PT.Faulty_Desc = "None";
PT.Manufacturer = "Other";
PT.IsReceived = "No";
PT.TrackingInfo = "";
PT.IsPartsLeft = false;
da.SaveUpdatePartTech(PT, ref ErrMsg, "Ship");
```

**Backend API Must Handle**: The POST to SaveShippingPart should automatically create Tech Parts record

---

### 4. **Enhanced Validation for Tech Parts (Display=3)**

#### **4A. Quantity Validations**
```typescript
validateTechPart(data: any): boolean {
  const total = parseInt(data.totalQty) || 0;
  const installed = parseInt(data.installedParts) || 0;
  const unused = parseInt(data.unusedParts) || 0;
  const faulty = parseInt(data.faultyParts) || 0;
  const isBrandNew = data.isBrandNew;

  // Rule 1: Total = Installed + Unused
  if (total !== (installed + unused)) {
    this.toastr.error('Total Quantity must equal Installed + Unused Quantity');
    return false;
  }

  // Rule 2: Total = Faulty + Unused (unless brand new)
  if (!isBrandNew && total !== (faulty + unused)) {
    this.toastr.error('Total Quantity must equal Faulty + Unused Quantity');
    return false;
  }

  // Rule 3: Received validation
  const isReceived = data.isReceived;
  const faultyDesc = data.faultyDesc;
  const unusedDesc = data.unusedDesc;

  if (isReceived === 'Yes') {
    if (faultyDesc !== 'Sent back to DCG' && unusedDesc !== 'Sent back to DCG') {
      this.toastr.error('You cannot mark as received when part info is not set to "Sent back to DCG"');
      return false;
    }
  }

  // Rule 4: Tracking info requirement
  const trackingInfo = data.trackingInfo;
  const partsLeft = data.partsLeft;

  if ((faultyDesc === 'Sent back to DCG' || unusedDesc === 'Sent back to DCG')) {
    if (!trackingInfo && !partsLeft) {
      this.toastr.error('Please enter Tracking Info or check "Parts left at site"');
      return false;
    }
  }

  return true;
}
```

#### **4B. Parts Info Validation**
```typescript
// ValidatePartsInfo logic
if (faulty > 0 && faultyDesc === 'None') {
  this.toastr.error('Faulty Parts info cannot be set to None. Please select appropriate value');
  return false;
}

if (unused > 0 && unusedDesc === 'None') {
  this.toastr.error('Unused Parts info cannot be set to None. Please select appropriate value');
  return false;
}

// Auto-set to None if quantities are 0
if (faulty === 0) {
  this.editForm.patchValue({ faultyDesc: 'None' });
}
if (unused === 0) {
  this.editForm.patchValue({ unusedDesc: 'None' });
}
```

---

### 5. **Brand New Checkbox Logic (Display=3)**

**Legacy JavaScript**:
```javascript
function CheckBoxClick(chk) {
    var ddlFaulty = document.getElementById('ddlFaulty');
    if (chk.checked) {
        ddlFaulty.value = "None";
        ddlFaulty.disabled = true;  // Disable faulty dropdown
    } else {
        ddlFaulty.disabled = false;
    }
}
```

**Implementation**:
```typescript
// Add to edit-parts.component.ts
ngOnInit() {
  // ... existing code
  
  // Watch for brand new checkbox changes
  this.editForm.get('isBrandNew')?.valueChanges.subscribe(isBrandNew => {
    if (isBrandNew) {
      this.editForm.patchValue({ faultyDesc: 'None' });
      this.editForm.get('faultyDesc')?.disable();
    } else {
      this.editForm.get('faultyDesc')?.enable();
    }
  });
}
```

---

### 6. **Auto-Calculate Faulty Quantity (Display=3)**

**Legacy JavaScript**:
```javascript
function FaultyQuantity() {
    var Faultyqty = document.getElementById('txtFaulty');
    var TotalQty = document.getElementById('txtTechQty');
    var Unusedqty = document.getElementById('txtUnused');
    var Installedqty = document.getElementById('txtInstalled');

    Unusedqty.value = (TotalQty.value - Installedqty.value);
    Faultyqty.value = Installedqty.value;
}
```

**Implementation**:
```typescript
// Add to edit-parts.component.ts for Display=3
setupTechPartsCalculations(): void {
  // Watch for changes to installed parts or total qty
  this.editForm.get('installedParts')?.valueChanges.subscribe(() => {
    this.calculateTechPartQuantities();
  });
  
  this.editForm.get('totalQty')?.valueChanges.subscribe(() => {
    this.calculateTechPartQuantities();
  });
}

calculateTechPartQuantities(): void {
  const totalQty = parseInt(this.editForm.get('totalQty')?.value) || 0;
  const installedQty = parseInt(this.editForm.get('installedParts')?.value) || 0;
  
  const unusedQty = totalQty - installedQty;
  const faultyQty = installedQty; // Per legacy logic
  
  this.editForm.patchValue({
    unusedParts: unusedQty >= 0 ? unusedQty : 0,
    faultyParts: faultyQty >= 0 ? faultyQty : 0
  }, { emitEvent: false });
}
```

---

### 7. **Disable Quantity Field on Edit**

**Legacy Behavior**:
```csharp
txtQuantity.Enabled = false;  // Display=1
txtShipQuantity.Enabled = false;  // Display=2
txtTechQty.Enabled = false;  // Display=3
```

**Implementation**:
```typescript
if (this.mode === 'edit') {
  this.editForm.get('qty')?.disable();  // For Display=1
  this.editForm.get('totalQty')?.disable();  // For Display=3
}
```

---

### 8. **"Add Another" Button Behavior**

**Legacy Behavior**:
- Shows "Add Another" button after successful save (only for new records, not edit)
- When clicked, clears form fields but stays on same page
- Allows adding multiple parts without navigating back

**Implementation**:
```typescript
showAddAnother: boolean = false;

savePartsRequest(data: PartsRequest): void {
  this.jobPartsService.savePartsRequest(data).subscribe({
    next: () => {
      this.toastr.success('Parts request saved successfully');
      if (this.mode === 'add') {
        this.showAddAnother = true;
      } else {
        this.goBack();
      }
    }
  });
}

onAddAnother(): void {
  this.editForm.reset();
  this.inventoryCheckResult = null;
  this.showAddAnother = false;
}
```

---

### 9. **Last Modified Tracking (Display=3)**

**Legacy Displays**:
- Last Modified By: Shows username in title case
- Last Modified On: Shows datetime

**Already in Model**: ✅ Included in TechPart interface

---

### 10. **Delete Functionality**

**Legacy Logic**:
```csharp
da.DeleteParts(CallNbr, SCID_Inc, Display, ref ErrMsg);
// Display parameter determines which table to delete from
```

**Implementation**:
```typescript
onDelete(): void {
  if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
    return;
  }

  this.jobPartsService.deletePart(this.callNbr, this.scidInc!, this.displayMode).subscribe({
    next: () => {
      this.toastr.success('Part deleted successfully');
      this.goBack();
    },
    error: (error) => {
      this.toastr.error('Failed to delete part');
    }
  });
}
```

---

## 📋 **Backend API Requirements**

### New API Endpoints Needed:

1. **POST /api/JobParts/CheckInventoryItem**
   - Input: `{ dcPartNum: string }`
   - Output: `{ exists: boolean, description: string }`

2. **POST /api/JobParts/CheckPartRequestExists**
   - Input: `{ callNbr: string, dcPartNum: string }`
   - Output: `{ exists: boolean }`

3. **POST /api/JobParts/DeletePart**
   - Input: `{ callNbr: string, scidInc: number, display: number }`
   - Output: `{ success: boolean, message: string }`

### Enhanced Save Endpoints:

4. **POST /api/JobParts/SavePartsRequest** (Enhanced)
   - Must create cascading Shipping record if new request
   - Return both records in response

5. **POST /api/JobParts/SaveShippingPart** (Enhanced)
   - Must create cascading Tech Parts record with defaults
   - Return both records in response

---

## 🎯 **Priority Implementation Order**

### HIGH PRIORITY (Critical for Functionality):
1. ✅ Quantity validation (Total = Installed + Unused)
2. ✅ Inventory check feature with auto-populate description
3. ✅ Brand new checkbox disables faulty dropdown
4. ✅ Disable quantity field on edit mode
5. ✅ Delete functionality

### MEDIUM PRIORITY (Important Business Rules):
6. ✅ Duplicate part request check
7. ✅ Received validation (requires "Sent back to DCG")
8. ✅ Tracking info requirement
9. ✅ Auto-calculate quantities
10. ✅ Parts info validation (None check)

### LOW PRIORITY (Nice to Have):
11. ✅ "Add Another" button
12. ✅ Date validation (ETA > Ship Date)
13. ✅ Backend cascading inserts (can be done later)

---

## ✅ **What's Already Correctly Implemented**

1. ✅ Three display modes with proper form generation
2. ✅ Query parameter handling
3. ✅ Basic field validation
4. ✅ Add/Edit mode detection
5. ✅ Character restriction validation (', ; ,)
6. ✅ Numeric validation for quantities and costs
7. ✅ Required field validation
8. ✅ Form structure matches legacy
9. ✅ Navigation back to parts page
10. ✅ Error message display

---

## 📝 **Summary**

The current Angular implementation provides a solid foundation with ~80% of the legacy functionality. The main gaps are:

- **Inventory integration** (check item exists, auto-populate description)
- **Enhanced validations** (quantity calculations, received logic, tracking requirements)
- **Interactive behaviors** (brand new checkbox, auto-calculations)
- **Cascading inserts** (backend responsibility)
- **Delete functionality**

All of these are feasible enhancements that can be added incrementally without disrupting the existing implementation.
