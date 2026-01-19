import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TechToolsService } from '../../../core/services/tech-tools.service';
import { CommonService } from '../../../core/services/common.service';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { TechToolsData, TechnicianInfo, ToolKitItem, Technician } from '../../../core/model/tech-tools.model';

@Component({
  selector: 'app-tech-tools',
  templateUrl: './tech-tools.component.html',
  styleUrls: ['./tech-tools.component.scss']
})
export class TechToolsComponent implements OnInit {
  // Technician selection
  selectedTech: string = 'All';
  technicians: Technician[] = [];

  // Technician details
  techName: string = '';
  techAddress: string = '';
  techPhone: string = '';
  techEmail: string = '';
  techManager: string = '';

  // Visibility flags
  showTechPanel: boolean = false;
  showToolsPanel: boolean = false;

  // Current user identifier (used for modifiedBy)
  currentWindowsID: string = '';
  currentModifiedBy: string = '';

  // Loading state
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Badges section
  rapidGate: string = 'NO';
  twicDueDate: string = '';
  mineSafetyDueDate: string = '';
  cprFaAedDueDate: string = '';
  osha10DueDate: string = '';
  swacDueDate: string = '';

  // Meters and Due Dates
  clampMeter: string = '';
  clampMeterDueDate: string = '';
  multiMeter: string = '';
  multiMeterDueDate: string = '';
  torqueWrench: string = '';
  torqueWrenchDueDate: string = '';
  irGun: string = '';
  irGunDueDate: string = '';
  midtronics6000: string = '';
  midtronics6000DueDate: string = '';
  phaseSeqTester: string = '';
  phaseSeqTesterDueDate: string = '';

  // PPE/Clothing
  arcFlashSuitSize: string = 'NA';
  arcFlashSuitRecDate: string = '';
  arc40FlashSuitSize: string = 'NA';
  arc40FlashSuitRecDate: string = '';
  gloveSizeValue: string = '1';
  gloveSizeRecDate: string = '';
  carharttFrJacket: string = 'NA';
  carharttFrJacketRecDate: string = '';
  kleinProTechBP: string = 'NO';
  cal12IUSoftHood: string = 'NO';
  linemanSleeves: string = 'NO';
  linemanSlStraps: string = 'NO';
  nitrileGloves: string = 'NO';
  hardHatFaceSh: string = 'NO';
  rubberGloves: string = 'NO';
  acidApron: string = 'NO';
  acidFaceShield: string = 'NO';
  acidFaceHdGear: string = 'NO';
  acidSleeves: string = 'NO';
  bagGloves: string = 'NO';
  bagFaceShield: string = 'NO';

  // Misc Items
  tsaLocks: string = 'NO';
  dcgCarMagnet: string = 'NO';
  chickenWire: string = 'NO';
  potentiometer: string = 'NO';
  dewaltKit: string = 'NO';
  techToolBox: string = 'NO';
  meterKit: string = 'NO';
  flukeSet: string = 'NO';
  fuseKit: string = 'NO';
  panduit: string = 'NO';
  neikoTools: string = 'NO';
  usbCamera: string = 'NO';
  vacuum: string = 'NO';
  lockoutKit: string = 'NO';
  batteryKit: string = 'NO';
  heatPaste: string = 'NO';
  gfciCord: string = 'NO';
  miniGrabber: string = 'NO';
  miniGrabber4: string = 'NO';
  firstAidKit: string = 'NO';
  insMagTool: string = 'NO';
  mattedFloor: string = 'NO';
  clearPVC: string = 'NO';
  insMirror: string = 'NO';

  // Notes
  notes: string = '';

  // Grid data
  techToolsGrid: ToolKitItem[] = [];

  // Dropdown options
  rapidGateOptions = [
    { value: 'YS', label: 'Yes' },
    { value: 'NO', label: 'No' },
    { value: 'NA', label: 'N/A' }
  ];

  sizeOptions = [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: '2L', label: '2XL' },
    { value: '3L', label: '3XL' },
    { value: '4L', label: '4XL' },
    { value: '5L', label: '5XL' },
    { value: 'NA', label: 'N/A' }
  ];

  gloveSizeOptions = Array.from({ length: 15 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));

  yesNoNAOptions = [
    { value: 'YS', label: 'Yes' },
    { value: 'NO', label: 'No' },
    { value: 'NA', label: 'N/A' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private techToolsService: TechToolsService,
    private commonService: CommonService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setCurrentUserInfo();
    this.loadTechnicians();
  }

  private setCurrentUserInfo(): void {
    const currentUser = this.authService.currentUserValue;
    // Prefer employee/tech identifier; fall back to username conventions
    this.currentModifiedBy =
      currentUser?.empId ||
      currentUser?.EmpID ||
      currentUser?.id ||
      currentUser?.username ||
      currentUser?.userName ||
      currentUser?.fullname ||
      '';
  }

  loadTechnicians(): void {
    this.errorMessage = '';
    try {
      const userDataRaw = localStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const windowsID = userData?.windowsID || userData?.WindowsID || '';
      this.currentWindowsID = windowsID;

      if (!windowsID) {
        this.errorMessage = 'Unable to determine user Windows ID to load technicians.';
        return;
      }

      this.commonService.getEmployeeStatusForJobList(windowsID).subscribe({
        next: (statusList: any) => {
          // statusList is expected as an array per other pages usage
          if (!statusList || !Array.isArray(statusList) || statusList.length === 0) {
            this.errorMessage = 'No employee status found.';
            return;
          }

          // Iterate through statuses and aggregate technicians
          const aggregatedTechs: Technician[] = [];
          statusList.forEach((row: any) => {
            const empId = row.EmpID || row.empId || '';
            const status = row.Status || row.status || '';
            if (!empId || !status) return;

            this.commonService.getTechNamesByEmpID(empId, status).subscribe({
              next: (techs: any) => {
                // techs expected as array
                if (Array.isArray(techs)) {
                  techs.forEach((t: any) => {
                    aggregatedTechs.push({
                      techID: t.TechID || t.techID || t.techId || '',
                      techname: t.TechName || t.Techname || t.techname || t.techName || ''
                    });
                  });
                }

                // De-duplicate by techID in case multiple statuses return same tech
                const deduped = aggregatedTechs.reduce((acc: Technician[], cur) => {
                  if (!cur.techID || acc.find(t => t.techID === cur.techID)) {
                    return acc;
                  }
                  acc.push(cur);
                  return acc;
                }, []);

                // Apply legacy selection rules per status
                if (status === 'Manager' || status === 'Other') {
                  // Add All and select All
                  this.technicians = [{ techID: 'All', techname: 'All' }, ...deduped];
                  this.selectedTech = 'All';
                } else if (status === 'TechManager') {
                  this.technicians = [{ techID: 'All', techname: 'All' }, ...deduped];
                  this.selectedTech = empId;
                } else {
                  this.technicians = [...deduped];
                  this.selectedTech = empId;
                }
              },
              error: (error) => {
                this.errorMessage = 'Error loading technicians: ' + error.message;
              }
            });
          });
        },
        error: (error) => {
          this.errorMessage = 'Error loading employee status: ' + error.message;
        }
      });
    } catch (err: any) {
      this.errorMessage = 'Error loading technicians: ' + err?.message;
    }
  }

  onTechnicianChange(): void {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.selectedTech && this.selectedTech !== 'All') {
      this.loadTechnicianDetails();
      this.loadTechToolsData();
      this.showTechPanel = true;
      this.showToolsPanel = true;
    } else {
      this.showTechPanel = false;
      this.showToolsPanel = false;
    }
  }

  loadTechnicianDetails(): void {
    this.isLoading = true;
    this.techToolsService.getTechToolsKit(this.selectedTech).subscribe({
      next: (data) => {
        // Set technician info with safe navigation and trimming
        const techInfo = data?.technicianInfo;
        if (techInfo) {
          this.techName = (techInfo.name || '').trim();
          this.techAddress = (techInfo.address || '').trim();
          this.techPhone = (techInfo.phone || '').trim();
          this.techEmail = (techInfo.techEmail || '').trim();
          this.techManager = (techInfo.manager || '').trim();
        }
        
        // Set tool kit grid
        this.techToolsGrid = data?.toolKitItems || [];
        
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading technician details: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  loadTechToolsData(): void {
    this.techToolsService.getTechToolsData(this.selectedTech).subscribe({
      next: (data) => {
        // Badges
        this.rapidGate = (data.rapidGate || 'NO').trim();
        this.twicDueDate = this.formatDate(data.twic);
        this.mineSafetyDueDate = this.formatDate(data.mineSafety);
        this.cprFaAedDueDate = this.formatDate(data.cprfaaed);
        this.osha10DueDate = this.formatDate(data.osha10);
        this.swacDueDate = this.formatDate(data.swac);
        
        // Meters
        this.clampMeter = (data.clampMeter || '').trim();
        this.clampMeterDueDate = this.formatDate(data.clampMeterDt);
        this.multiMeter = (data.multimeter || '').trim();
        this.multiMeterDueDate = this.formatDate(data.multimeterDt);
        this.torqueWrench = (data.torqueWrench || '').trim();
        this.torqueWrenchDueDate = this.formatDate(data.torqueWrenchDt);
        this.irGun = (data.irGun || '').trim();
        this.irGunDueDate = this.formatDate(data.irGunDt);
        this.midtronics6000 = (data.midtronics6000 || '').trim();
        this.midtronics6000DueDate = this.formatDate(data.midtronics6000Dt);
        this.phaseSeqTester = (data.phSeqTester || '').trim();
        this.phaseSeqTesterDueDate = this.formatDate(data.phSeqRecvdDt);
        
        // PPE/Clothing
        this.arcFlashSuitSize = (data.arcFlashSuitSize || 'NA').trim();
        this.arcFlashSuitRecDate = this.formatDate(data.arcFlashSuitDate);
        this.arc40FlashSuitSize = (data.arc40FlashSize || 'NA').trim();
        this.arc40FlashSuitRecDate = this.formatDate(data.arc40FlashDate);
        this.gloveSizeValue = (data.gloveSize || '1').trim();
        this.gloveSizeRecDate = this.formatDate(data.gloveRecDate);
        this.carharttFrJacket = (data.chFrJacket || 'NA').trim();
        this.carharttFrJacketRecDate = this.formatDate(data.chFrJacketDate);
        this.kleinProTechBP = (data.kleinProTechBP || 'NO').trim();
        this.cal12IUSoftHood = (data.cal12IUSoftHood || 'NO').trim();
        this.linemanSleeves = (data.linemansSleeves || 'NO').trim();
        this.linemanSlStraps = (data.linemannSlStraps || 'NO').trim();
        this.nitrileGloves = (data.nitrileGloves || 'NO').trim();
        this.hardHatFaceSh = (data.hardHatFaceSh || 'NO').trim();
        this.rubberGloves = (data.rubberGloves || 'NO').trim();
        this.acidApron = (data.acidApron || 'NO').trim();
        this.acidFaceShield = (data.acidFaceShield || 'NO').trim();
        this.acidFaceHdGear = (data.acidFSHeadGear || 'NO').trim();
        this.acidSleeves = (data.acidSleeves || 'NO').trim();
        this.bagGloves = (data.bagForGloves || 'NO').trim();
        this.bagFaceShield = (data.bagForFaceSh || 'NO').trim();
        
        // Misc Items
        this.tsaLocks = (data.tsaLocks || 'NO').trim();
        this.dcgCarMagnet = (data.dcgCarMagnet || 'NO').trim();
        this.chickenWire = (data.chickenWire || 'NO').trim();
        this.potentiometer = (data.potentiometer || 'NO').trim();
        this.dewaltKit = (data.dewalt || 'NO').trim();
        this.techToolBox = (data.techToolBox || 'NO').trim();
        this.meterKit = (data.meterHKit || 'NO').trim();
        this.flukeSet = (data.fluke225 || 'NO').trim();
        this.fuseKit = (data.fuseKit || 'NO').trim();
        this.panduit = (data.panduitLockout || 'NO').trim();
        this.neikoTools = (data.neikoToolSet || 'NO').trim();
        this.usbCamera = (data.usbCamera || 'NO').trim();
        this.vacuum = (data.vacuum || 'NO').trim();
        this.lockoutKit = (data.lockoutKit || 'NO').trim();
        this.batteryKit = (data.batterySpillKit || 'NO').trim();
        this.heatPaste = (data.heatSinkPaste || 'NO').trim();
        this.gfciCord = (data.gfciCord || 'NO').trim();
        this.miniGrabber = (data.miniGrabber2 || 'NO').trim();
        this.miniGrabber4 = (data.miniGrabber4 || 'NO').trim();
        this.firstAidKit = (data.compactFAKit || 'NO').trim();
        this.insMagTool = (data.insMagnTool || 'NO').trim();
        this.mattedFloor = (data.mattedFloorMat || 'NO').trim();
        this.clearPVC = (data.clearPVC || 'NO').trim();
        this.insMirror = (data.insMirror || 'NO').trim();
        
        // Notes
        this.notes = (data.notes || '').trim();
      },
      error: (error) => {
        this.errorMessage = 'Error loading tech tools data: ' + error.message;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) {
      return '';
    }
    // Handle null date indicators: 1900-01-01, 0001-01-01, and their ISO variants
    if (dateStr.startsWith('1900-01-01') || dateStr.startsWith('0001-01-01')) {
      return '';
    }
    // Convert to yyyy-MM-dd format for date input
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  saveAsDraft(): void {
    this.saveData();
  }

  saveInfo(): void {
    this.saveData();
  }

  private async saveData(): Promise<void> {
    if (!this.selectedTech || this.selectedTech === 'All') {
      this.errorMessage = 'Please select a technician before saving.';
      this.successMessage = '';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const nullDate = '1900-01-01T00:00:00';

    const techToolsData: TechToolsData = {
      techID: this.selectedTech,
      modifiedBy: this.currentModifiedBy,
      
      // Badges
      rapidGate: this.rapidGate,
      twic: this.twicDueDate || nullDate,
      mineSafety: this.mineSafetyDueDate || nullDate,
      cprfaaed: this.cprFaAedDueDate || nullDate,
      osha10: this.osha10DueDate || nullDate,
      swac: this.swacDueDate || nullDate,
      
      // Meters
      clampMeter: this.clampMeter,
      clampMeterDt: this.clampMeterDueDate || nullDate,
      multimeter: this.multiMeter,
      multimeterDt: this.multiMeterDueDate || nullDate,
      torqueWrench: this.torqueWrench,
      torqueWrenchDt: this.torqueWrenchDueDate || nullDate,
      irGun: this.irGun,
      irGunDt: this.irGunDueDate || nullDate,
      midtronics6000: this.midtronics6000,
      midtronics6000Dt: this.midtronics6000DueDate || nullDate,
      phSeqTester: this.phaseSeqTester,
      phSeqRecvdDt: this.phaseSeqTesterDueDate || nullDate,
      
      // PPE/Clothing
      arcFlashSuitSize: this.arcFlashSuitSize,
      arcFlashSuitDate: this.arcFlashSuitRecDate || nullDate,
      arc40FlashSize: this.arc40FlashSuitSize,
      arc40FlashDate: this.arc40FlashSuitRecDate || nullDate,
      gloveSize: this.gloveSizeValue,
      gloveRecDate: this.gloveSizeRecDate || nullDate,
      chFrJacket: this.carharttFrJacket,
      chFrJacketDate: this.carharttFrJacketRecDate || nullDate,
      kleinProTechBP: this.kleinProTechBP,
      cal12IUSoftHood: this.cal12IUSoftHood,
      linemansSleeves: this.linemanSleeves,
      linemannSlStraps: this.linemanSlStraps,
      nitrileGloves: this.nitrileGloves,
      hardHatFaceSh: this.hardHatFaceSh,
      rubberGloves: this.rubberGloves,
      acidApron: this.acidApron,
      acidFaceShield: this.acidFaceShield,
      acidFSHeadGear: this.acidFaceHdGear,
      acidSleeves: this.acidSleeves,
      bagForGloves: this.bagGloves,
      bagForFaceSh: this.bagFaceShield,
      
      // Misc Items
      tsaLocks: this.tsaLocks,
      dcgCarMagnet: this.dcgCarMagnet,
      chickenWire: this.chickenWire,
      potentiometer: this.potentiometer,
      dewalt: this.dewaltKit,
      techToolBox: this.techToolBox,
      meterHKit: this.meterKit,
      fluke225: this.flukeSet,
      fuseKit: this.fuseKit,
      panduitLockout: this.panduit,
      neikoToolSet: this.neikoTools,
      usbCamera: this.usbCamera,
      vacuum: this.vacuum,
      lockoutKit: this.lockoutKit,
      batterySpillKit: this.batteryKit,
      heatSinkPaste: this.heatPaste,
      gfciCord: this.gfciCord,
      miniGrabber2: this.miniGrabber,
      miniGrabber4: this.miniGrabber4,
      compactFAKit: this.firstAidKit,
      insMagnTool: this.insMagTool,
      mattedFloorMat: this.mattedFloor,
      clearPVC: this.clearPVC,
      insMirror: this.insMirror,
      
      // Notes
      notes: this.notes
    };

    try {
      await firstValueFrom(this.techToolsService.getTechToolsMiscCount(this.selectedTech));
      await firstValueFrom(this.techToolsService.deleteReplaceToolsMisc(this.selectedTech, this.techToolsGrid, this.currentModifiedBy));
      await firstValueFrom(this.techToolsService.saveUpdateTechTools(techToolsData));
      this.successMessage = 'Update Successful';
    } catch (error: any) {
      this.errorMessage = 'Error saving data: ' + (error?.message || error);
    } finally {
      this.isSaving = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
