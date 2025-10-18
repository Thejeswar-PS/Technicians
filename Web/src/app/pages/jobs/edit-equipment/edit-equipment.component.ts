import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-edit-equipment',
  templateUrl: './edit-equipment.component.html',
  styleUrls: ['./edit-equipment.component.scss']
})
export class EditEquipmentComponent implements OnInit {
  editForm!: FormGroup;
  loading = false;
  saving = false;
  callNbr = '';
  equipId!: number;
  equipNo = ''; 
  // Simple board data array (15 rows)
  boardData: any[] = [];

  // Dropdown options (EXACTLY from legacy)
  statusOptions = [
    'On-Line',
    'Critical Deficiency',
    'Replacement Recommended',
    'Proactive Replacement',
    'On-Line(Major Deficiency)',
    'On-Line(Minor Deficiency)',
    'Off-Line'
  ];

  equipTypeOptions = [
    'SELECT',
    'ATS',
    'BATTERY',
    'FLYWHEEL',
    'GENERATOR',
    'INVERTER',
    'HVAC',
    'PDU',
    'RECTIFIER',
    'REMOTE STATUS PANEL',
    'SCC',
    'STATIC SWITCH',
    'SYSTEM CONTROL CABINET',
    'UPS'
  ];

  floatVoltageOptions = [
    'Please Select',
    'Offline',
    'Online',
    'Battery Packs'
  ];

  readingTypeOptions = ['Multimeter', 'Midtronics / Fluke', 'Battery Packs'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private equipmentService: EquipmentService
  ) {}

  ngOnInit(): void {
    this.callNbr = this.route.snapshot.queryParamMap.get('CallNbr') || '';
    this.equipId = Number(this.route.snapshot.queryParamMap.get('EquipId'));

    // Initialize UI instantly
    this.initializeBoardData();
    this.initForm();
    
    // Page is ready - no loading spinner needed initially
    this.loading = false;

    // Load data after UI is rendered (fast loading)
    setTimeout(() => {
      this.loadEquipmentData();
    }, 10); // Very small delay to let UI render
  }

  /** Initialize board data with 15 empty rows */
  initializeBoardData(): void {
    this.boardData = [];
    for (let i = 0; i < 15; i++) {
      this.boardData.push({
        id: i + 1,
        partNo: '',
        qty: 0,
        description: '',
        comments: ''
      });
    }
    console.log('Initialized 15 board data rows:', this.boardData.length);
  }

  /** Populate board data from backend while maintaining 15 rows */
  populateBoardData(boards: any[]): void {
    // Reset to 15 empty rows first
    this.initializeBoardData();
    
    // Populate with received data (up to 15 rows)
    for (let i = 0; i < Math.min(boards.length, 15); i++) {
      if (boards[i]) {
        this.boardData[i] = {
          id: i + 1,
          partNo: boards[i].partNo || '',
          qty: boards[i].qty || 0,
          description: boards[i].description || '',
          comments: boards[i].comments || ''
        };
      }
    }
    console.log('Populated board data with', boards.length, 'items, maintaining 15 rows');
  }



  /** Initialize reactive form */
  initForm(): void {
    this.editForm = this.fb.group({
      jobNumber: [{ value: this.callNbr, disabled: true }],
      equipmentNo: [''],
      serialNo: [''],
      location: [''],
      dateCodeMonth: [''],
      dateCodeYear: [''],
      status: [''],
      equipmentType: [''],
      floatVoltageSelection: [''],
      batteryPacks: [''],
      batteriesPerString: [''],
      readingType: [''],
      upsKva: [''],
      vendorId: [''],
      version: [''],
      tag: [''],
      contract: [''],
      taskDescription: [''],
      // Caps & Parts
      dccapsPartNo: [''],
      dccapsQty: [''],
      dccapsMonth: [''],
      dccapsYear: [''],
      acipcapsPartNo: [''],
      acipcapsQty: [''],
      acipcapsMonth: [''],
      acipcapsYear: [''],
      acopyWyePartNo: [''],
      acopyWyeQty: [''],
      acopyWyeMonth: [''],
      acopyWyeYear: [''],
      acopDeltaPartNo: [''],
      acopDeltaQty: [''],
      acopDeltaMonth: [''],
      acopDeltaYear: [''],
      fansPartNo: [''],
      fansQty: [''],
      fansMonth: [''],
      fansYear: [''],
      blowersPartNo: [''],
      blowersQty: [''],
      blowersMonth: [''],
      blowersYear: [''],
      miscPartNo: [''],
      miscQty: [''],
      miscMonth: [''],
      miscYear: [''],
      capsComments: ['']
    });
  }

  /** Load equipment and board info from backend */
  loadEquipmentData(): void {
    // Don't show loading spinner since form is already visible
    console.log('Loading equipment data...');

    this.equipmentService.editEquipInfo(this.callNbr, this.equipId)
      .pipe(timeout(10000)) // 10 second timeout
      .subscribe({
      next: (res: any) => {
        // Store equipNo for board data API call (trim whitespace)
        this.equipNo = res.equipNo ? res.equipNo.trim() : '';
        
        // Populate form
        this.editForm.patchValue({
          jobNumber: res.callNbr,
          equipmentNo: res.equipNo,
          serialNo: res.serialNo,
          location: res.location,
          dateCodeMonth: res.dateCodeMonth,
          dateCodeYear: res.dateCodeYear,
          status: res.status,
          equipmentType: res.equipType,
          floatVoltageSelection: res.floatVoltageSelection,
          batteryPacks: res.packNo,
          batteriesPerString: res.battNo,
          readingType: res.readingType,
          upsKva: res.upsKva,
          vendorId: res.vendorId,
          version: res.version,
          tag: res.tag,
          contract: res.contract,
          taskDescription: res.taskDescription,
          dccapsPartNo: res.dcCapsPartNo,
          dccapsQty: res.dcCapsQty,
          dccapsMonth: res.dcCapsMonth,
          dccapsYear: res.dcCapsYear,
          acipcapsPartNo: res.acipCapsPartNo,
          acipcapsQty: res.acipCapsQty,
          acipcapsMonth: res.acipCapsMonth,
          acipcapsYear: res.acipCapsYear,
          acopyWyePartNo: res.acopWyeCapsPartNo,
          acopyWyeQty: res.acopWyeCapsQty,
          acopyWyeMonth: res.acopWyeCapsMonth,
          acopyWyeYear: res.acopWyeCapsYear,
          acopDeltaPartNo: res.acopDeltaCapsPartNo,
          acopDeltaQty: res.acopDeltaCapsQty,
          acopDeltaMonth: res.acopDeltaCapsMonth,
          acopDeltaYear: res.acopDeltaCapsYear,
          fansPartNo: res.fansPartNo,
          fansQty: res.fansQty,
          fansMonth: res.fansMonth,
          fansYear: res.fansYear,
          blowersPartNo: res.blowersPartNo,
          blowersQty: res.blowersQty,
          blowersMonth: res.blowersMonth,
          blowersYear: res.blowersYear,
          miscPartNo: res.miscPartNo,
          miscQty: res.miscQty,
          miscMonth: res.miscMonth,
          miscYear: res.miscYear,
          capsComments: res.capsComments
        });

        // Equipment data loaded and form populated
        console.log('Equipment data loaded successfully');
        
        // Load board data after main form loads (but don't block UI)
        this.loadBoardData();
      },
      error: () => {
        // Form is already visible with empty values
        console.error('Failed to load equipment data');
        this.toastr.error('Failed to load equipment data.');
      }
    });
  }

  /** Load board data from API (non-blocking) */
  private loadBoardData(): void {
    if (!this.equipNo) {
      console.log('No equipNo available for board data loading');
      return;
    }

    console.log('Loading board data for equipNo:', this.equipNo);
    
    this.equipmentService.getEquipBoardInfo(this.callNbr, this.equipNo)
      .pipe(timeout(5000)) // 5 second timeout for board data
      .subscribe({
      next: (boards) => {
        if (boards && boards.length > 0) {
          console.log('Loaded board data:', boards);
          this.populateBoardData(boards);
        } else {
          console.log('No existing board data found, keeping empty numbered rows');
        }
      },
      error: (error) => {
        console.log('Board data loading failed (keeping empty rows):', error);
        // Keep the 15 numbered rows - no error message needed
      }
    });
  }

  /** Save the full equipment form including board data */
  onSave(): void {
    if (this.editForm.invalid) {
      this.toastr.warning('Please fill required fields.');
      return;
    }

    this.saving = true;
    
    // Get board data with row IDs (only non-empty rows)
    const boardDataToSave = this.boardData
      .filter(board => board.partNo || board.qty || board.description || board.comments)
      .map((board, index) => ({
        partNo: board.partNo,
        qty: board.qty,
        description: board.description,
        comments: board.comments,
        rowID: board.id
      }));

    const payload = {
      ...this.editForm.getRawValue(),
      callNbr: this.callNbr,
      equipId: this.equipId,
      boardData: boardDataToSave
    };

    this.equipmentService.saveEquipment(payload).subscribe({
      next: () => {
        this.toastr.success('Equipment saved successfully.');
        this.saving = false;
      },
      error: () => {
        this.toastr.error('Save failed.');
        this.saving = false;
      }
    });
  }

  /** Back navigation */
  goBack(): void {
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: { CallNbr: this.callNbr }
    });
  }
}
