import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BatteryReadingsService } from '../../../core/services/battery-readings.service';
import {
  BatteryStringInfo,
  EquipReconciliationInfo,
  BatteryReadingRow,
  BatteryData,
  UpdateEquipStatus,
  BatteryStatusResult,
} from '../../../core/model/battery-readings.model';

@Component({
  selector: 'app-battery-readings',
  templateUrl: './battery-readings.component.html',
  styleUrls: ['./battery-readings.component.scss'],
})
export class BatteryReadingsComponent implements OnInit {
  // Route Parameters
  callNbr: string = '';
  equipId: number = 0;
  batStrId: string = '';
  techId: string = '';
  techName: string = '';
  readingType: string = '';
  battNum: string = '';
  battPack: string = '';

  // Form Groups
  batteryStringForm: FormGroup;
  reconciliationForm: FormGroup;
  batteryGridForm: FormGroup;

  // Data Models
  batteryStringInfo: BatteryStringInfo | null = null;
  reconciliationInfo: EquipReconciliationInfo | null = null;
  batteryReadings: BatteryReadingRow[] = [];
  // UI State
  loading: boolean = false;
  saving: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  batteryAge: number = 0;

  // Collapsible Section States
  showEquipmentInfo: boolean = true;
  showReconciliation: boolean = true;
  showChargingVerification: boolean = true;
  showMultimeterReadings: boolean = true;
  showBatteryReadingsGrid: boolean = true;

  // Battery Type State
  isBatteryTypeLithium: boolean = false;

  // Dynamic Labels for String Type
  batteriesNoLabel: string = 'No of Batteries per string';
  showPackNoField: boolean = false;
  packNoLabel: string = 'Batteries per String';

  // Grid Row Counts
  totalReplace: number = 0;
  totalMonitor: number = 0;

  // Reference Data
  manufacturers: any[] = [];
  batteryHousings: any[] = [];
  batteryMakeModels: any[] = [];
  batteryTypes: any[] = [];
  statuses: any[] = [];

  @ViewChild('errMsg') errMsgElement!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private batteryService: BatteryReadingsService,
    private toastr: ToastrService
  ) {
    this.batteryStringForm = this.createBatteryStringForm();
    this.reconciliationForm = this.createReconciliationForm();
    this.batteryGridForm = this.createBatteryGridForm();
  }

  ngOnInit(): void {
    this.initializeFromRoute();
    this.loadInitialData();
  }

  /**
   * Initialize component from route parameters
   */
  private initializeFromRoute(): void {
    this.route.queryParams.subscribe((params) => {
      this.callNbr = params['CallNbr'] || '';
      this.equipId = parseInt(params['EquipId']) || 0;
      this.batStrId = decodeURIComponent(params['EquipNo'] || '');
      this.techId = params['Tech'] || '';
      this.techName = params['TechName'] || '';
      this.readingType = params['ReadingType'] || '';
      this.battNum = params['BattNum'] || '40';
      this.battPack = params['BattPack'] || '';

      console.log('🔵 [INIT] URL Params captured - BattNum:', this.battNum, '| BattPack:', this.battPack);

      if (!this.battNum || this.battNum === '' || this.battNum === '0') {
        this.battNum = '40';
      }
      
      console.log('🔵 [INIT] After validation - BattNum:', this.battNum, '| BattPack:', this.battPack);
    });
  }

  /**
   * Load initial data - manufacturers, dropdowns, battery info
   */
  private loadInitialData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.batteryService.getManufacturerNames().subscribe(
      (manufacturers) => {
        this.manufacturers = manufacturers;
        this.loadBatteryStringInfo();
      },
      (error) => {
        this.handleError('Error loading manufacturers: ' + error.message);
        this.loading = false;
      }
    );
  }

  /**
   * Load battery string information from service
   */
  private loadBatteryStringInfo(): void {
    this.batteryService
      .getBatteryStringReadingsInfo(this.callNbr, this.equipId, this.batStrId)
      .subscribe(
        (data) => {
          this.batteryStringInfo = data;
          this.populateBatteryStringForm(data);
          this.enableDisableLithium();
          this.loadReconciliationInfo();
          this.loadBatteryGridData();
        },
        (error) => {
          this.handleError('Error loading battery string info: ' + error.message);
          this.loading = false;
        }
      );
  }

  /**
   * Load reconciliation information
   */
  private loadReconciliationInfo(): void {
    this.batteryService.getEquipReconciliationInfo(this.callNbr, this.equipId).subscribe(
      (data) => {
        this.reconciliationInfo = data;
        this.populateReconciliationForm(data);
      },
      (error) => {
        console.warn('Warning loading reconciliation info:', error);
      }
    );
  }

  /**
   * Load battery grid data
   */
  private loadBatteryGridData(updateReconciliation: boolean = false): void {
    this.batteryService
      .getBatteryInfo(this.callNbr, this.equipId, this.batStrId)
      .subscribe(
        (data) => {
          this.batteryReadings = this.mapBatteryDataToRows(data);
          
          // Only update batteriesNo with actual count if NOT from URL parameters
          // URL parameters take precedence (legacy: txtBatteriesNo.Text from QueryString)
          const currentBatteriesNo = this.batteryStringForm.get('batteriesNo')?.value;
          const stringType = this.batteryStringForm.get('stringType')?.value;
          
          console.log('🔍 loadBatteryGridData - Checking URL param precedence:');
          console.log('  stringType:', stringType, '(type:', typeof stringType, ')');
          console.log('  currentBatteriesNo:', currentBatteriesNo);
          console.log('  this.battNum:', this.battNum, '| this.battPack:', this.battPack);
          console.log('  data.length (DB count):', data.length);
          
          // Determine if batteriesNo value is from URL param based on string type
          // Type 1: batteriesNo comes from BattNum
          // Type 2/3: batteriesNo comes from BattPack
          let isFromUrlParam = false;
          if (stringType === '1') {
            isFromUrlParam = !!(this.battNum && this.battNum !== '40');
          } else if (stringType === '2' || stringType === '3') {
            isFromUrlParam = !!this.battPack;
          }
          
          console.log('  isFromUrlParam:', isFromUrlParam);
          console.log('  Will overwrite?', (!isFromUrlParam || !currentBatteriesNo));
          
          if (!isFromUrlParam || !currentBatteriesNo) {
            console.log('  ❌ OVERWRITING batteriesNo with DB count:', data.length);
            this.batteryStringForm.patchValue({
              batteriesNo: data.length
            });
          } else {
            console.log('  ✅ PRESERVING batteriesNo from URL param:', currentBatteriesNo);
          }
          
          // Update reconciliation battPerString only after Change button (not initial load)
          // Legacy: txtBPerString.Text = BattNum (calculated based on stringType)
          if (updateReconciliation) {
            const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
            const packNo = parseInt(this.batteryStringForm.get('packNo')?.value) || 0;
            
            let battPerStringValue = 0;
            if (stringType === '3') {
              // Type 3: Use batteriesNo (No of Battery Packs)
              battPerStringValue = batteriesNo;
            } else if (stringType === '2') {
              battPerStringValue = packNo * batteriesNo;
            } else {
              battPerStringValue = batteriesNo;
            }
            
            console.log('📊 Updating reconciliation battPerString:', battPerStringValue, '(Type:', stringType, ')');
            this.reconciliationForm.patchValue({
              battPerString: battPerStringValue
            });
          }
          
          this.loading = false;
        },
        (error) => {
          this.handleError('Error loading battery grid data: ' + error.message);
          this.loading = false;
        }
      );
  }

  /**
   * Map battery data to grid rows
   */
  private mapBatteryDataToRows(data: BatteryData[]): BatteryReadingRow[] {
    console.log('Mapping battery data from API:', data);
    return data.map((item, index) => {
      // API GET returns 'mhos', API POST expects 'milliohms'
      const mhosValue = item.milliohms || item.mhos || 0;
      const mappedRow = {
        batteryId: typeof item.batteryId === 'string' ? parseInt(item.batteryId) : (item.batteryId || index + 1),
        vdc: typeof item.vdc === 'string' ? parseFloat(item.vdc) : (item.vdc || 0),
        vac: typeof item.vac === 'string' ? parseFloat(item.vac) : (item.vac || 0),
        mhos: typeof mhosValue === 'string' ? parseFloat(mhosValue) : mhosValue,
        strap1: typeof item.strap1 === 'string' ? parseFloat(item.strap1) : (item.strap1 || 0),
        strap2: typeof item.strap2 === 'string' ? parseFloat(item.strap2) : (item.strap2 || 0),
        spGravity: typeof item.spGravity === 'string' ? parseFloat(item.spGravity) : (item.spGravity || 0),
        cracks: item.cracks || 'N',
        replacementNeeded: item.replacementNeeded || 'N',
        monitoringBattery: item.monitoringBattery || 'N',
        actionPlan: item.actionPlan || '',
        temp: typeof item.temp === 'string' ? parseInt(item.temp) : (item.temp || 70),
      };
      console.log(`Battery ${mappedRow.batteryId} - Mapping: API mhos=${item.mhos}, API milliohms=${item.milliohms}, final mhos=${mappedRow.mhos}`);
      return mappedRow;
    });
  }

  /**
   * DisplayBatteryInfo - Legacy equivalent
   * Adjusts battery grid rows based on battery count
   * 
   * Legacy calculation logic:
   * - Type 1 (External): BattNum = txtBatteriesNo.Text
   * - Type 2 (Internal): BattNum = txtPackNo.Text * txtBatteriesNo.Text
   * - Type 3 (Packs): BattNum = txtPackNo.Text
   * 
   * Important: Uses DISPLAY values (form field values) directly, not API values
   */
  private displayBatteryInfo(): void {
    try {
      // Step 1: Calculate expected battery count (legacy: BattNum calculation)
      const stringType = this.batteryStringForm.get('stringType')?.value;
      const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
      const packNo = parseInt(this.batteryStringForm.get('packNo')?.value) || 0;
      
      console.log('🔢 displayBatteryInfo - Row Calculation:');
      console.log('   String Type:', stringType);
      console.log('   Display batteriesNo:', batteriesNo);
      console.log('   Display packNo:', packNo);
      
      let expectedBatteryCount = 0;
      if (stringType === '3') {
        // Battery Packs / Trays: Use batteriesNo (No of Battery Packs)
        expectedBatteryCount = batteriesNo;
        console.log('   Type 3 calculation: batteriesNo (No of Battery Packs) =', expectedBatteryCount);
      } else if (stringType === '2') {
        // Internal Single / Parallel Strings: packNo * batteriesNo
        expectedBatteryCount = packNo * batteriesNo;
        console.log('   Type 2 calculation: packNo * batteriesNo =', packNo, '*', batteriesNo, '=', expectedBatteryCount);
      } else {
        // External: Use batteriesNo
        expectedBatteryCount = batteriesNo;
        console.log('   Type 1 calculation: batteriesNo =', expectedBatteryCount);
      }
      
      console.log('   ✅ Expected battery rows:', expectedBatteryCount);

      // Step 2: Get current battery info from backend
      this.batteryService.getBatteryInfo(this.callNbr, this.equipId, this.batStrId).subscribe(
        (currentBatteries) => {
          const currentCount = currentBatteries.length;

          if (currentCount !== expectedBatteryCount) {
            // Battery count mismatch - need to adjust
            if (currentCount < expectedBatteryCount) {
              // Need to add batteries
              this.addMissingBatteryRows(currentBatteries, expectedBatteryCount);
            } else if (currentCount > expectedBatteryCount) {
              // Need to delete extra batteries (skip validation for Change button)
              // Change button should be able to delete rows even with VDC values
              this.deleteExtraBatteryRows(currentBatteries, expectedBatteryCount, true);
            }
          } else {
            // Count matches - just reload grid
            this.finalizeDisplayBatteryInfo();
          }
        },
        (error) => {
          this.handleError('Error in displayBatteryInfo: ' + error.message);
          this.finalizeDisplayBatteryInfo();
        }
      );
    } catch (error) {
      this.handleError('Error in displayBatteryInfo: ' + error);
      this.finalizeDisplayBatteryInfo();
    }
  }

  /**
   * AddMissingBatteryRows - Legacy equivalent
   * Adds new battery rows when expected count > current count
   * CRITICAL: Must save ALL batteries (existing + new) together
   * Backend does delete-then-insert, so partial save would lose existing data
   */
  private addMissingBatteryRows(currentBatteries: BatteryData[], expectedCount: number): void {
    const allBatteries: BatteryData[] = [];
    const roomTemp = parseInt(this.batteryStringForm.get('roomTemp')?.value) || 70;
    const currentCount = currentBatteries.length;

    // First, add all existing batteries to preserve their data
    currentBatteries.forEach(battery => {
      allBatteries.push({
        callNbr: this.callNbr,
        equipId: this.equipId,
        batteryStringId: this.batStrId,
        batteryId: battery.batteryId,
        temp: battery.temp,
        vdc: battery.vdc,
        vac: battery.vac,
        mhos: battery.mhos,
        strap1: battery.strap1,
        strap2: battery.strap2,
        spGravity: battery.spGravity,
        cracks: battery.cracks,
        replacementNeeded: battery.replacementNeeded,
        monitoringBattery: battery.monitoringBattery,
        actionPlan: battery.actionPlan,
        lastModified: battery.lastModified,
        maintAuthId: battery.maintAuthId,
      });
    });

    // Then add new battery records for missing rows
    for (let i = currentCount + 1; i <= expectedCount; i++) {
      allBatteries.push({
        callNbr: this.callNbr,
        equipId: this.equipId,
        batteryStringId: this.batStrId,
        batteryId: i,
        temp: roomTemp,
        vdc: 0,
        vac: 0,
        mhos: 0,
        strap1: 0,
        strap2: 0,
        spGravity: 0,
        cracks: 'P',
        replacementNeeded: 'N',
        monitoringBattery: 'N',
        actionPlan: '',
        lastModified: new Date(),
        maintAuthId: this.getUserId(),
      });
    }

    // Save ALL batteries together (backend does delete-then-insert)
    this.batteryService.saveBatteryData(allBatteries).subscribe(
      () => {
        this.finalizeDisplayBatteryInfo();
      },
      (error) => {
        this.handleError('Error adding battery rows: ' + error.message);
        this.finalizeDisplayBatteryInfo();
      }
    );
  }

  /**
   * Delete extra battery rows when count decreases
   * Legacy: DELETE FROM Battery with validation (check if VDC > 0)
   * Now: Filter array and save (delete-then-insert handles removal)
   * 
   * @param currentBatteries - Current battery data array
   * @param expectedCount - Expected number of batteries
   * @param skipValidation - Skip VDC validation (true for Change button flow)
   */
  private deleteExtraBatteryRows(currentBatteries: BatteryData[], expectedCount: number, skipValidation: boolean = false): void {
    // Validate that batteries to be deleted have VDC = 0 (legacy validation)
    // Skip validation for Change button flow - allow deletion even with VDC values
    let canDelete = true;
    
    if (!skipValidation) {
      for (let k = expectedCount; k < currentBatteries.length; k++) {
        if (currentBatteries[k].vdc > 0) {
          canDelete = false;
          this.handleError('Cannot delete battery rows with VDC values > 0. Please clear the values first.');
          break;
        }
      }
    } else {
      console.log('⚠️ Skipping VDC validation for Change button - allowing deletion of rows with values');
    }

    if (canDelete) {
      // Filter to keep only batteries up to expectedCount
      const remainingBatteries: BatteryData[] = currentBatteries
        .filter(battery => battery.batteryId <= expectedCount)
        .map(battery => ({
          callNbr: this.callNbr,
          equipId: this.equipId,
          batteryStringId: this.batStrId,
          batteryId: battery.batteryId,
          temp: battery.temp,
          vdc: battery.vdc,
          vac: battery.vac,
          mhos: battery.mhos,
          strap1: battery.strap1,
          strap2: battery.strap2,
          spGravity: battery.spGravity,
          cracks: battery.cracks,
          replacementNeeded: battery.replacementNeeded,
          monitoringBattery: battery.monitoringBattery,
          actionPlan: battery.actionPlan,
          lastModified: battery.lastModified,
          maintAuthId: battery.maintAuthId,
        }));

      // Save remaining batteries (backend delete-then-insert handles removal)
      this.batteryService.saveBatteryData(remainingBatteries).subscribe(
        () => {
          this.finalizeDisplayBatteryInfo();
        },
        (error) => {
          this.handleError('Error deleting extra battery rows: ' + error.message);
          this.finalizeDisplayBatteryInfo();
        }
      );
    } else {
      // Can't delete - just reload current grid
      this.finalizeDisplayBatteryInfo();
    }
  }

  /**
   * Finalize DisplayBatteryInfo - reload grid and string info
   * Legacy: dgReadings.DataBind() + reload counts
   * Used by Change button - minimal reload without reconciliation/reference values
   */
  private finalizeDisplayBatteryInfo(): void {
    // Reload battery grid data and update reconciliation (Change button flow)
    this.loadBatteryGridData(true);
    
    // Reload battery string info (simple version without cascading loads)
    this.loadBatteryStringInfoSimple();
    
    // Show success message
    this.toastr.success('Equipment batteries updated successfully!');
  }

  /**
   * Simple battery string info reload - without reconciliation or reference values
   * Used by Change button to avoid unnecessary API calls
   */
  private loadBatteryStringInfoSimple(): void {
    this.batteryService
      .getBatteryStringReadingsInfo(this.callNbr, this.equipId, this.batStrId)
      .subscribe(
        (data) => {
          this.batteryStringInfo = data;
          this.populateBatteryStringFormSimple(data);
          this.enableDisableLithium();
        },
        (error) => {
          this.handleError('Error loading battery string info: ' + error.message);
        }
      );
  }

  /**
   * Populate battery string form without loading reference values
   * Used by Change button to avoid GetReferenceValues call
   */
  private populateBatteryStringFormSimple(data: BatteryStringInfo): void {
    this.batteryStringForm.patchValue({
      manufacturer: data.manufacturer,
      batteryHousing: data.batteryHousing,
      modelNo: data.modelNo,
      serialNo: data.serialNo,
      location: data.location,
      batteryType: data.batteryType,
      batteryTypeName: data.batteryTypeName,
      equipStatus: data.equipStatus,
      startDate: this.getFormattedDate(data.monthName, data.year),
      commentsUsed: data.commentsUsed,
      bulgedCheck: data.bulgedCheck,
      bulgedPf: data.bulgedPf,
      crackedCheck: data.crackedCheck,
      crackedPf: data.crackedPf,
      debrisCheck: data.debrisCheck,
      debrisPf: data.debrisPf,
      rotten: data.rotten,
      verifySaftey: data.verifySaftey,
      containerComments: data.containerComments,
      environmentComments: data.environmentComments,
      totalBatteryVoltage: data.batVoltage,
      plusTerminalToGnd: data.plusTerminal,
      minusTerminalToGnd: data.minusTerminal,
      dcChargeCurrent: data.dcCharging,
      acRippleVoltage: data.acRipple,
      acRippleCurrent: data.acRippleCurrent,
      batteryVoltageVerify: data.batVoltatePf,
      plusTerminalVerify: data.plusTerminalPf,
      minusTerminalVerify: data.minusTerminalPf,
      dcChargingVerify: data.dcChargingPf,
      acRippleVoltageVerify: data.acRipplePf,
      acRippleCurrentVerify: data.acRippleCurrentPf,
      intercellConnector: data.intercellConnector,
      resistancePf: data.resistancePf,
      torqueVerify: data.codeTorquePf,
      chargingComments: data.comment,
      plusWrappedVerify: data.plusWrappedPf,
      plusWrappedCheck: data.plusWrappedCheck,
      plusSulfatedCheck: data.plusSulfatedCheck,
      plusMisposCheck: data.plusMisPosCheck,
      missingCheck: data.missingCheck,
      missingVerify: data.missingPf,
      brokenCheck: data.brokenCheck,
      needsCleaningCheck: data.needsCleaningCheck,
      platesComments: data.platesComments,
      waterLevel: data.waterLevelV,
      waterLevelVerify: data.waterLevelPf,
      readingType: data.readingType,
      stringType: data.stringType,
      electrolytesComments: data.electrolytesComments,
      roomTempVerify: data.batteryTempPf,
      roomTemp: data.roomTemp,
      batteryTemp: data.battTemp,
      batteryTempVerify: data.battTempPf,
      usedQuantity: data.quantityUsed,
      monitored: data.quantityNeeded,
      reasonToReplace: data.reasonReplace,
      floatVoltageStatus: data.floatVoltS,
      floatVoltageValue: data.floatVoltV,
      repMonCalculate: data.repMonCalc,
      packNo: data.batteryPackCount,
      battDisconnect: data.indBattDisconnect,
      indBattInterconnection: data.indBattInterConn,
      rackIntegrity: data.rackIntegrity,
      ventFanOperation: data.ventFanOperation,
      batteriesNo: this.batteryReadings.length, // Use actual battery count from grid
      replaceWholeString: data.replaceWholeString,
      mvacCheck: data.chckmVac,
      strapCheck: data.chkStrap,
      battTerminal: data.ddlBattTerminal,
      battTerminalType: data.ddlBattTypeTerminal,
      battTerminalValue: data.txtBattTerminal,
      midType: data.readingMethod,
      readingsGraphCheck: data.chkGraph,
    });
    // Note: No reference values loading here - keeps only form population
  }

  /**
   * Populate battery string form with data
   */
  private populateBatteryStringForm(data: BatteryStringInfo): void {
    this.batteryStringForm.patchValue({
      manufacturer: data.manufacturer,
      batteryHousing: data.batteryHousing,
      modelNo: data.modelNo,
      serialNo: data.serialNo,
      location: data.location,
      batteryType: data.batteryType,
      batteryTypeName: data.batteryTypeName,
      equipStatus: data.equipStatus,
      startDate: this.getFormattedDate(data.monthName, data.year),
      commentsUsed: data.commentsUsed,
      bulgedCheck: data.bulgedCheck,
      bulgedPf: data.bulgedPf,
      crackedCheck: data.crackedCheck,
      crackedPf: data.crackedPf,
      debrisCheck: data.debrisCheck,
      debrisPf: data.debrisPf,
      rotten: data.rotten,
      verifySaftey: data.verifySaftey,
      containerComments: data.containerComments,
      environmentComments: data.environmentComments,
      totalBatteryVoltage: data.batVoltage,
      plusTerminalToGnd: data.plusTerminal,
      minusTerminalToGnd: data.minusTerminal,
      dcChargeCurrent: data.dcCharging,
      acRippleVoltage: data.acRipple,
      acRippleCurrent: data.acRippleCurrent,
      batteryVoltageVerify: data.batVoltatePf,
      plusTerminalVerify: data.plusTerminalPf,
      minusTerminalVerify: data.minusTerminalPf,
      dcChargingVerify: data.dcChargingPf,
      acRippleVoltageVerify: data.acRipplePf,
      acRippleCurrentVerify: data.acRippleCurrentPf,
      intercellConnector: data.intercellConnector,
      resistancePf: data.resistancePf,
      torqueVerify: data.codeTorquePf,
      chargingComments: data.comment,
      plusWrappedVerify: data.plusWrappedPf,
      plusWrappedCheck: data.plusWrappedCheck,
      plusSulfatedCheck: data.plusSulfatedCheck,
      plusMisposCheck: data.plusMisPosCheck,
      missingCheck: data.missingCheck,
      missingVerify: data.missingPf,
      brokenCheck: data.brokenCheck,
      needsCleaningCheck: data.needsCleaningCheck,
      platesComments: data.platesComments,
      waterLevel: data.waterLevelV,
      waterLevelVerify: data.waterLevelPf,
      readingType: data.readingType,
      stringType: data.stringType,
      electrolytesComments: data.electrolytesComments,
      roomTempVerify: data.batteryTempPf,
      roomTemp: data.roomTemp,
      batteryTemp: data.battTemp,
      batteryTempVerify: data.battTempPf,
      usedQuantity: data.quantityUsed,
      monitored: data.quantityNeeded,
      reasonToReplace: data.reasonReplace,
      floatVoltageStatus: data.floatVoltS,
      floatVoltageValue: data.floatVoltV,
      repMonCalculate: data.repMonCalc,
      // Map URL params based on string type:
      // LEGACY MAPPING (from BatteryReadings.aspx with BattNum=2, BattPack=5):
      // Type 1: batteriesNo=BattNum (2), packNo from DB
      // Type 2: batteriesNo=BattPack (5), packNo=BattNum (2) → shows "5 2"
      // Type 3: batteriesNo=BattPack (5), packNo=BattNum (2) → shows "5 2"
      packNo: (() => {
        const value = (data.stringType === '2' || data.stringType === '3') ? (this.battNum || data.batteryPackCount) : data.batteryPackCount;
        console.log('🟢 [POPULATE] packNo set to:', value, '(StringType:', data.stringType, ', BattNum:', this.battNum, ', DB:', data.batteryPackCount, ')');
        return value;
      })(),
      battDisconnect: data.indBattDisconnect,
      indBattInterconnection: data.indBattInterConn,
      rackIntegrity: data.rackIntegrity,
      ventFanOperation: data.ventFanOperation,
      batteriesNo: (() => {
        const value = (data.stringType === '2' || data.stringType === '3') ? (this.battPack || this.batteryReadings.length || '40') : (this.battNum || this.batteryReadings.length || '40');
        console.log('🟢 [POPULATE] batteriesNo set to:', value, '(StringType:', data.stringType, ', BattPack:', this.battPack, ', BattNum:', this.battNum, ')');
        return value;
      })(),
      replaceWholeString: data.replaceWholeString,
      mvacCheck: data.chckmVac,
      strapCheck: data.chkStrap,
      battTerminal: data.ddlBattTerminal,
      battTerminalType: data.ddlBattTypeTerminal,
      battTerminalValue: data.txtBattTerminal,
      midType: data.readingMethod,
      readingsGraphCheck: data.chkGraph,
    });

    // Trigger string type change handler to update labels and field visibility
    console.log('🔄 Calling onStringTypeChange after form population');
    console.log('📝 stringType value:', data.stringType);
    console.log('📝 URL params - BattNum:', this.battNum, '| BattPack:', this.battPack);
    console.log('📝 Mapping logic - Type 1: batteriesNo=BattNum | Type 2/3: batteriesNo=BattPack, packNo=BattNum');
    console.log('📝 Form values after patchValue:', {
      batteriesNo: this.batteryStringForm.get('batteriesNo')?.value,
      packNo: this.batteryStringForm.get('packNo')?.value
    });
    this.onStringTypeChange(null);

    // Load reference values after form population
    const midType = data.readingMethod;
    if (midType) {
      // First: Load all make/models with equipId = 0 (get all available options)
      this.loadBatteryMakeModels(midType, 0);
      
      // Second: Load equipment-specific battery make/model with current equipId
      // Pass empty string for makeModel to get the equipment's saved battery make/model
      this.loadRefValueForMakeModel(midType, '', this.equipId);
    }
  }

  /**
   * Populate reconciliation form with data
   */
  private populateReconciliationForm(data: EquipReconciliationInfo): void {
    this.reconciliationForm.patchValue({
      recMake: data.make,
      recMakeCorrect: data.makeCorrect,
      actMake: data.actMake,
      recModel: data.model,
      recModelCorrect: data.modelCorrect,
      actModel: data.actModel,
      recSerialNo: data.serialNo,
      recSerialNoCorrect: data.serialNoCorrect,
      actSerialNo: data.actSerialNo,
      ascStrings: data.ascStringsNo,
      ascStringsCorrect: data.ascStringsCorrect,
      actAscStrings: data.actAscStringNo,
      battPerString: data.battPerString,
      battPerStringCorrect: data.battPerStringCorrect,
      actBattPerString: data.actBattPerString,
      reconciled: data.verified,
    });

    // Set readonly state for actual fields based on "Is Correct" dropdowns (legacy: EnabletoEdit)
    this.onReconciliationChange();
  }

  /**
   * Create battery string form
   */
  private createBatteryStringForm(): FormGroup {
    return this.fb.group({
      manufacturer: ['', Validators.required],
      batteryHousing: [''],
      modelNo: [''],
      serialNo: [''],
      location: [''],
      batteryType: [''],
      batteryTypeName: [''],
      equipStatus: [''],
      startDate: [''],
      commentsUsed: [''],
      bulgedCheck: [false],
      bulgedPf: [''],
      crackedCheck: [false],
      crackedPf: [''],
      debrisCheck: [false],
      debrisPf: [''],
      rotten: [''],
      verifySaftey: [''],
      containerComments: [''],
      environmentComments: [''],
      totalBatteryVoltage: [''],
      plusTerminalToGnd: [''],
      minusTerminalToGnd: [''],
      dcChargeCurrent: [''],
      acRippleVoltage: [''],
      acRippleCurrent: [''],
      batteryVoltageVerify: [''],
      plusTerminalVerify: [''],
      minusTerminalVerify: [''],
      dcChargingVerify: [''],
      acRippleVoltageVerify: [''],
      acRippleCurrentVerify: [''],
      intercellConnector: [''],
      resistancePf: [''],
      torqueVerify: [''],
      chargingComments: [''],
      plusWrappedVerify: [''],
      plusWrappedCheck: [false],
      plusSulfatedCheck: [false],
      plusMisposCheck: [false],
      missingCheck: [false],
      missingVerify: [''],
      brokenCheck: [false],
      needsCleaningCheck: [false],
      platesComments: [''],
      waterLevel: [''],
      waterLevelVerify: [''],
      readingType: [''],
      stringType: [''],
      electrolytesComments: [''],
      roomTempVerify: [''],
      roomTemp: [''],
      batteryTemp: [''],
      batteryTempVerify: [''],
      usedQuantity: [''],
      monitored: [''],
      reasonToReplace: [''],
      floatVoltageStatus: [''],
      floatVoltageValue: [''],
      repMonCalculate: [''],
      packNo: [''],
      battDisconnect: [''],
      indBattInterconnection: [''],
      rackIntegrity: [''],
      ventFanOperation: [''],
      batteriesNo: [''],
      replaceWholeString: [false],
      mvacCheck: [false],
      strapCheck: [false],
      battMakeModel: [''],
      refValue: [''],
      battTerminal: [''],
      battTerminalType: [''],
      battTerminalValue: [''],
      midType: [''],
      readingsGraphCheck: [false],
    });
  }

  /**
   * Create reconciliation form
   */
  private createReconciliationForm(): FormGroup {
    return this.fb.group({
      recMake: [''],
      recMakeCorrect: ['YS'],
      actMake: [{ value: '', disabled: true }],
      recModel: [''],
      recModelCorrect: ['YS'],
      actModel: [{ value: '', disabled: true }],
      recSerialNo: [''],
      recSerialNoCorrect: ['YS'],
      actSerialNo: [{ value: '', disabled: true }],
      ascStrings: [''],
      ascStringsCorrect: [''],
      actAscStrings: [''],
      battPerString: [''],
      battPerStringCorrect: ['YS'],
      actBattPerString: [{ value: '', disabled: true }],
      reconciled: [false],
    });
  }

  /**
   * Create battery grid form
   */
  private createBatteryGridForm(): FormGroup {
    return this.fb.group({});
  }

  /**
   * Enable/disable Lithium battery controls based on battery type
   * Legacy: enabledisableLithium()
   */
  enableDisableLithium(): void {
    const batteryType = this.batteryStringForm.get('batteryTypeName')?.value;
    this.isBatteryTypeLithium = batteryType === 'I';

    if (this.isBatteryTypeLithium) {
      // Lithium battery - set specific values and disable controls
      this.batteryStringForm.patchValue({
        batteryType: '4L',
        midType: '3',
        stringType: '3',
        readingType: '1',
        floatVoltageStatus: 'ON',
        floatVoltageValue: '1',
        batteriesNo: '8',
      });

      this.batteryStringForm.get('floatVoltageStatus')?.disable();
      this.batteryStringForm.get('floatVoltageValue')?.disable();
      this.batteryStringForm.get('midType')?.disable();
      this.batteryStringForm.get('stringType')?.disable();
      this.batteryStringForm.get('batteriesNo')?.disable();
      this.batteryStringForm.get('readingType')?.disable();
      this.batteryStringForm.get('batteryType')?.disable();
      this.batteryStringForm.get('mvacCheck')?.disable();
      this.batteryStringForm.get('strapCheck')?.disable();
    } else {
      // Non-Lithium - enable controls
      this.batteryStringForm.get('floatVoltageStatus')?.enable();
      this.batteryStringForm.get('floatVoltageValue')?.enable();
      this.batteryStringForm.get('midType')?.enable();
      this.batteryStringForm.get('stringType')?.enable();
      this.batteryStringForm.get('batteriesNo')?.enable();
      this.batteryStringForm.get('readingType')?.enable();
      this.batteryStringForm.get('batteryType')?.enable();
      this.batteryStringForm.get('mvacCheck')?.enable();
      this.batteryStringForm.get('strapCheck')?.enable();
    }
  }

  /**
   * Handle battery type change - recalculate reference values
   */
  onBatteryTypeChange(): void {
    this.enableDisableLithium();
    this.loadReferenceValues();
  }

  /**
   * Handle replace whole string checkbox change
   */
  onReplaceStringChange(event: any): void {
    const isChecked = event.target.checked;
    const reasonControl = this.batteryStringForm.get('reasonToReplace');
    
    if (!isChecked) {
      // If unchecked, clear the reason to replace value
      reasonControl?.setValue('');
      reasonControl?.disable();
    } else {
      // If checked, enable the reason to replace dropdown
      reasonControl?.enable();
    }
  }

  /**
   * Handle reason to replace dropdown change
   */
  onReasonToReplaceChange(event: any): void {
    // This method is a placeholder for future logic
    // Currently just ensures the form control stays in sync
  }

  /**
   * Handle MidType (Readings Taken By) change
   */
  onMidTypeChange(event: any): void {
    const midType = event.target.value;
    this.batteryStringForm.patchValue({ midType });
    this.loadBatteryMakeModels(midType, 0);
  }

  /**
   * Handle String Type change - updates dynamic labels and field visibility
   * Legacy: showhidebpack()
   */
  onStringTypeChange(event: any): void {
    const stringType = event?.target?.value || this.batteryStringForm.get('stringType')?.value;
    
    console.log('� [DROPDOWN] onStringTypeChange called');
    console.log('🟡 [DROPDOWN] Event:', event);
    console.log('🟡 [DROPDOWN] Selected stringType:', stringType);
    console.log('� [DROPDOWN] URL params - BattNum:', this.battNum, '| BattPack:', this.battPack);
    
    // Get current form values BEFORE any changes
    const currentBatteriesNo = this.batteryStringForm.get('batteriesNo')?.value;
    const currentPackNo = this.batteryStringForm.get('packNo')?.value;
    console.log('� [DROPDOWN] BEFORE change - batteriesNo:', currentBatteriesNo, '| packNo:', currentPackNo);
    
    // Determine if we're in initial load (has URL params) or user change (event exists)
    const isUserChange = event !== null;
    const hasUrlParams = !!(this.battNum || this.battPack);
    console.log('🟡 [DROPDOWN] isUserChange:', isUserChange, '| hasUrlParams:', hasUrlParams);
    
    if (stringType === '3') {
      // Battery Packs / Trays
      // LEGACY: Shows BattPack (5) then BattNum (2) → "5 2"
      // batteriesNo field shows BattPack (5), packNo field shows BattNum (2)
      this.batteriesNoLabel = 'No of Battery Packs:';
      this.packNoLabel = 'Batteries per Pack:';
      this.showPackNoField = true;
      console.log('🟡 [DROPDOWN] Type 3 selected - Labels updated');
      
      // Update values if: (1) User is changing type with URL params OR (2) Initial load with URL params
      if (hasUrlParams) {
        // Use URL params to set correct values for Type 3
        const newBatteriesNo = this.battPack || currentBatteriesNo;
        const newPackNo = this.battNum || currentPackNo;
        
        console.log('🟡 [DROPDOWN] Type 3 - Will set batteriesNo =', newBatteriesNo, '(BattPack), packNo =', newPackNo, '(BattNum)');
        this.batteryStringForm.patchValue({
          batteriesNo: newBatteriesNo,
          packNo: newPackNo
        });
      } else if (isUserChange) {
        // User changing dropdown but no URL params - keep current values
        console.log('🟡 [DROPDOWN] Type 3 - Keeping current values (no URL params)');
      } else {
        console.log('🟡 [DROPDOWN] Type 3 - No update (loading from DB)');
      }
    } else if (stringType === '2') {
      // Internal Single / Parallel Strings
      // LEGACY: Shows BattPack (5) then BattNum (2) → "5 2"
      // batteriesNo field shows BattPack (5), packNo field shows BattNum (2)
      this.batteriesNoLabel = 'No of Internal Strings:';
      this.packNoLabel = 'Batteries per String:';
      this.showPackNoField = true;
      console.log('🟡 [DROPDOWN] Type 2 selected - Labels updated');
      
      // Update values if: (1) User is changing type with URL params OR (2) Initial load with URL params
      if (hasUrlParams) {
        // Use URL params to set correct values for Type 2
        const newBatteriesNo = this.battPack || currentBatteriesNo;
        const newPackNo = this.battNum || currentPackNo;
        
        console.log('🟡 [DROPDOWN] Type 2 - Will set batteriesNo =', newBatteriesNo, '(BattPack), packNo =', newPackNo, '(BattNum)');
        this.batteryStringForm.patchValue({
          batteriesNo: newBatteriesNo,
          packNo: newPackNo
        });
      } else if (isUserChange) {
        // User changing dropdown but no URL params - keep current values
        console.log('🟡 [DROPDOWN] Type 2 - Keeping current values (no URL params)');
      } else {
        console.log('🟡 [DROPDOWN] Type 2 - No update (loading from DB)');
      }
    } else {
      // External (default) - Type 1
      // batteriesNo should show BattNum only
      // packNo field is hidden but should preserve its value for API
      this.batteriesNoLabel = 'No of Batteries per string:';
      this.packNoLabel = 'Batteries per String';
      this.showPackNoField = false;
      console.log('🟡 [DROPDOWN] Type 1 selected - Labels updated, packNo field hidden');
      
      // Update values if: (1) User is changing type with URL params OR (2) Initial load with URL params
      if (hasUrlParams) {
        // Use URL params to set correct value for Type 1 (only BattNum)
        const newBatteriesNo = this.battNum || currentBatteriesNo;
        
        console.log('🟡 [DROPDOWN] Type 1 - Will set batteriesNo =', newBatteriesNo, '(BattNum)');
        this.batteryStringForm.patchValue({
          batteriesNo: newBatteriesNo
          // NOTE: Do NOT clear packNo - it may have a value that needs to be sent to API
          // packNo field is hidden but value is preserved
        });
      } else if (isUserChange) {
        // User changing dropdown but no URL params - keep current batteriesNo value
        console.log('🟡 [DROPDOWN] Type 1 - Keeping current batteriesNo (no URL params)');
      } else {
        console.log('🟡 [DROPDOWN] Type 1 - No update (loading from DB)');
      }
      // NOTE: Removed automatic packNo clearing for Type 1
      // The packNo value is preserved even though the field is hidden
    }
    
    console.log('🟡 [DROPDOWN] AFTER change - batteriesNo:', this.batteryStringForm.get('batteriesNo')?.value, '| packNo:', this.batteryStringForm.get('packNo')?.value);
  }
  /**
   * Handle reconciliation dropdown changes
   * Clears "Actual" field when "Is Correct" is changed to Yes or N/A
   * Enables/disables actual fields based on "Is Correct" value (legacy: EnabletoEdit)
   */
  onReconciliationChange(): void {
    const recMakeCorrect = this.reconciliationForm.get('recMakeCorrect')?.value;
    const recModelCorrect = this.reconciliationForm.get('recModelCorrect')?.value;
    const recSerialNoCorrect = this.reconciliationForm.get('recSerialNoCorrect')?.value;
    const battPerStringCorrect = this.reconciliationForm.get('battPerStringCorrect')?.value;

    // Enable/disable and clear actual Make field
    if (recMakeCorrect === 'NO') {
      this.reconciliationForm.get('actMake')?.enable();
    } else {
      this.reconciliationForm.get('actMake')?.disable();
      this.reconciliationForm.patchValue({ actMake: '' });
    }

    // Enable/disable and clear actual Model field
    if (recModelCorrect === 'NO') {
      this.reconciliationForm.get('actModel')?.enable();
    } else {
      this.reconciliationForm.get('actModel')?.disable();
      this.reconciliationForm.patchValue({ actModel: '' });
    }

    // Enable/disable and clear actual Serial No field
    if (recSerialNoCorrect === 'NO') {
      this.reconciliationForm.get('actSerialNo')?.enable();
    } else {
      this.reconciliationForm.get('actSerialNo')?.disable();
      this.reconciliationForm.patchValue({ actSerialNo: '' });
    }

    // Enable/disable and clear actual Batteries Per String field
    if (battPerStringCorrect === 'NO') {
      this.reconciliationForm.get('actBattPerString')?.enable();
    } else {
      this.reconciliationForm.get('actBattPerString')?.disable();
      this.reconciliationForm.patchValue({ actBattPerString: '' });
    }
  }

  /**
   * Handle checkbox clicks in Sealed Battery section (Container & Cover)
   * Legacy: CheckBoxClick for sealed battery checkboxes
   */
  onSealedCheckboxChange(checkboxName: string, dropdownName: string): void {
    const isChecked = this.batteryStringForm.get(checkboxName)?.value;
    
    if (isChecked) {
      // If checkbox is checked, set dropdown to Fail
      this.batteryStringForm.patchValue({ [dropdownName]: 'F' });
    } else {
      // If unchecked, set to Pass
      this.batteryStringForm.patchValue({ [dropdownName]: 'P' });
    }
  }

  /**
   * Handle checkbox clicks in Flooded Battery section (Plates)
   * Legacy: CheckBoxClick with three related checkboxes
   */
  onFloodedPlatesCheckboxChange(): void {
    const wrapped = this.batteryStringForm.get('plusWrappedCheck')?.value;
    const sulfated = this.batteryStringForm.get('plusSulfatedCheck')?.value;
    const mispositioned = this.batteryStringForm.get('plusMisposCheck')?.value;
    
    // If any of the three checkboxes is checked, set dropdown to Fail
    if (wrapped || sulfated || mispositioned) {
      this.batteryStringForm.patchValue({ plusWrappedVerify: 'F' });
    } else {
      this.batteryStringForm.patchValue({ plusWrappedVerify: 'P' });
    }
  }

  /**
   * Handle checkbox clicks in Flooded Battery section (Flame Arrestors & Covers)
   * Legacy: CheckBoxClick with three related checkboxes
   */
  onFloodedCoversCheckboxChange(): void {
    const missing = this.batteryStringForm.get('missingCheck')?.value;
    const broken = this.batteryStringForm.get('brokenCheck')?.value;
    const needsCleaning = this.batteryStringForm.get('needsCleaningCheck')?.value;
    
    // If any of the three checkboxes is checked, set dropdown to Fail
    if (missing || broken || needsCleaning) {
      this.batteryStringForm.patchValue({ missingVerify: 'F' });
    } else {
      this.batteryStringForm.patchValue({ missingVerify: 'P' });
    }
  }

  /**
   * Handle Battery Make/Model change and load reference values
   */
  onBattMakeModelChange(event: any): void {
    const midType = this.batteryStringForm.get('midType')?.value;
    const makeModel = event.target.value;
    this.batteryStringForm.patchValue({ battMakeModel: makeModel });
    this.loadRefValueForMakeModel(midType, makeModel, this.equipId);
  }

  /**
   * Load battery make/model dropdown based on MidType
   * Passes 6 parameters to API:
   * 1. equipId - Equipment ID (0 for all, or specific equipId for equipment-specific data)
   * 2. operation - Type of operation ('G' for Get)
   * 3. midType - Reading method (2=Fluke, 3=BCM)
   * 4. battMakeModel - Battery make/model name (empty for initial load to get all)
   * 5. refValue1 - Reference value 1 (Fluke value, 0 when loading)
   * 6. refValue2 - Reference value 2 (BCM value, 0 when loading)
   */
  private loadBatteryMakeModels(midType: string, equipId: number): void {
    this.batteryService.getReferenceValues(equipId, 'G', midType, '', 0, 0).subscribe(
      (data) => {
        if (data && data.length > 0) {
          // Map the response to batteryMakeModels
          // API returns: Name (display), Value (identifier), RefValue, Resistance
          // Service maps to: name, id, value1, value2
          // Use 'name' as both display and value for dropdown binding consistency
          this.batteryMakeModels = data.map((item: any) => ({
            name: item.name || '', // Battery make/model name from API (for display)
            value: item.name || '' // Use name as value for binding with second API call
          }));
        } else {
          this.batteryMakeModels = [];
        }
      },
      (error) => {
        console.error('Error loading battery make/models:', error);
        this.batteryMakeModels = [];
      }
    );
  }

  /**
   * Load reference value for selected make/model
   * Passes 6 parameters to API:
   * 1. equipId - Equipment ID (specific equipId for equipment-specific reference value)
   * 2. operation - Type of operation ('G' for Get)
   * 3. midType - Reading method (2=Fluke, 3=BCM)
   * 4. makeModel - Battery make/model name (specific model to get reference value for)
   * 5. refValue1 - Reference value 1 (Fluke value, 0 when loading)
   * 6. refValue2 - Reference value 2 (BCM value, 0 when loading)
   */
  private loadRefValueForMakeModel(midType: string, makeModel: string, equipId: number): void {
    this.batteryService.getReferenceValues(equipId, 'G', midType, makeModel, 0, 0).subscribe(
      (data) => {
        if (data && data.length > 0) {
          const refData = data[0];
          
          // Bind the battery make/model dropdown with the Name from API
          // Second API call uses 'name' field (API's "Name") for dropdown selection
          if (refData.name) {
            this.batteryStringForm.patchValue({ battMakeModel: refData.name });
          }
          
          // Use Resistance (value2) for reference value textbox
          // Second API call binds Resistance directly to reference value field
          let refValue: any = '';
          if (refData.value2 !== undefined && refData.value2 !== null) {
            refValue = refData.value2;
          }
          
          // Clear if value is "0"
          if (refValue === 0 || refValue === '0') {
            refValue = '';
          }
          
          this.batteryStringForm.patchValue({ refValue: refValue.toString() });
        } else {
          this.batteryStringForm.patchValue({ 
            battMakeModel: '',
            refValue: '' 
          });
        }
      },
      (error) => {
        console.error('Error loading reference value:', error);
        this.batteryStringForm.patchValue({ 
          battMakeModel: '',
          refValue: '' 
        });
      }
    );
  }

  /**
   * Load reference values based on current selections
   */
  loadReferenceValues(): void {
    const readingMethod = this.batteryStringForm.get('midType')?.value;
    const battMakeModel = this.batteryStringForm.get('manufacturer')?.value;

    this.batteryService
      .getReferenceValues(this.equipId, 'G', readingMethod, battMakeModel)
      .subscribe(
        (data) => {
          if (data && data.length > 0) {
            const refValue = data[0];
            // Set reference value based on reading method
            if (readingMethod === '1') {
              this.batteryStringForm.patchValue({
                refValue: refValue.value1 || 0,
              });
            } else {
              this.batteryStringForm.patchValue({
                refValue: refValue.value2 || 0,
              });
            }
          }
        },
        (error) => {
          console.warn('Error loading reference values:', error);
        }
      );
  }

  /**
   * Get battery type value for calculations
   * Legacy: getBatteryTypeValue()
   */
  getBatteryTypeValue(): number {
    const batteryType = this.batteryStringForm.get('batteryType')?.value;
    const typeMap: { [key: string]: number } = {
      '1V': 1.2,
      '2V': 2,
      '4V': 4,
      '4L': 4,
      '8V': 8,
      TV: 10,
      V: 12,
      FV: 12,
      SV: 16,
      '6V': 6,
      FL: 12,
    };
    return typeMap[batteryType] || 12;
  }

  /**
   * Get battery age based on type
   * Legacy: getBatteryAge()
   */
  getBatteryAge(): number {
    const batteryTypeName = this.batteryStringForm.get('batteryTypeName')?.value;
    const batteryType = this.batteryStringForm.get('batteryType')?.value;

    if (batteryTypeName === 'L' || batteryTypeName === 'I') {
      this.batteryAge = 10;
    } else if (batteryTypeName === 'F') {
      this.batteryAge = 15;
    } else if (batteryTypeName === 'S') {
      const ageMap: { [key: string]: number } = {
        '2V': 15,
        '4V': 15,
        '4L': 15,
        '8V': 15,
        TV: 10,
        FV: 10,
        SV: 4,
        '6V': 10,
        FL: 15,
        V: 4,
        '1V': 4,
      };
      this.batteryAge = ageMap[batteryType] || 10;
    }

    return this.batteryAge;
  }

  /**
   * Get float voltage range for battery type
   * Legacy: getBatteryFloatVoltage()
   */
  getBatteryFloatVoltage(): { lowVolt: number; maxVolt: number } {
    const batteryType = this.batteryStringForm.get('batteryType')?.value;
    const abmCharger = this.batteryStringForm.get('floatVoltageValue')?.value;

    const voltageMap: {
      [key: string]: { base: number; charger1: number; charger2: number };
    } = {
      '2V': { base: 2.11, charger1: 2.3, charger2: 2.33 },
      '4V': { base: 4.22, charger1: 4.6, charger2: 4.66 },
      '8V': { base: 8.44, charger1: 9.2, charger2: 9.33 },
      TV: { base: 10.56, charger1: 11.51, charger2: 11.66 },
      V: { base: 12.68, charger1: 13.82, charger2: 14.3 },
      FV: { base: 14.79, charger1: 16.12, charger2: 16.33 },
      SV: { base: 16.9, charger1: 18.42, charger2: 18.66 },
      '6V': { base: 6.34, charger1: 6.91, charger2: 7.0 },
    };

    const voltage = voltageMap[batteryType] || { base: 0, charger1: 0, charger2: 0 };
    const maxVolt = abmCharger === '2' ? voltage.charger2 : voltage.charger1;

    return {
      lowVolt: voltage.base,
      maxVolt: maxVolt,
    };
  }

  /**
   * Check if battery should be recommended for replacement
   * Legacy: RecommendtoReplace()
   */
  recommendToReplace(): boolean {
    try {
      const dateCode = this.batteryStringForm.get('startDate')?.value;
      if (dateCode && this.isValidDate(dateCode)) {
        this.getBatteryAge();
        const startDate = new Date(dateCode);
        const today = new Date();
        const days = Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        );
        return days >= this.batteryAge;
      }
    } catch (error) {
      this.handleError('Error calculating battery age');
    }
    return false;
  }

  /**
   * Check for proactive replacement (one year before max age)
   * Legacy: ProactiveReplace()
   */
  proactiveReplace(): boolean {
    try {
      const dateCode = this.batteryStringForm.get('startDate')?.value;
      if (dateCode && this.isValidDate(dateCode)) {
        this.getBatteryAge();
        const startDate = new Date(dateCode);
        const today = new Date();
        const days = Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        );
        return days === this.batteryAge - 1;
      }
    } catch (error) {
      this.handleError('Error calculating proactive replacement');
    }
    return false;
  }

  /**
   * Calculate battery deficiency based on readings
   * Legacy: CalculateBatteryDef()
   */
  calculateBatteryDef(): void {
    try {
      const batteryType = this.batteryStringForm.get('batteryType')?.value;
      const batteryTypeName = this.batteryStringForm.get('batteryTypeName')?.value;
      const floatVoltageStatus = this.batteryStringForm.get('floatVoltageStatus')?.value;
      const floatVoltageValue = this.batteryStringForm.get('floatVoltageValue')?.value || 0;

      if (batteryType === 'PS') {
        return;
      }

      let monitor2 = 0;
      let replace = 0;
      let monitorlow = 0;
      let replacelow = 0;
      let mhWarning = 0;
      let mhError = 0;

      // Load thresholds from battery type values
      this.batteryService
        .getBatteryTypeValues(
          batteryType,
          batteryTypeName,
          floatVoltageStatus,
          floatVoltageValue
        )
        .subscribe(
          (typeValues) => {
            monitor2 = typeValues.monitorEnd;
            replace = typeValues.replace;

            const readingType = this.batteryStringForm.get('readingType')?.value;
            const midType = this.batteryStringForm.get('midType')?.value;
            const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
            const stringType = this.batteryStringForm.get('stringType')?.value;

            // Calculate thresholds based on reading type
            if (
              readingType === '2' &&
              midType !== '3'
            ) {
              const refValue = this.convertToDecimal(
                this.batteryStringForm.get('refValue')?.value || '0'
              );
              if (midType === '1') {
                mhWarning = (refValue * 70) / 100;
                mhError = (refValue * 60) / 100;
              } else {
                mhWarning = (refValue * 140) / 100;
                mhError = (refValue * 150) / 100;
              }
            } else if (readingType === '1' && midType === '3') {
              monitorlow = 25.6;
              replacelow = 24.0;
            } else if (readingType === '1' && stringType === '3') {
              replace = batteriesNo * replace;
              monitor2 = batteriesNo * monitor2;
            } else if (readingType === '3') {
              const battTypeValue = this.getBatteryTypeValue();
              replace = batteriesNo * battTypeValue + 0.2;
              monitor2 = batteriesNo * battTypeValue + 0.5;
            }

            // Apply calculations to grid rows
            this.applyBatteryDefCalculations(
              monitor2,
              replace,
              monitorlow,
              replacelow,
              mhWarning,
              mhError,
              midType,
              readingType
            );
          },
          (error) => {
            console.warn('Error loading battery type values:', error);
          }
        );
    } catch (error) {
      this.handleError('Error calculating battery deficiency: ' + error);
    }
  }

  /**
   * Calculate battery deficiency with callback (synchronous flow)
   * This version calls a callback after the async calculation completes
   * Used before status calculation to ensure usedQuantity is up-to-date
   */
  calculateBatteryDefSync(callback: () => void): void {
    try {
      const batteryType = this.batteryStringForm.get('batteryType')?.value;
      const batteryTypeName = this.batteryStringForm.get('batteryTypeName')?.value;
      const floatVoltageStatus = this.batteryStringForm.get('floatVoltageStatus')?.value;
      const floatVoltageValue = this.batteryStringForm.get('floatVoltageValue')?.value || 0;

      if (batteryType === 'PS') {
        callback();
        return;
      }

      let monitor2 = 0;
      let replace = 0;
      let monitorlow = 0;
      let replacelow = 0;
      let mhWarning = 0;
      let mhError = 0;

      // Load thresholds from battery type values
      this.batteryService
        .getBatteryTypeValues(
          batteryType,
          batteryTypeName,
          floatVoltageStatus,
          floatVoltageValue
        )
        .subscribe(
          (typeValues) => {
            monitor2 = typeValues.monitorEnd;
            replace = typeValues.replace;

            const readingType = this.batteryStringForm.get('readingType')?.value;
            const midType = this.batteryStringForm.get('midType')?.value;
            const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
            const stringType = this.batteryStringForm.get('stringType')?.value;

            // Calculate thresholds based on reading type
            if (
              readingType === '2' &&
              midType !== '3'
            ) {
              const refValue = this.convertToDecimal(
                this.batteryStringForm.get('refValue')?.value || '0'
              );
              if (midType === '1') {
                mhWarning = (refValue * 70) / 100;
                mhError = (refValue * 60) / 100;
              } else {
                mhWarning = (refValue * 140) / 100;
                mhError = (refValue * 150) / 100;
              }
            } else if (readingType === '1' && midType === '3') {
              monitorlow = 25.6;
              replacelow = 24.0;
            } else if (readingType === '1' && stringType === '3') {
              replace = batteriesNo * replace;
              monitor2 = batteriesNo * monitor2;
            } else if (readingType === '3') {
              const battTypeValue = this.getBatteryTypeValue();
              replace = batteriesNo * battTypeValue + 0.2;
              monitor2 = batteriesNo * battTypeValue + 0.5;
            }

            // Apply calculations to grid rows
            this.applyBatteryDefCalculations(
              monitor2,
              replace,
              monitorlow,
              replacelow,
              mhWarning,
              mhError,
              midType,
              readingType
            );

            // Call callback after calculation completes
            callback();
          },
          (error) => {
            console.warn('Error loading battery type values:', error);
            // Even on error, call callback to continue flow
            callback();
          }
        );
    } catch (error) {
      console.error('Error in calculateBatteryDefSync:', error);
      this.handleError('Error calculating battery deficiency: ' + error);
      // Even on error, call callback to continue flow
      callback();
    }
  }

  /**
   * Apply deficiency calculations to grid rows
   */
  private applyBatteryDefCalculations(
    monitor2: number,
    replace: number,
    monitorlow: number,
    replacelow: number,
    mhWarning: number,
    mhError: number,
    midType: string,
    readingType: string
  ): void {
    let totalReplace = 0;
    let totalMonitor = 0;

    // Create a new array to trigger change detection
    this.batteryReadings = this.batteryReadings.map((row, index) => {
      const vdc = this.convertToDecimal(row.vdc.toString());
      const mhos = this.convertToDecimal(row.mhos.toString());
      
      let actionPlan = row.actionPlan;
      let replacementNeeded = row.replacementNeeded;
      let monitoringBattery = row.monitoringBattery;

      // VDC Analysis
      if (replacelow > 0 || monitorlow > 0) {
        if (vdc >= replace && vdc < replacelow) {
          actionPlan = `Float voltage must be between ${replace} and ${replacelow}`;
          replacementNeeded = 'Y';
          monitoringBattery = 'N';
          totalReplace++;
        } else if (vdc >= monitor2 && vdc < monitorlow) {
          actionPlan = `Float voltage between ${monitor2} and ${monitorlow}`;
          monitoringBattery = 'Y';
          replacementNeeded = 'N';
          totalMonitor++;
        } else {
          replacementNeeded = 'N';
          monitoringBattery = 'N';
          if (row.cracks !== 'F') {
            actionPlan = '';
          } else {
            actionPlan = 'Battery is leaking / damaged / corrosion';
          }
        }
      } else {
        if (vdc <= replace) {
          actionPlan = `Float voltage is less than or equal to ${replace}. To be Replaced`;
          replacementNeeded = 'Y';
          monitoringBattery = 'N';
          totalReplace++;
        } else if (vdc <= monitor2) {
          actionPlan = `Float voltage is less than or equal to ${monitor2}. To be Monitored`;
          monitoringBattery = 'Y';
          replacementNeeded = 'N';
          totalMonitor++;
        } else {
          replacementNeeded = 'N';
          monitoringBattery = 'N';
          if (row.cracks !== 'F') {
            actionPlan = '';
          } else {
            actionPlan = 'Battery is leaking / damaged / corrosion';
          }
        }
      }

      // MHOS Analysis (Conductance)
      if (readingType === '2' && midType !== '3') {
        if (midType === '1') {
          if (mhos <= mhError) {
            if (replacementNeeded === 'N') {
              actionPlan = `Fail value:${mhError}. Battery to be Replaced`;
              replacementNeeded = 'Y';
              monitoringBattery = 'N';
              totalReplace++;
            }
          } else if (mhos <= mhWarning) {
            if (monitoringBattery === 'N') {
              actionPlan = `Warning value:${mhWarning}. Battery to be Monitored`;
              monitoringBattery = 'Y';
              replacementNeeded = 'N';
              totalMonitor++;
            }
          }
        } else if (midType === '2') {
          if (mhos > mhError) {
            if (replacementNeeded === 'N') {
              actionPlan = `Fail value:${mhError}. Battery to be Replaced`;
              replacementNeeded = 'Y';
              monitoringBattery = 'N';
              totalReplace++;
            }
          } else if (mhos > mhWarning && mhos <= mhError) {
            if (monitoringBattery === 'N') {
              actionPlan = `Warning value:${mhWarning}. Battery to be Monitored`;
              monitoringBattery = 'Y';
              replacementNeeded = 'N';
              totalMonitor++;
            }
          }
        }
      }

      // Return updated row (creates new object reference)
      return {
        ...row,
        actionPlan,
        replacementNeeded,
        monitoringBattery
      };
    });

    this.batteryStringForm.patchValue({
      usedQuantity: totalReplace,
      monitored: totalMonitor,
    });

    this.totalReplace = totalReplace;
    this.totalMonitor = totalMonitor;
  }

  /**
   * Get equipment status based on battery conditions
   * Legacy: GetEquipStatus()
   * 
   * IMPORTANT: The legacy has a BUG in the else clause:
   * if ((ddlStatus.SelectedValue != "Offline")) { ... }
   * else { return "CriticalDeficiency"; }  ← This is WRONG! Should not return CD for Offline
   * 
   * We're fixing this by having the caller check for Offline before calling this method
   */
  getEquipmentStatus(): string {
    try {
      const currentStatus = this.batteryStringForm.get('equipStatus')?.value;
      let resultStatus = 'Online';

      console.log('\n=== getEquipmentStatus START ===');
      console.log('📊 Input Status:', currentStatus);
      console.log('📍 Battery Readings Count:', this.batteryReadings.length);

      // Step 1: Check usedQuantity (batteries marked for replacement)
      // Legacy: if(cvt2Int(txtUsedQuantity.Text)>0) return "CriticalDeficiency";
      const usedQuantity = parseInt(this.batteryStringForm.get('usedQuantity')?.value) || 0;
      console.log('\n🔍 Step 1: Check usedQuantity');
      console.log('   usedQuantity =', usedQuantity);
      
      // Log battery grid to see which batteries are marked for replacement
      const replacementBatteries = this.batteryReadings.filter(b => b.replacementNeeded === 'Y');
      if (replacementBatteries.length > 0) {
        console.log('   ⚠️ Batteries marked for replacement:', 
                    replacementBatteries.map(b => `#${b.batteryId}`).join(', '));
      }
      
      if (usedQuantity > 0) {
        console.log('   ❌ RESULT: CriticalDeficiency (usedQuantity > 0)');
        console.log('   📝 This is CORRECT legacy behavior');
        console.log('   💡 To test other statuses: Change "Replace?" to "N" for these batteries in the grid');
        console.log('=== getEquipmentStatus END ===\n');
        return 'CriticalDeficiency';
      }
      console.log('   ✅ Pass: No batteries marked for replacement');

      console.log('   ✅ Pass: No batteries marked for replacement');

      // Step 2: Check for replacement recommended or proactive replacement
      // Legacy: RecommendtoReplace() || (ddlReasonToReplace.SelectedValue == "DA" && chkReplace.Checked)
      console.log('\n🔍 Step 2: Check age-based replacement');
      const recommendToReplaceResult = this.recommendToReplace();
      const reasonToReplace = this.batteryStringForm.get('reasonToReplace')?.value;
      const replaceWholeString = this.batteryStringForm.get('replaceWholeString')?.value;
      
      console.log('   recommendToReplace():', recommendToReplaceResult);
      console.log('   reasonToReplace:', reasonToReplace);
      console.log('   replaceWholeString:', replaceWholeString);
      
      if (recommendToReplaceResult || 
          (reasonToReplace === 'DA' && replaceWholeString)) {
        resultStatus = 'ReplacementRecommended';
        console.log('   ❌ RESULT: ReplacementRecommended');
        console.log('=== getEquipmentStatus END ===\n');
        return resultStatus;
      }
      console.log('   ✅ Pass: Not due for age-based replacement');

      // Step 3: Check for proactive replacement
      // Legacy: ProactiveReplace()
      console.log('\n🔍 Step 3: Check proactive replacement');
      const proactiveReplaceResult = this.proactiveReplace();
      console.log('   proactiveReplace():', proactiveReplaceResult);
      if (proactiveReplaceResult) {
        resultStatus = 'ProactiveReplacement';
        console.log('   ❌ RESULT: ProactiveReplacement');
        console.log('=== getEquipmentStatus END ===\n');
        return resultStatus;
      }
      console.log('   ✅ Pass: Not due for proactive replacement');

      // Step 4: Preserve non-Online status if no issues found above
      // Legacy: if (ddlStatus.SelectedValue != "Online") resultStatus = ddlStatus.SelectedValue;
      console.log('\n🔍 Step 4: Preserve user-selected status');
      if (currentStatus !== 'Online') {
        resultStatus = currentStatus;
        console.log('   📌 Preserving non-Online status:', resultStatus);
      } else {
        console.log('   📌 Status is Online, will check field deficiencies');
      }

      // Step 5: Check field-level deficiencies
      // Legacy: Loops through JobSummaryReport checking all fields against GetStatusDescription
      console.log('\n🔍 Step 5: Check field-level deficiencies');
      const statusFromFields = this.checkFieldLevelDeficiencies(resultStatus);
      
      if (statusFromFields !== resultStatus) {
        console.log('   ❌ Field deficiencies found, status upgraded');
        resultStatus = statusFromFields;
      } else {
        console.log('   ✅ No field deficiencies, status unchanged');
      }

      console.log('\n🎯 FINAL RESULT:', resultStatus);
      console.log('=== getEquipmentStatus END ===\n');

      return resultStatus;
    } catch (error) {
      console.error('❌ Error in getEquipmentStatus:', error);
      this.handleError('Error determining equipment status: ' + error);
      return 'Online';
    }
  }

  /**
   * Check field-level deficiencies based on form values
   * Simplified version of legacy JobSummaryReport loop
   * Returns highest priority status found
   */
  private checkFieldLevelDeficiencies(currentStatus: string): string {
    let resultStatus = currentStatus;
    const failedFields: string[] = [];

    console.log('  checkFieldLevelDeficiencies - Input status:', currentStatus);

    // Define status priority (higher number = higher priority)
    const statusPriority: { [key: string]: number } = {
      'Online': 0,
      'OnLine(MinorDeficiency)': 1,
      'ProactiveReplacement': 2,
      'OnLine(MajorDeficiency)': 3,
      'ReplacementRecommended': 4,
      'CriticalDeficiency': 5
    };

    // Helper to update status if new one has higher priority
    const updateStatus = (fieldName: string, fieldValue: any, newStatus: string) => {
      const currentPriority = statusPriority[resultStatus] || 0;
      const newPriority = statusPriority[newStatus] || 0;
      if (newPriority > currentPriority) {
        console.log(`  Field "${fieldName}" = "${fieldValue}" → Upgrading status to "${newStatus}" (priority ${newPriority} > ${currentPriority})`);
        failedFields.push(`${fieldName}=${fieldValue}`);
        resultStatus = newStatus;
      }
    };

    // Check Battery Charging System fields (critical failures)
    // Legacy checks TempField == "N" || TempField == "F"
    const batteryVoltageVerify = this.batteryStringForm.get('batteryVoltageVerify')?.value;
    if (batteryVoltageVerify === 'F') {
      updateStatus('batteryVoltageVerify', batteryVoltageVerify, 'CriticalDeficiency');
    }
    
    const plusTerminalVerify = this.batteryStringForm.get('plusTerminalVerify')?.value;
    if (plusTerminalVerify === 'F') {
      updateStatus('plusTerminalVerify', plusTerminalVerify, 'OnLine(MajorDeficiency)');
    }
    
    const minusTerminalVerify = this.batteryStringForm.get('minusTerminalVerify')?.value;
    if (minusTerminalVerify === 'F') {
      updateStatus('minusTerminalVerify', minusTerminalVerify, 'OnLine(MajorDeficiency)');
    }
    
    const dcChargingVerify = this.batteryStringForm.get('dcChargingVerify')?.value;
    if (dcChargingVerify === 'F') {
      updateStatus('dcChargingVerify', dcChargingVerify, 'OnLine(MinorDeficiency)');
    }
    
    const acRippleVoltageVerify = this.batteryStringForm.get('acRippleVoltageVerify')?.value;
    if (acRippleVoltageVerify === 'F') {
      updateStatus('acRippleVoltageVerify', acRippleVoltageVerify, 'OnLine(MinorDeficiency)');
    }
    
    const acRippleCurrentVerify = this.batteryStringForm.get('acRippleCurrentVerify')?.value;
    if (acRippleCurrentVerify === 'F') {
      updateStatus('acRippleCurrentVerify', acRippleCurrentVerify, 'OnLine(MinorDeficiency)');
    }
    
    const resistancePf = this.batteryStringForm.get('resistancePf')?.value;
    if (resistancePf === 'F') {
      updateStatus('resistancePf', resistancePf, 'OnLine(MajorDeficiency)');
    }
    
    const torqueVerify = this.batteryStringForm.get('torqueVerify')?.value;
    if (torqueVerify === 'F') {
      updateStatus('torqueVerify', torqueVerify, 'OnLine(MinorDeficiency)');
    }

    // Check Sealed Battery Inspection fields
    const batteryTypeName = this.batteryStringForm.get('batteryTypeName')?.value;
    if (batteryTypeName === 'S') {
      const bulgedPf = this.batteryStringForm.get('bulgedPf')?.value;
      if (bulgedPf === 'F') {
        updateStatus('bulgedPf', bulgedPf, 'CriticalDeficiency');
      }
      
      const crackedPf = this.batteryStringForm.get('crackedPf')?.value;
      if (crackedPf === 'F') {
        updateStatus('crackedPf', crackedPf, 'CriticalDeficiency');
      }
      
      const debrisPf = this.batteryStringForm.get('debrisPf')?.value;
      if (debrisPf === 'F') {
        updateStatus('debrisPf', debrisPf, 'OnLine(MinorDeficiency)');
      }
      
      const rotten = this.batteryStringForm.get('rotten')?.value;
      if (rotten === 'F') {
        updateStatus('rotten', rotten, 'CriticalDeficiency');
      }
      
      const verifySaftey = this.batteryStringForm.get('verifySaftey')?.value;
      if (verifySaftey === 'F') {
        updateStatus('verifySaftey', verifySaftey, 'OnLine(MajorDeficiency)');
      }
      
      const intercellConnector = this.batteryStringForm.get('intercellConnector')?.value;
      if (intercellConnector === 'F') {
        updateStatus('intercellConnector', intercellConnector, 'OnLine(MajorDeficiency)');
      }
    }

    // Check Flooded Battery Inspection fields
    if (batteryTypeName === 'F') {
      const plusWrappedVerify = this.batteryStringForm.get('plusWrappedVerify')?.value;
      if (plusWrappedVerify === 'F') {
        updateStatus('plusWrappedVerify', plusWrappedVerify, 'CriticalDeficiency');
      }
      
      const missingVerify = this.batteryStringForm.get('missingVerify')?.value;
      if (missingVerify === 'F') {
        updateStatus('missingVerify', missingVerify, 'OnLine(MajorDeficiency)');
      }
      
      const waterLevelVerify = this.batteryStringForm.get('waterLevelVerify')?.value;
      if (waterLevelVerify === 'F') {
        updateStatus('waterLevelVerify', waterLevelVerify, 'OnLine(MinorDeficiency)');
      }
    }

    // Check temperature verification
    const roomTempVerify = this.batteryStringForm.get('roomTempVerify')?.value;
    if (roomTempVerify === 'F') {
      updateStatus('roomTempVerify', roomTempVerify, 'OnLine(MinorDeficiency)');
    }
    
    const batteryTempVerify = this.batteryStringForm.get('batteryTempVerify')?.value;
    if (batteryTempVerify === 'F') {
      updateStatus('batteryTempVerify', batteryTempVerify, 'OnLine(MinorDeficiency)');
    }

    // Check rack and fan
    const rackIntegrity = this.batteryStringForm.get('rackIntegrity')?.value;
    if (rackIntegrity === 'F') {
      updateStatus('rackIntegrity', rackIntegrity, 'OnLine(MajorDeficiency)');
    }
    
    const ventFanOperation = this.batteryStringForm.get('ventFanOperation')?.value;
    if (ventFanOperation === 'F') {
      updateStatus('ventFanOperation', ventFanOperation, 'OnLine(MinorDeficiency)');
    }
    
    const battDisconnect = this.batteryStringForm.get('battDisconnect')?.value;
    if (battDisconnect === 'F') {
      updateStatus('battDisconnect', battDisconnect, 'OnLine(MinorDeficiency)');
    }

    console.log('  Failed fields:', failedFields.length > 0 ? failedFields : 'None');
    console.log('  checkFieldLevelDeficiencies - Output status:', resultStatus);

    return resultStatus;
  }

  /**
   * Save battery readings
   */
  /**
   * Main save flow - aligned with legacy SaveData() method
   * Flow:
   * 1. Validate() - Validate all form fields (ONLY for 'Save', NOT for 'SaveAsDraft')
   * 2. BatteryData() - Calculate deficiency and save battery grid
   * 3. SaveUpdateBatteryString() - Save battery string info
   * 4. UpdateBatteryInfo(1) - Update reading type in equipment info
   * 5. SaveUpdateReconciliationInfo() - Save reconciliation
   * 6. GetEquipStatus() - Calculate equipment status (if not Offline)
   * 7. GetReferenceValues() - Reload reference values
   * 8. UpdateEquipStatus() - Update equipment status
   * 9. DisplayBatteryStringInfo() - Reload data
   * 
   * IMPORTANT: SaveAsDraft should NOT validate - allow saving incomplete data
   */
  onSaveBatteryReadings(saveType: 'Save' | 'SaveAsDraft'): void {
    // CRITICAL: Only validate for 'Save', NOT for 'SaveAsDraft'
    // SaveAsDraft allows saving incomplete/partial data for later completion
    if (saveType === 'Save') {
      console.log('🔍 Running validation for Save...');
      if (!this.validate()) {
        console.log('❌ Validation failed, aborting save');
        return;
      }
      console.log('✅ Validation passed');
    } else {
      console.log('⏭️ Skipping validation for SaveAsDraft (allow incomplete data)');
    }

    this.isSaving = true;
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Step 1: Calculate battery deficiency first (async - wait for completion)
      // Then Step 2: Save battery grid data after calculation completes
      this.calculateBatteryDefThenSave(saveType);
      
    } catch (error) {
      this.handleError('Error preparing data for save: ' + error);
      this.isSaving = false;
      this.saving = false;
    }
  }

  /**
   * Calculate battery deficiency then proceed to save
   * This ensures calculation completes before delete/save operations
   */
  private calculateBatteryDefThenSave(saveType: 'Save' | 'SaveAsDraft'): void {
    try {
      const batteryType = this.batteryStringForm.get('batteryType')?.value;
      if (batteryType === 'PS') {
        // Skip calculation for PS type, proceed directly to save
        this.saveBatteryDataStep1(saveType);
        return;
      }

      let monitor2 = 0;
      let replace = 0;
      let monitorlow = 0;
      let replacelow = 0;
      let mhWarning = 0;
      let mhError = 0;

      // Load thresholds from battery type values
      this.batteryService
        .getBatteryTypeValues(
          batteryType,
          this.batteryStringForm.get('batteryTypeName')?.value,
          this.batteryStringForm.get('floatVoltageStatus')?.value,
          this.batteryStringForm.get('floatVoltageValue')?.value || 0
        )
        .subscribe(
          (typeValues) => {
            monitor2 = typeValues.monitorEnd;
            replace = typeValues.replace;

            const readingType = this.batteryStringForm.get('readingType')?.value;
            const midType = this.batteryStringForm.get('midType')?.value;
            const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
            const stringType = this.batteryStringForm.get('stringType')?.value;

            // Calculate thresholds based on reading type
            if (readingType === '2' && midType !== '3') {
              const refValue = this.convertToDecimal(
                this.batteryStringForm.get('refValue')?.value || '0'
              );
              if (midType === '1') {
                mhWarning = (refValue * 70) / 100;
                mhError = (refValue * 60) / 100;
              } else {
                mhWarning = (refValue * 140) / 100;
                mhError = (refValue * 150) / 100;
              }
            } else if (readingType === '1' && midType === '3') {
              monitorlow = 25.6;
              replacelow = 24.0;
            } else if (readingType === '1' && stringType === '3') {
              replace = batteriesNo * replace;
              monitor2 = batteriesNo * monitor2;
            } else if (readingType === '3') {
              const battTypeValue = this.getBatteryTypeValue();
              replace = batteriesNo * battTypeValue + 0.2;
              monitor2 = batteriesNo * battTypeValue + 0.5;
            }

            // Apply calculations to grid rows
            this.applyBatteryDefCalculations(
              monitor2,
              replace,
              monitorlow,
              replacelow,
              mhWarning,
              mhError,
              midType,
              readingType
            );

            // After calculations complete, proceed to save
            this.saveBatteryDataStep1(saveType);
          },
          (error) => {
            console.warn('Error loading battery type values, proceeding with save anyway:', error);
            // Proceed with save even if calculation fails
            this.saveBatteryDataStep1(saveType);
          }
        );
    } catch (error) {
      this.handleError('Error in calculateBatteryDefThenSave: ' + error);
      this.isSaving = false;
      this.saving = false;
    }
  }

  /**
   * Step 1: Save battery grid data (legacy BatteryData method)
   * Flow:
   * 1. Delete existing batteries (legacy: if (BatteryCount > 0) { dl.DeleteBattery(...) })
   * 2. Then insert new battery data (legacy: INSERT INTO Battery)
   * 3. After save completes, save battery string info
   * 
   * Note: Backend DELETE will succeed even if no records exist (no-op)
   */
  private saveBatteryDataStep1(saveType: 'Save' | 'SaveAsDraft'): void {
    // Step 1a: Always delete existing batteries first (legacy: dl.DeleteBattery)
    // Backend DELETE is a no-op if no records exist
    this.batteryService.deleteBattery(this.callNbr, this.equipId, this.batStrId).subscribe(
      () => {
        // After deletion (or no-op), proceed to save new battery data
        this.saveBatteryDataToBackend(saveType);
      },
      (error) => {
        this.handleError('Error deleting existing battery data: ' + error.message);
        this.isSaving = false;
        this.saving = false;
      }
    );
  }

  /**
   * Step 1b: Save new battery data to backend
   * Called after deletion completes
   * Mirrors legacy: INSERT INTO Battery ... SELECT ... UNION ...
   */
  private saveBatteryDataToBackend(saveType: 'Save' | 'SaveAsDraft'): void {
    const batteryDataList: BatteryData[] = this.batteryReadings.map((row) => ({
      callNbr: this.callNbr,
      equipId: this.equipId,
      batteryStringId: this.batStrId,
      batteryId: row.batteryId,
      temp: row.temp,
      vdc: row.vdc,
      mhos: row.mhos, // Keep for backward compatibility
      milliohms: row.mhos, // API expects milliohms field
      strap1: row.strap1,
      strap2: row.strap2,
      spGravity: row.spGravity,
      vac: row.vac,
      cracks: row.cracks,
      replacementNeeded: row.replacementNeeded,
      monitoringBattery: row.monitoringBattery,
      actionPlan: row.actionPlan,
      lastModified: new Date(),
      maintAuthId: this.getUserId(),
    }));

    // Step 1c: Insert new battery data (legacy: INSERT INTO Battery)
    this.batteryService.saveBatteryData(batteryDataList).subscribe(
      () => {
        // CRITICAL: Legacy BatteryData() sets preliminary status AFTER saving grid
        // This happens BEFORE GetEquipStatus() is called
        // Legacy logic:
        // if (ddlStatus.SelectedValue != "Offline")
        // {
        //     if (Majcount > 0 || ReplaceCount > 0) { ddlStatus.SelectedValue = "CriticalDeficiency"; }
        //     else if (Mincount > 0) { ddlStatus.SelectedValue = "OnLine(MinorDeficiency)"; }
        //     else { ddlStatus.SelectedValue = "Online"; }
        // }
        this.setPreliminaryStatusFromGrid();
        
        // Step 2: After battery data is saved and preliminary status set, save battery string info
        this.saveBatteryStringInfo(saveType);
      },
      (error) => {
        this.handleError('Error saving battery data: ' + error.message);
        this.isSaving = false;
        this.saving = false;
      }
    );
  }

  /**
   * Set preliminary status based on battery grid counts
   * Legacy: Done in BatteryData() AFTER saving grid, BEFORE GetEquipStatus()
   * 
   * Counts from grid:
   * - Majcount: Batteries with Cracks = "F" (leaking/damaged/corrosion)
   * - ReplaceCount: Batteries with ReplacementNeeded = "Y"
   * - Mincount: Batteries with MonitoringBattery = "Y"
   * 
   * Status logic:
   * - If Majcount > 0 OR ReplaceCount > 0 → CriticalDeficiency
   * - Else if Mincount > 0 → OnLine(MinorDeficiency)
   * - Else → Online
   */
  private setPreliminaryStatusFromGrid(): void {
    const currentStatus = this.batteryStringForm.get('equipStatus')?.value;
    
    console.log('\n🔍 === setPreliminaryStatusFromGrid START ===');
    console.log('📊 Current Status:', currentStatus);
    
    // Only set preliminary status if current status is NOT Offline
    if (currentStatus !== 'Offline') {
      // Count batteries by condition from grid
      let majCount = 0;      // Leaking/Damaged/Corrosion (Cracks = "F")
      let replaceCount = 0;  // Replacement Needed = "Y"
      let minCount = 0;       // Monitoring = "Y"
      
      this.batteryReadings.forEach(row => {
        if (row.cracks === 'F') {
          majCount++;
        } else if (row.replacementNeeded === 'Y') {
          replaceCount++;
        } else if (row.monitoringBattery === 'Y') {
          minCount++;
        }
      });
      
      console.log('📊 Grid Counts:');
      console.log('   - Majcount (Cracks=F):', majCount);
      console.log('   - ReplaceCount (ReplacementNeeded=Y):', replaceCount);
      console.log('   - Mincount (MonitoringBattery=Y):', minCount);
      
      // Apply legacy status logic
      let preliminaryStatus = currentStatus;
      
      if (majCount > 0 || replaceCount > 0) {
        preliminaryStatus = 'CriticalDeficiency';
        console.log('✅ Setting preliminary status to CriticalDeficiency (Majcount > 0 or ReplaceCount > 0)');
      } else if (minCount > 0) {
        preliminaryStatus = 'OnLine(MinorDeficiency)';
        console.log('✅ Setting preliminary status to OnLine(MinorDeficiency) (Mincount > 0)');
      } else {
        preliminaryStatus = 'Online';
        console.log('✅ Setting preliminary status to Online (all batteries healthy)');
      }
      
      // Update form with preliminary status
      if (preliminaryStatus !== currentStatus) {
        console.log('🔄 Updating status from', currentStatus, 'to', preliminaryStatus);
        this.batteryStringForm.patchValue({ equipStatus: preliminaryStatus });
      } else {
        console.log('ℹ️ Status unchanged:', preliminaryStatus);
      }
    } else {
      console.log('⏭️ Status is Offline, skipping preliminary status calculation');
    }
    
    console.log('=== setPreliminaryStatusFromGrid END ===\n');
  }

  /**
   * Step 2: Save battery string info (legacy SaveUpdateBatteryString method)
   */
  private saveBatteryStringInfo(saveType: 'Save' | 'SaveAsDraft'): void {
    const batteryStringInfo = this.buildBatteryStringInfo();
    batteryStringInfo.saveAsDraft = saveType === 'SaveAsDraft';

    this.batteryService.saveUpdateBatteryStringReadings(batteryStringInfo).subscribe(
      () => {
        const saveMessage = saveType === 'SaveAsDraft' 
          ? 'Battery readings saved as draft successfully!' 
          : 'Battery readings saved successfully!';
        this.successMessage = saveMessage;
        
        // Step 3: Call UpdateBatteryInfo(1) to update ReadingType in equipment info
        // Legacy: UpdateBatteryInfo(1) is called after SaveUpdateBatteryString
        this.updateBatteryInfo(1);
        
        // Note: Don't clear saving flags here - they'll be cleared after reconciliation step
      },
      (error) => {
        this.handleError('Error saving battery string readings: ' + error.message);
        this.isSaving = false;
        this.saving = false;
      }
    );
  }

  /**
   * Update battery info with decoupled API calls
   * Step 1: Call UpdateBatteryInfo API to update database
   * Step 2: Call GetEquipmentInfo API to fetch updated data
   * Step 3: Update form with fetched equipment info
   * 
   * This decouples the two API calls for better separation of concerns
   */
  private updateBatteryInfo(i: number, batteryData?: any): void {
    // Step 1: Call UpdateBatteryInfo API
    this.batteryService.updateBatteryInfo(
      this.callNbr,
      this.equipId,
      this.batStrId,
      i,
      batteryData
    ).subscribe(
      (response) => {
        // After update completes, fetch fresh equipment info
        this.fetchAndUpdateEquipmentInfo(i);
      },
      (error) => {
        this.handleError(`Error updating battery info (i=${i}): ${error.message}`);
      }
    );
  }

  /**
   * Step 2: Fetch equipment info separately using GetEquipmentInfo API
   * Then update form and perform post-update actions based on operation type
   */
  private fetchAndUpdateEquipmentInfo(i: number): void {
    // Step 2: Call GetEquipmentInfo API
    this.batteryService.getEquipmentInfo(this.callNbr, this.equipId).subscribe(
      (equipmentInfo) => {
        // Step 3: Update form fields with fresh equipment data
        if (equipmentInfo) {
          this.updateFormWithEquipmentInfo(equipmentInfo);
        }

        // Handle post-update actions based on operation type
        if (i === 1) {
          // i=1: ReadingType updated - proceed to next step (reconciliation)
          this.saving = false;
          this.isSaving = false;
          this.saveReconciliationInfoStep();
        } else {
          console.log(`UpdateBatteryInfo(${i}) completed and equipment info refreshed`);
        }
      },
      (error) => {
        this.handleError(`Error fetching equipment info after update (i=${i}): ${error.message}`);
      }
    );
  }

  /**
   * Update form fields with equipment info returned from backend
   * Called after UpdateBatteryInfo(2) when batteries per string/pack are updated
   */
  private updateFormWithEquipmentInfo(equipmentInfo: any): void {
    try {
      // Helper function to safely get value from API response (handles both camelCase and PascalCase)
      const getValue = (obj: any, ...keys: string[]): any => {
        for (const key of keys) {
          if (obj && obj[key] !== undefined) {
            return obj[key];
          }
        }
        return '';
      };

      // Update form controls with equipment data - mirrors legacy GetEquipInfo logic
      const updates: { [key: string]: any } = {};

      // Battery Housing (from ds.Tables[1])
      const batteryHousing = getValue(equipmentInfo, 'batteryHousing', 'BatteryHousing');
      if (batteryHousing && batteryHousing !== 'PS') {
        updates['batteryHousing'] = batteryHousing;
      }

      // Battery Type (from ds.Tables[1])
      const batteryType = getValue(equipmentInfo, 'batteryType', 'BatteryType');
      if (batteryType && batteryType !== 'PS') {
        updates['batteryType'] = batteryType;
      }

      // Float Voltage Status (from ds.Tables[1])
      const floatVoltS = getValue(equipmentInfo, 'floatVoltS', 'FloatVoltS');
      if (floatVoltS && floatVoltS !== 'PS') {
        updates['floatVoltageStatus'] = floatVoltS;
      }

      // Float Voltage Value (from ds.Tables[1])
      const floatVoltV = getValue(equipmentInfo, 'floatVoltV', 'FloatVoltV');
      if (floatVoltV && floatVoltV !== 'PS') {
        updates['floatVoltageValue'] = floatVoltV;
      }

      // Serial Number (from ds.Tables[0])
      const serialId = getValue(equipmentInfo, 'serialNo', 'SerialID', 'SerialNo');
      if (serialId) {
        updates['serialNo'] = serialId.toString().trim();
      }

      // Location (from ds.Tables[0])
      const location = getValue(equipmentInfo, 'location', 'Location');
      if (location) {
        updates['location'] = location.toString().trim();
      }

      // Model Number (from ds.Tables[0])
      const version = getValue(equipmentInfo, 'modelNo', 'Version', 'version');
      if (version) {
        updates['modelNo'] = version.toString().trim();
      }

      // Batteries Per String/Pack (from ds.Tables[0])
      // Logic mirrors legacy: if StringType=3 or 2, use BatteriesPerPack, else use BatteriesPerString
      const stringType = this.batteryStringForm.get('stringType')?.value;
      let batteriesNo: any = '';
      
      if (stringType === '3' || stringType === '2') {
        batteriesNo = getValue(equipmentInfo, 'batteriesPerPack', 'BatteriesPerPack');
      } else {
        batteriesNo = getValue(equipmentInfo, 'batteriesPerString', 'BatteriesPerString');
      }
      
      if (batteriesNo) {
        updates['batteriesNo'] = batteriesNo.toString();
      }

      // Start Date (from ds.Tables[0]) - EquipYear and EquipMonth
      const equipYear = getValue(equipmentInfo, 'equipYear', 'EquipYear');
      const equipMonth = getValue(equipmentInfo, 'equipMonth', 'EquipMonth');
      if (equipYear && equipMonth && parseInt(equipYear) > 0 && equipMonth !== '') {
        const date = new Date(parseInt(equipYear), this.getMonthNumber(equipMonth) - 1, 1);
        updates['startDate'] = date;
      }

      // Vendor/Manufacturer (from ds.Tables[0])
      const vendorId = getValue(equipmentInfo, 'vendorId', 'VendorId', 'manufacturerId');
      if (vendorId && vendorId !== '') {
        updates['manufacturer'] = vendorId.toString().trim();
      }

      // Patch all updates at once
      if (Object.keys(updates).length > 0) {
        this.batteryStringForm.patchValue(updates);
      }
    } catch (error) {
      console.error('Error updating form with equipment info:', error);
    }
  }

  /**
   * Convert month name to number (1-12)
   */
  private getMonthNumber(monthName: string): number {
    const months: { [key: string]: number } = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12,
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
      'jun': 6, 'jul': 7, 'aug': 8,
      'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
    };
    return months[(monthName || '').toLowerCase()] || 0;
  }

  /**
   * Step 4: Save reconciliation info (legacy SaveUpdateReconciliationInfo method)
   */
  private saveReconciliationInfoStep(): void {
    if (this.reconciliationInfo) {
      const reconInfo = this.buildReconciliationInfo();
      this.batteryService.saveUpdateEquipReconciliationInfo(reconInfo).subscribe(
        () => {
          // Step 5: Calculate status if not Offline (legacy GetEquipStatus)
          this.calculateAndUpdateStatus();
        },
        (error) => {
          this.handleError('Error saving reconciliation info: ' + error.message);
          this.isSaving = false;
          this.saving = false;
        }
      );
    } else {
      // Step 5: Calculate status if not Offline
      this.calculateAndUpdateStatus();
    }
  }

  /**
   * Step 5 & 6: Calculate status and reload reference values (legacy GetEquipStatus & GetReferenceValues)
   * IMPORTANT: Legacy logic - only calculate status if current status is NOT "Offline"
   * 
   * CRITICAL FIX: Must recalculate battery deficiencies BEFORE checking equipment status
   * Legacy flow: The usedQuantity field is used by GetEquipStatus, but it can be:
   * 1. Auto-calculated from grid when user clicks "Change" button
   * 2. Manually entered by user
   * 3. Updated from battery grid data before status check
   * 
   * We need to ensure usedQuantity reflects the actual battery grid state before status check
   */
  private calculateAndUpdateStatus(): void {
    const currentStatus = this.batteryStringForm.get('equipStatus')?.value;
    const repMonCalculate = this.batteryStringForm.get('repMonCalculate')?.value;
    
    console.log('\n==== calculateAndUpdateStatus START ====');
    console.log('📊 Current Status before calculation:', currentStatus);
    console.log('📊 RepMonCalculate mode:', repMonCalculate);
    
    // CRITICAL: If RepMonCalculate = "1" (System), recalculate battery deficiencies from grid
    // This ensures usedQuantity reflects actual battery grid state before status check
    // Legacy: CalculateBatteryDef() updates txtUsedQuantity based on battery readings
    if (repMonCalculate === '1') {
      console.log('⚙️ RepMonCalculate = "1" (System), calling calculateBatteryDefSync()...');
      this.calculateBatteryDefSync(() => {
        // After battery def calculation completes, proceed with status check
        this.proceedWithStatusCalculation(currentStatus);
      });
    } else {
      console.log('✋ RepMonCalculate = "2" (Manual), skipping auto-calculation');
      console.log('📝 Using manually entered usedQuantity:', this.batteryStringForm.get('usedQuantity')?.value);
      // If manual mode, proceed directly with status check using manually entered values
      this.proceedWithStatusCalculation(currentStatus);
    }
  }

  /**
   * Proceed with status calculation after battery deficiency calculation completes
   */
  private proceedWithStatusCalculation(currentStatus: string): void {
    console.log('\n🔄 Proceeding with status calculation...');
    console.log('📊 Final usedQuantity value:', this.batteryStringForm.get('usedQuantity')?.value);
    console.log('📊 Final monitored value:', this.batteryStringForm.get('monitored')?.value);
    
    // Step 5: Calculate equipment status (legacy GetEquipStatus logic)
    // Legacy: if (ddlStatus.SelectedValue != "Offline") { ddlStatus.SelectedValue = GetEquipStatus(); }
    let newStatus = currentStatus;
    
    if (currentStatus !== 'Offline') {
      console.log('✅ Status is NOT Offline, calling getEquipmentStatus()...');
      newStatus = this.getEquipmentStatus();
      console.log('🎯 New status from getEquipmentStatus():', newStatus);
    } else {
      console.log('⏭️ Status IS Offline, skipping getEquipmentStatus()');
    }
    
    // Step 6: Reload reference values (legacy GetReferenceValues)
    this.loadReferenceValues();
    
    // Step 7: Update equipment status
    console.log('💾 Calling updateEquipmentStatusFinal with status:', newStatus);
    console.log('==== calculateAndUpdateStatus END ====\n');
    this.updateEquipmentStatusFinal(newStatus);
  }

  /**
   * Step 7: Update equipment status (legacy UpdateEquipStatus method)
   */
  private updateEquipmentStatusFinal(newStatus: string): void {
    console.log('==== updateEquipmentStatusFinal START ====');
    console.log('Status to update:', newStatus);
    
    // Legacy DateCode handling from SaveData:
    // DateTime DtDateCode = Convert.ToDateTime(txtStartDt.Text);
    // UES.MonthName = DateTimeFormatInfo.CurrentInfo.GetMonthName(DtDateCode.Month);
    // UES.Year = DtDateCode.Year;
    let startDate = this.batteryStringForm.get('startDate')?.value;
    
    // If startDate is empty, default to 01/01/1900
    if (!startDate || startDate === '') {
      startDate = '1900-01-01';
      console.log('⚠️ DateCode is empty for status update, defaulting to 1900-01-01');
    }
    
    const statusInfo: UpdateEquipStatus = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      status: newStatus,
      statusNotes: this.batteryStringForm.get('commentsUsed')?.value || '',
      tableName: 'BatteryString',
      manufacturer: this.batteryStringForm.get('manufacturer')?.value || '',
      modelNo: this.batteryStringForm.get('modelNo')?.value || '',
      serialNo: this.batteryStringForm.get('serialNo')?.value || '',
      location: this.batteryStringForm.get('location')?.value || '',
      monthName: this.getMonthFromDate(startDate),
      year: this.getYearFromDate(startDate),
      readingType: this.batteryStringForm.get('readingType')?.value || '',
      vfSelection: this.batteryStringForm.get('floatVoltageStatus')?.value || '',
      // CRITICAL: Swap values for Type 2/3 when sending to API
      // Display: batteriesNo=5, packNo=3
      // API expects: batteriesPerString=3, batteriesPerPack=5
      batteriesPerString: this.getApiBatteriesPerString(),
      batteriesPerPack: this.getApiBatteriesPerPack(),
      // Required fields for API validation
      Notes: this.batteryStringForm.get('commentsUsed')?.value || '',
      MaintAuthID: this.getUserId(),
    };

    console.log('UpdateEquipStatus payload:', statusInfo);
    console.log('   MonthName:', statusInfo.monthName);
    console.log('   Year:', statusInfo.year);

    this.batteryService.updateEquipStatus(statusInfo).subscribe(
      () => {
        console.log('updateEquipStatus API call successful');
        console.log('==== updateEquipmentStatusFinal END ====');
        this.toastr.success(this.successMessage || 'Battery readings saved successfully!');
        this.isSaving = false;
        this.saving = false;
        
        // Step 8: Reload data (legacy DisplayBatteryStringInfo)
        this.loadBatteryStringInfo();
      },
      (error) => {
        console.error('updateEquipStatus API call failed:', error);
        console.log('==== updateEquipmentStatusFinal END (with error) ====');
        this.handleError('Error updating equipment status: ' + error.message);
        this.isSaving = false;
        this.saving = false;
      }
    );
  }

  /**
   * Wrapper method for the Save button in header
   */
  saveBatteryReadings(): void {
    this.onSaveBatteryReadings('Save');
  }

  saveAsDraft(): void {
    this.onSaveBatteryReadings('SaveAsDraft');
  }

  /**
   * Handle Change button click
   * Legacy implementation: cmdChange_Click
   * 1. SaveUpdateBatteryString("Save As Draft")
   * 2. UpdateBatteryInfo(2)
   * 3. DisplayBatteryInfo()
   * 4. DisplayBatteryStringInfo()
   */
  onChange(): void {
    // Validate packNo for stringType 2 and 3 (legacy: OnclickChange validation)
    const stringType = this.batteryStringForm.get('stringType')?.value;
    const packNo = parseInt(this.batteryStringForm.get('packNo')?.value) || 0;

    if (stringType === '3') {
      if (packNo <= 0) {
        this.toastr.error('You must provide the No of Battery Packs');
        return;
      }
    } else if (stringType === '2') {
      if (packNo <= 0) {
        this.toastr.error('You must provide the No of Internal Strings');
        return;
      }
    }

    this.saving = true;
    
    // Step 1: Save battery string as draft (legacy: SaveUpdateBatteryString)
    const batteryStringInfo = this.buildBatteryStringInfo();
    batteryStringInfo.saveAsDraft = true;

    this.batteryService.saveUpdateBatteryStringReadings(batteryStringInfo).subscribe(
      () => {
        // Step 2: Update equipment batteries (legacy: UpdateBatteryInfo(2))
        // CRITICAL: Swap values for Type 2/3 when sending to API
        const batteryData = {
          readingType: this.batteryStringForm.get('readingType')?.value || '',
          batteriesPerString: this.getApiBatteriesPerString(),
          batteriesPerPack: this.getApiBatteriesPerPack(),
          stringType: this.batteryStringForm.get('stringType')?.value || '',
        };

        this.updateBatteryInfoForChange(batteryData);
      },
      (error) => {
        this.handleError('Error saving battery string for change: ' + error.message);
        this.saving = false;
      }
    );
  }

  /**
   * UpdateBatteryInfo(2) for Change button - simpler flow without full save cascade
   */
  private updateBatteryInfoForChange(batteryData: any): void {
    this.batteryService.updateBatteryInfo(
      this.callNbr,
      this.equipId,
      this.batStrId,
      2,
      batteryData
    ).subscribe(
      (response) => {
        // After successful update, calculate new URL parameters and reload page
        const newUrlParams = this.calculateUrlParameters();
        this.updateUrlAndReload(newUrlParams);
      },
      (error) => {
        this.handleError(`Error updating battery info: ${error.message}`);
        this.saving = false;
      }
    );
  }

  /**
   * Calculate BattNum and BattPack URL parameters based on current form values
   * Type 1: BattNum = batteriesNo, BattPack = packNo
   * Type 2: BattNum = packNo, BattPack = batteriesNo
   * Type 3: BattNum = packNo, BattPack = batteriesNo
   */
  private calculateUrlParameters(): { BattNum: string; BattPack: string } {
    const stringType = this.batteryStringForm.get('stringType')?.value || '';
    const batteriesNo = this.batteryStringForm.get('batteriesNo')?.value || '';
    const packNo = this.batteryStringForm.get('packNo')?.value || '';

    let battNum: string;
    let battPack: string;

    if (stringType === '1') {
      // Type 1: BattNum from batteriesNo, BattPack from packNo
      battNum = batteriesNo;
      battPack = packNo || '';
      console.log('🔄 [URL CALC] Type 1: BattNum=' + battNum + ' (from batteriesNo), BattPack=' + battPack + ' (from packNo)');
    } else if (stringType === '2' || stringType === '3') {
      // Type 2 & 3: BattNum from packNo, BattPack from batteriesNo
      battNum = packNo;
      battPack = batteriesNo;
      console.log('🔄 [URL CALC] Type ' + stringType + ': BattNum=' + battNum + ' (from packNo), BattPack=' + battPack + ' (from batteriesNo)');
    } else {
      // Fallback
      battNum = batteriesNo;
      battPack = packNo || '';
      console.log('🔄 [URL CALC] Unknown type, using default: BattNum=' + battNum + ', BattPack=' + battPack);
    }

    return { BattNum: battNum, BattPack: battPack };
  }

  /**
   * Update URL parameters and reload the page
   */
  private updateUrlAndReload(params: { BattNum: string; BattPack: string }): void {
    console.log('🔄 [URL UPDATE] Updating URL with BattNum=' + params.BattNum + ', BattPack=' + params.BattPack);
    
    // Build new query parameters
    const queryParams = {
      CallNbr: this.callNbr,
      EquipId: this.equipId.toString(),
      EquipNo: encodeURIComponent(this.batStrId),
      Tech: this.techId,
      TechName: this.techName,
      ReadingType: this.readingType,
      BattNum: params.BattNum,
      BattPack: params.BattPack
    };

    // Navigate to same route with updated query parameters
    // This will reload the page with new parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    }).then(() => {
      // Reload the page to apply new parameters
      window.location.reload();
    });
  }

  /**
   * Build battery string info for saving
   */
  private buildBatteryStringInfo(): BatteryStringInfo {
    // Legacy DateCode handling from SaveUpdateBatteryString:
    // if (txtStartDt.Text == "") { txtStartDt.Text = "01/01/1900"; }
    let startDate = this.batteryStringForm.get('startDate')?.value;
    
    // If startDate is empty or invalid, default to 01/01/1900
    if (!startDate || startDate === '') {
      startDate = '1900-01-01'; // Default date in YYYY-MM-DD format
      console.log('⚠️ DateCode is empty, defaulting to 1900-01-01');
    }
    
    // Validate the date
    const dtDateCode = new Date(startDate);
    if (isNaN(dtDateCode.getTime())) {
      console.error('❌ Invalid DateCode:', startDate);
      // If invalid, still default to 1900-01-01 for backward compatibility
      startDate = '1900-01-01';
    }
    
    // Check if date is in the future (this should be caught by validate(), but double-check)
    const today = new Date();
    if (dtDateCode > today) {
      console.error('❌ DateCode is in the future:', startDate);
      // This will be caught by validate(), but we log it here
    }
    
    console.log('📅 DateCode processing:');
    console.log('   Input:', startDate);
    console.log('   Month:', this.getMonthFromDate(startDate));
    console.log('   Year:', this.getYearFromDate(startDate));
    
    // Step 1: Get battery voltage validation using getBatteryFloatVoltage (legacy flow)
    const batteryVoltage = this.convertToDouble(this.batteryStringForm.get('totalBatteryVoltage')?.value) || 0;
    const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
    const stringType = this.batteryStringForm.get('stringType')?.value || '';
    
    let batVoltagePf = this.batteryStringForm.get('batteryVoltageVerify')?.value || '';
    
    // Step 2: Call getBatteryFloatVoltage and validate battery voltage (legacy SaveUpdateBatteryString logic)
    // Use getApiBatteriesPerString() for voltage calculation (gets swapped value for Type 2/3)
    if (batteryVoltage > 0 && stringType !== '3') {
      const voltageRange = this.getBatteryFloatVoltage();
      const apiBatteriesPerString = this.getApiBatteriesPerString();
      const minVoltForString = voltageRange.lowVolt * apiBatteriesPerString;
      const maxVoltForString = voltageRange.maxVolt * apiBatteriesPerString;
      
      // If voltage is within acceptable range, set to Pass
      if (batteryVoltage >= minVoltForString && batteryVoltage <= maxVoltForString) {
        batVoltagePf = 'P';
      } else {
        // Keep the user's selected value if voltage is outside range
        batVoltagePf = this.batteryStringForm.get('batteryVoltageVerify')?.value || '';
      }
    }

    return {
      batStrId: this.batStrId,
      callNbr: this.callNbr,
      equipId: this.equipId,
      manufacturer: this.batteryStringForm.get('manufacturer')?.value || '',
      batteryHousing: this.batteryStringForm.get('batteryHousing')?.value || '',
      modelNo: this.batteryStringForm.get('modelNo')?.value || '',
      serialNo: this.batteryStringForm.get('serialNo')?.value || '',
      location: this.batteryStringForm.get('location')?.value || '',
      batteryType: this.batteryStringForm.get('batteryType')?.value || '',
      batteryTypeName: this.batteryStringForm.get('batteryTypeName')?.value || '',
      equipStatus: this.getEquipmentStatus(),
      monthName: this.getMonthFromDate(startDate),
      year: this.getYearFromDate(startDate),
      commentsUsed: this.batteryStringForm.get('commentsUsed')?.value || '',
      bulgedCheck: this.batteryStringForm.get('bulgedCheck')?.value || false,
      bulgedPf: this.batteryStringForm.get('bulgedPf')?.value || '',
      crackedCheck: this.batteryStringForm.get('crackedCheck')?.value || false,
      crackedPf: this.batteryStringForm.get('crackedPf')?.value || '',
      debrisCheck: this.batteryStringForm.get('debrisCheck')?.value || false,
      debrisPf: this.batteryStringForm.get('debrisPf')?.value || '',
      rotten: this.batteryStringForm.get('rotten')?.value || '',
      verifySaftey: this.batteryStringForm.get('verifySaftey')?.value || '',
      containerComments: this.batteryStringForm.get('containerComments')?.value || '',
      environmentComments: this.batteryStringForm.get('environmentComments')?.value || '',
      batVoltage: batteryVoltage,
      plusTerminal: this.convertToDouble(this.batteryStringForm.get('plusTerminalToGnd')?.value) || 0,
      minusTerminal: this.convertToDouble(this.batteryStringForm.get('minusTerminalToGnd')?.value) || 0,
      dcCharging: this.convertToDouble(this.batteryStringForm.get('dcChargeCurrent')?.value) || 0,
      acRipple: this.convertToDouble(this.batteryStringForm.get('acRippleVoltage')?.value) || 0,
      acRippleCurrent: this.convertToDouble(this.batteryStringForm.get('acRippleCurrent')?.value) || 0,
      batVoltatePf: batVoltagePf,
      plusTerminalPf: this.batteryStringForm.get('plusTerminalVerify')?.value || '',
      minusTerminalPf: this.batteryStringForm.get('minusTerminalVerify')?.value || '',
      dcChargingPf: this.batteryStringForm.get('dcChargingVerify')?.value || '',
      acRipplePf: this.batteryStringForm.get('acRippleVoltageVerify')?.value || '',
      acRippleCurrentPf: this.batteryStringForm.get('acRippleCurrentVerify')?.value || '',
      resistancePf: this.batteryStringForm.get('resistancePf')?.value || '',
      codeTorquePf: this.batteryStringForm.get('torqueVerify')?.value || '',
      comment: this.batteryStringForm.get('chargingComments')?.value || '',
      plusWrappedPf: this.batteryStringForm.get('plusWrappedVerify')?.value || '',
      plusWrappedCheck: this.batteryStringForm.get('plusWrappedCheck')?.value || false,
      plusSulfatedCheck: this.batteryStringForm.get('plusSulfatedCheck')?.value || false,
      plusMisPosCheck: this.batteryStringForm.get('plusMisposCheck')?.value || false,
      missingCheck: this.batteryStringForm.get('missingCheck')?.value || false,
      missingPf: this.batteryStringForm.get('missingVerify')?.value || '',
      brokenCheck: this.batteryStringForm.get('brokenCheck')?.value || false,
      needsCleaningCheck: this.batteryStringForm.get('needsCleaningCheck')?.value || false,
      platesComments: this.batteryStringForm.get('platesComments')?.value || '',
      waterLevelV: this.batteryStringForm.get('waterLevel')?.value || '',
      waterLevelPf: this.batteryStringForm.get('waterLevelVerify')?.value || '',
      readingType: this.batteryStringForm.get('readingType')?.value || '',
      stringType: stringType,
      electrolytesComments: this.batteryStringForm.get('electrolytesComments')?.value || '',
      batteryTempPf: this.batteryStringForm.get('roomTempVerify')?.value || '',
      roomTemp: parseInt(this.batteryStringForm.get('roomTemp')?.value) || 70,
      battTemp: parseInt(this.batteryStringForm.get('batteryTemp')?.value) || 0,
      battTempPf: this.batteryStringForm.get('batteryTempVerify')?.value || '',
      quantityUsed: parseInt(this.batteryStringForm.get('usedQuantity')?.value) || 0,
      quantityNeeded: parseInt(this.batteryStringForm.get('monitored')?.value) || 0,
      reasonReplace: this.batteryStringForm.get('reasonToReplace')?.value || '',
      floatVoltS: this.batteryStringForm.get('floatVoltageStatus')?.value || '',
      floatVoltV: this.batteryStringForm.get('floatVoltageValue')?.value || '',
      intercellConnector: this.batteryStringForm.get('intercellConnector')?.value || '',
      replaceWholeString: this.batteryStringForm.get('replaceWholeString')?.value || false,
      chckmVac: this.batteryStringForm.get('mvacCheck')?.value || false,
      chkStrap: this.batteryStringForm.get('strapCheck')?.value || false,
      maintAuthId: this.getUserId(),
      repMonCalc: this.batteryStringForm.get('repMonCalculate')?.value || '',
      // CRITICAL: Swap values for Type 2/3 when sending to API
      batteryPackCount: this.getApiBatteriesPerPack(),
      indBattDisconnect: this.batteryStringForm.get('battDisconnect')?.value || '',
      indBattInterConn: this.batteryStringForm.get('indBattInterconnection')?.value || '',
      rackIntegrity: this.batteryStringForm.get('rackIntegrity')?.value || '',
      ventFanOperation: this.batteryStringForm.get('ventFanOperation')?.value || '',
      ddlBattTerminal: this.batteryStringForm.get('battTerminal')?.value || '',
      ddlBattTypeTerminal: this.batteryStringForm.get('battTerminalType')?.value || '',
      txtBattTerminal: this.batteryStringForm.get('battTerminalValue')?.value || '',
      readingMethod: this.batteryStringForm.get('midType')?.value || '',
      chkGraph: this.batteryStringForm.get('readingsGraphCheck')?.value || false,
      saveAsDraft: false,
      
      // Additional fields required by backend API - try to get from form if available
      message: this.batteryStringForm.get('message')?.value || '',
      code: this.batteryStringForm.get('code')?.value || null,
      resistance: this.convertToDouble(this.batteryStringForm.get('resistance')?.value) || null,
      codeTorque: this.convertToDouble(this.batteryStringForm.get('codeTorque')?.value) || null,
      negWrappedCheck: this.batteryStringForm.get('negWrappedCheck')?.value || null,
      negWrappedPf: this.batteryStringForm.get('negWrappedPf')?.value || '',
      negSulfatedCheck: this.batteryStringForm.get('negSulfatedCheck')?.value || null,
      negMisPosCheck: this.batteryStringForm.get('negMisPosCheck')?.value || null,
      bothActMatPf: this.batteryStringForm.get('bothActMatPf')?.value || '',
      bothActMatCheck: this.batteryStringForm.get('bothActMatCheck')?.value || null,
      actPosMatCheck: this.batteryStringForm.get('actPosMatCheck')?.value || null,
      otherCheck: this.batteryStringForm.get('otherCheck')?.value || null,
      sedimentsComments: this.batteryStringForm.get('sedimentsComments')?.value || '',
      missingCoversCheck: this.batteryStringForm.get('missingCoversCheck')?.value || null,
      missingCoversPf: this.batteryStringForm.get('missingCoversPf')?.value || '',
      brokenCoversCheck: this.batteryStringForm.get('brokenCoversCheck')?.value || null,
      needsCleaningCoversCheck: this.batteryStringForm.get('needsCleaningCoversCheck')?.value || null,
      missingSepCheck: this.batteryStringForm.get('missingSepCheck')?.value || null,
      missingSepPf: this.batteryStringForm.get('missingSepPf')?.value || '',
      quartBelowCheck: this.batteryStringForm.get('quartBelowCheck')?.value || null,
      quartBelowPf: this.batteryStringForm.get('quartBelowPf')?.value || '',
      halfBelowCheck: this.batteryStringForm.get('halfBelowCheck')?.value || null,
      halfBelowPf: this.batteryStringForm.get('halfBelowPf')?.value || '',
      thrbyFourBelowCheck: this.batteryStringForm.get('thrbyFourBelowCheck')?.value || null,
      thrbyFourBelowPf: this.batteryStringForm.get('thrbyFourBelowPf')?.value || '',
      waterFillYn: this.batteryStringForm.get('waterFillYn')?.value || '',
      sepComments: this.batteryStringForm.get('sepComments')?.value || '',
      immedActionOpen: this.batteryStringForm.get('immedActionOpen')?.value || '',
      upgradeNoOpenAge: this.batteryStringForm.get('upgradeNoOpenAge')?.value || '',
      upgradeNoOpen: this.batteryStringForm.get('upgradeNoOpen')?.value || '',
      positivePost: this.batteryStringForm.get('positivePost')?.value || '',
      negativePost: this.batteryStringForm.get('negativePost')?.value || '',
      postSeals: this.batteryStringForm.get('postSeals')?.value || '',
      batteryDisc: this.batteryStringForm.get('batteryDisc')?.value || '',
      miscHardware: this.batteryStringForm.get('miscHardware')?.value || '',
      sealsComments: this.batteryStringForm.get('sealsComments')?.value || '',
      hardwareComments: this.batteryStringForm.get('hardwareComments')?.value || '',
      manufDatePf: this.batteryStringForm.get('manufDatePf')?.value || '',
      manufDate: this.batteryStringForm.get('manufDate')?.value || '',
      battProActiveReplace: this.batteryStringForm.get('battProActiveReplace')?.value || '',
    };
  }

  /**
   * Build reconciliation info for saving
   */
  private buildReconciliationInfo(): EquipReconciliationInfo {
    return {
      callNbr: this.callNbr,
      equipId: this.equipId,
      make: this.reconciliationForm.get('recMake')?.value || '',
      makeCorrect: this.reconciliationForm.get('recMakeCorrect')?.value || '',
      actMake: this.reconciliationForm.get('actMake')?.value || '',
      model: this.reconciliationForm.get('recModel')?.value || '',
      modelCorrect: this.reconciliationForm.get('recModelCorrect')?.value || '',
      actModel: this.reconciliationForm.get('actModel')?.value || '',
      serialNo: this.reconciliationForm.get('recSerialNo')?.value || '',
      serialNoCorrect: this.reconciliationForm.get('recSerialNoCorrect')?.value || '',
      actSerialNo: this.reconciliationForm.get('actSerialNo')?.value || '',
      ascStringsNo: parseInt(this.reconciliationForm.get('ascStrings')?.value) || 0,
      ascStringsCorrect: this.reconciliationForm.get('ascStringsCorrect')?.value || '',
      actAscStringNo: parseInt(this.reconciliationForm.get('actAscStrings')?.value) || 0,
      battPerString: parseInt(this.reconciliationForm.get('battPerString')?.value) || 0,
      battPerStringCorrect: this.reconciliationForm.get('battPerStringCorrect')?.value || '',
      actBattPerString: parseInt(this.reconciliationForm.get('actBattPerString')?.value) || 0,
      totalEquips: 0,
      totalEquipsCorrect: '',
      actTotalEquips: 0,
      kva: '',
      kvaCorrect: '',
      actKva: '',
      verified: this.reconciliationForm.get('reconciled')?.value || false,
      modifiedBy: this.getUserId(),
    };
  }

  /**
   * Get API batteries per string value - maps display fields to API
   * 
   * LEGACY BEHAVIOR (BattNum=2, BattPack=5):
   * Type 1: batteriesPerString = 2 (from BattNum)
   * Type 2: batteriesPerString = 2 (from BattNum, which is in packNo field)
   * Type 3: batteriesPerString = 2 (from BattNum, which is in packNo field)
   */
  private getApiBatteriesPerString(): number {
    const stringType = this.batteryStringForm.get('stringType')?.value || '';
    const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
    const packNo = parseInt(this.batteryStringForm.get('packNo')?.value) || 0;
    
    if (stringType === '3') {
      // For Type 3: packNo field (labeled "Batteries per Pack") → batteriesPerString
      // This matches legacy: BattNum → batteriesPerString
      console.log('✅ getApiBatteriesPerString (Type 3): packNo field=' + packNo + ' → API batteriesPerString=' + packNo);
      return packNo;
    } else if (stringType === '2') {
      // For Type 2: packNo field (labeled "Batteries per String") → batteriesPerString
      // This matches legacy: BattNum → batteriesPerString
      console.log('✅ getApiBatteriesPerString (Type 2): packNo field=' + packNo + ' → API batteriesPerString=' + packNo);
      return packNo;
    } else {
      // For Type 1: batteriesNo field (labeled "No of Batteries per string") → batteriesPerString
      // This matches legacy: BattNum → batteriesPerString
      console.log('✅ getApiBatteriesPerString (Type 1): batteriesNo field=' + batteriesNo + ' → API batteriesPerString=' + batteriesNo);
      return batteriesNo;
    }
  }

  /**
   * Get API batteries per pack value - maps display fields to API
   * 
   * LEGACY BEHAVIOR (BattNum=2, BattPack=5):
   * Type 1: batteriesPerPack = 5 (from BattPack, which is in packNo field from DB)
   * Type 2: batteriesPerPack = 5 (from BattPack, which is in batteriesNo field)
   * Type 3: batteriesPerPack = 5 (from BattPack, which is in batteriesNo field)
   */
  private getApiBatteriesPerPack(): number {
    const stringType = this.batteryStringForm.get('stringType')?.value || '';
    const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
    const packNo = parseInt(this.batteryStringForm.get('packNo')?.value) || 0;
    
    if (stringType === '3') {
      // For Type 3: batteriesNo field (labeled "No of Battery Packs") → batteriesPerPack
      // This matches legacy: BattPack → batteriesPerPack
      console.log('✅ getApiBatteriesPerPack (Type 3): batteriesNo field=' + batteriesNo + ' → API batteriesPerPack=' + batteriesNo);
      return batteriesNo;
    } else if (stringType === '2') {
      // For Type 2: batteriesNo field (labeled "No of Internal Strings") → batteriesPerPack
      // This matches legacy: BattPack → batteriesPerPack
      console.log('✅ getApiBatteriesPerPack (Type 2): batteriesNo field=' + batteriesNo + ' → API batteriesPerPack=' + batteriesNo);
      return batteriesNo;
    } else {
      // For Type 1: packNo field (hidden but may have value) → batteriesPerPack
      // This matches legacy: BattPack from DB
      console.log('✅ getApiBatteriesPerPack (Type 1): packNo field=' + packNo + ' → API batteriesPerPack=' + packNo);
      return packNo;
    }
  }

  /**
   * Navigate back to equipment details
   */
  goBack(): void {
    this.router.navigate(['/equipment/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId,
        TechName: this.techName,
      },
    });
  }

  /**
   * Utility helper functions
   */
  private convertToDecimal(value: string | number): number {
    try {
      return typeof value === 'string' ? parseFloat(value) : value;
    } catch {
      return 0;
    }
  }

  private convertToDouble(value: string | number): number {
    try {
      return typeof value === 'string' ? parseFloat(value) : value;
    } catch {
      return 0.0;
    }
  }

  private isValidDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  private getFormattedDate(month: string, year: number): string {
    if (!month || !year) return '';
    const map: { [k: string]: string } = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', sept: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12',
    };
    let monthNum = '';
    const m = (month || '').toString().trim();
    const ml = m.toLowerCase();
    if (map[ml]) {
      monthNum = map[ml];
    } else if (/^\d{1,2}$/.test(m)) {
      const n = Math.max(1, Math.min(12, parseInt(m, 10)));
      monthNum = n < 10 ? `0${n}` : `${n}`;
    } else {
      // Fallback to 01 if unrecognized
      monthNum = '01';
    }
    return `${year}-${monthNum}-01`; // YYYY-MM-DD format for HTML date input
  }

  private getMonthFromDate(dateString: string): string {
    try {
      // Handle empty or invalid dates - default to January (legacy: 01/01/1900)
      if (!dateString || dateString === '') {
        dateString = '1900-01-01';
      }
      
      const date = new Date(dateString);
      
      // If date is invalid, default to January
      if (isNaN(date.getTime())) {
        return 'January';
      }
      
      // Use UTC methods to avoid timezone conversion issues
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      return monthNames[date.getUTCMonth()];
    } catch {
      // On any error, default to January (legacy behavior for 01/01/1900)
      return 'January';
    }
  }

  private getYearFromDate(dateString: string): number {
    try {
      // Handle empty or invalid dates - default to 1900 (legacy: 01/01/1900)
      if (!dateString || dateString === '') {
        dateString = '1900-01-01';
      }
      
      const date = new Date(dateString);
      
      // If date is invalid, default to 1900
      if (isNaN(date.getTime())) {
        return 1900;
      }
      
      // Use UTC method to avoid timezone conversion issues
      return date.getUTCFullYear();
    } catch {
      // On any error, default to 1900 (legacy behavior for 01/01/1900)
      return 1900;
    }
  }

  private getUserId(): string {
    // Return the current technician's employee ID
    return this.techId;
  }

  /**
   * Update action plan based on dropdown changes
   * Legacy JavaScript functions:
   * - CountReplaceYes(id) - Updates action plan when Replace dropdown changes
   * - CountMonitorYes(id) - Updates action plan when Monitor dropdown changes  
   * - ddlCrackChange(id) - Updates action plan when Cracks dropdown changes
   * 
   * IMPORTANT: Each dropdown change is handled independently in legacy
   * The logic priority is:
   * 1. If Replace = "Y" → "Float voltage or Conductance value is not as per manufacturer specification"
   * 2. Else if Monitor = "Y" → "Float voltage or Conductance value is not as per manufacturer specification"
   * 3. Else if Cracks = "F" → "Battery is leaking / damaged / corrosion"
   * 4. Else → "" (empty)
   */
  onRowDropdownChange(row: BatteryReadingRow): void {
    console.log('🔄 onRowDropdownChange called for battery:', row.batteryId);
    console.log('   Replace:', row.replacementNeeded, 'Monitor:', row.monitoringBattery, 'Cracks:', row.cracks);
    
    // Legacy logic: Check in priority order
    if (row.replacementNeeded === 'Y') {
      // Replace = "Y" → Set specific action plan and clear Monitor
      row.actionPlan = 'Float voltage or Conductance value is not as per manufacturer specification';
      row.monitoringBattery = 'N';
      console.log('   ✅ Set action plan: Replace = Y');
    } else if (row.monitoringBattery === 'Y') {
      // Monitor = "Y" → Set specific action plan and clear Replace
      row.actionPlan = 'Float voltage or Conductance value is not as per manufacturer specification';
      row.replacementNeeded = 'N';
      console.log('   ✅ Set action plan: Monitor = Y');
    } else if (row.cracks === 'F') {
      // Cracks = "F" → Set leaking/damaged message
      row.actionPlan = 'Battery is leaking / damaged / corrosion';
      console.log('   ✅ Set action plan: Cracks = F');
    } else {
      // All are "N" or "P" → Clear action plan
      row.actionPlan = '';
      console.log('   ✅ Cleared action plan: All conditions false');
    }

    console.log('   📝 Final action plan:', row.actionPlan);

    // Update totals (this increments/decrements usedQuantity and monitored)
    this.updateTotals();
  }

  /**
   * Update total replace and monitor counts
   */
  private updateTotals(): void {
    this.totalReplace = this.batteryReadings.filter(row => row.replacementNeeded === 'Y').length;
    this.totalMonitor = this.batteryReadings.filter(row => row.monitoringBattery === 'Y').length;
    
    // Update form controls
    this.batteryStringForm.patchValue({
      usedQuantity: this.totalReplace,
      monitored: this.totalMonitor
    });
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.toastr.error(message);
    console.error(message);
  }

  /**
   * Legacy Validation Methods from JavaScript
   */

  /**
   * Change room temperature dropdown based on temperature value
   * Legacy: ChangeTempDdown()
   */
  onRoomTempChange(): void {
    const roomTemp = this.batteryStringForm.get('roomTemp')?.value;
    const roomTempVerify = this.batteryStringForm.get('roomTempVerify');
    const equipStatus = this.batteryStringForm.get('equipStatus');

    if (roomTemp > 67 && roomTemp < 78) {
      roomTempVerify?.setValue('P');
    } else if (roomTemp <= 67) {
      roomTempVerify?.setValue('F');
      equipStatus?.setValue('OnLine(MinorDeficiency)');
    } else if (roomTemp >= 78 && roomTemp < 80) {
      roomTempVerify?.setValue('F');
      equipStatus?.setValue('OnLine(MinorDeficiency)');
    } else {
      roomTempVerify?.setValue('F');
      equipStatus?.setValue('OnLine(MajorDeficiency)');
    }
  }

  /**
   * Change battery temperature dropdown based on temperature value
   * Legacy: ChangeBattTemp()
   */
  onBatteryTempChange(): void {
    const batteryTemp = this.batteryStringForm.get('batteryTemp')?.value;
    const batteryTempVerify = this.batteryStringForm.get('batteryTempVerify');
    const equipStatus = this.batteryStringForm.get('equipStatus');

    if (batteryTemp > 62 && batteryTemp < 83) {
      batteryTempVerify?.setValue('P');
    } else if (batteryTemp <= 62) {
      batteryTempVerify?.setValue('F');
      equipStatus?.setValue('OnLine(MinorDeficiency)');
    } else if (batteryTemp >= 83 && batteryTemp <= 84) {
      batteryTempVerify?.setValue('F');
      equipStatus?.setValue('OnLine(MinorDeficiency)');
    } else {
      batteryTempVerify?.setValue('F');
      equipStatus?.setValue('OnLine(MajorDeficiency)');
    }
  }

  /**
   * Validate if value is not zero or empty
   * Legacy: checkZeros()
   */
  private checkZeros(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    const numValue = parseFloat(value);
    if (numValue === 0 || isNaN(numValue)) {
      return false;
    }
    const strValue = value.toString().trim();
    if (strValue.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Check if string is numeric
   * Legacy: IsNumeric()
   */
  private isNumeric(value: string): boolean {
    const validChars = '0123456789.';
    if (value.length === 0) {
      return false;
    }
    for (let i = 0; i < value.length; i++) {
      if (validChars.indexOf(value.charAt(i)) === -1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate action plan - check all battery readings
   * Legacy: ValidateActionPlan()
   */
  private validateActionPlan(): boolean {
    const midType = this.batteryStringForm.get('midType')?.value;
    const floatVoltageStatus = this.batteryStringForm.get('floatVoltageStatus')?.value;
    const floatVoltageValue = this.batteryStringForm.get('floatVoltageValue')?.value;
    const readingType = this.batteryStringForm.get('readingType')?.value;
    const strapCheck = this.batteryStringForm.get('strapCheck')?.value;

    if (midType !== '3') {
      if (!floatVoltageStatus || floatVoltageStatus === '') {
        this.toastr.error('Please select float voltage selection');
        return false;
      }
      if (!floatVoltageValue || floatVoltageValue === '') {
        this.toastr.error('Please select float voltage value');
        return false;
      }

      if (floatVoltageStatus === 'OF' || floatVoltageStatus === 'ON') {
        for (let i = 0; i < this.batteryReadings.length; i++) {
          const battery = this.batteryReadings[i];

          if (!this.checkZeros(battery.vdc)) {
            this.toastr.error(`Please enter the VDC value for Battery No: ${battery.batteryId}`);
            return false;
          }

          if (readingType === '2') {
            console.log(`Battery ${battery.batteryId} - mhos value:`, battery.mhos, `(type: ${typeof battery.mhos})`);
            if (!this.checkZeros(battery.mhos)) {
              this.toastr.error(`Please enter the MHOS value for Battery No: ${battery.batteryId}. Current value: ${battery.mhos}`);
              return false;
            }
          }

          if (strapCheck) {
            if (this.checkZeros(battery.strap1)) {
              if (battery.strap1 > 100) {
                battery.strap1 = ((1 / battery.strap1) - (1 / battery.mhos)) * 1000000;
              }
            }
            if (this.checkZeros(battery.strap2)) {
              if (battery.strap2 > 100) {
                battery.strap2 = ((1 / battery.strap2) - (1 / battery.mhos)) * 1000000;
              }
            }
          }
        }
      }
    }
    return true;
  }

  /**
   * Main validation before save
   * Legacy: Validate()
   */
  private validate(): boolean {
    const manufacturer = this.batteryStringForm.get('manufacturer')?.value;
    const batteryHousing = this.batteryStringForm.get('batteryHousing')?.value;
    const modelNo = this.batteryStringForm.get('modelNo')?.value;
    const serialNo = this.batteryStringForm.get('serialNo')?.value;
    const location = this.batteryStringForm.get('location')?.value;
    const batteryType = this.batteryStringForm.get('batteryType')?.value;
    const batteryTypeName = this.batteryStringForm.get('batteryTypeName')?.value;
    const equipStatus = this.batteryStringForm.get('equipStatus')?.value;
    const startDate = this.batteryStringForm.get('startDate')?.value;
    const reconciled = this.reconciliationForm.get('reconciled')?.value;
    const totalBatteryVoltage = this.batteryStringForm.get('totalBatteryVoltage')?.value;
    const plusTerminalToGnd = this.batteryStringForm.get('plusTerminalToGnd')?.value;
    const minusTerminalToGnd = this.batteryStringForm.get('minusTerminalToGnd')?.value;
    const dcChargeCurrent = this.batteryStringForm.get('dcChargeCurrent')?.value;
    const acRippleVoltage = this.batteryStringForm.get('acRippleVoltage')?.value;
    const acRippleCurrent = this.batteryStringForm.get('acRippleCurrent')?.value;
    const roomTemp = this.batteryStringForm.get('roomTemp')?.value;
    const batteryTemp = this.batteryStringForm.get('batteryTemp')?.value;
    const battTerminalType = this.batteryStringForm.get('battTerminalType')?.value;
    const battTerminal = this.batteryStringForm.get('battTerminal')?.value;
    const battTerminalValue = this.batteryStringForm.get('battTerminalValue')?.value;
    const replaceWholeString = this.batteryStringForm.get('replaceWholeString')?.value;
    const reasonToReplace = this.batteryStringForm.get('reasonToReplace')?.value;
    const readingType = this.batteryStringForm.get('readingType')?.value;
    const battMakeModel = this.batteryStringForm.get('battMakeModel')?.value;
    const refValue = this.batteryStringForm.get('refValue')?.value;
    const stringType = this.batteryStringForm.get('stringType')?.value;
    const packNo = this.batteryStringForm.get('packNo')?.value;
    const repMonCalculate = this.batteryStringForm.get('repMonCalculate')?.value;
    const readingsGraphCheck = this.batteryStringForm.get('readingsGraphCheck')?.value;

    // Manufacturer validation
    if (!manufacturer || manufacturer.substring(0, 3) === 'Ple') {
      this.toastr.error('Please select the manufacturer');
      return false;
    }

    // Battery Housing validation
    if (!batteryHousing || batteryHousing === 'Please Select' || batteryHousing === 'PS') {
      this.toastr.error('Please select the Battery Housing');
      return false;
    }

    // Model No validation
    if (!modelNo || modelNo.trim() === '') {
      this.toastr.error('Please enter the Model No');
      return false;
    }

    // Serial No validation
    if (!serialNo || serialNo.trim() === '') {
      this.toastr.error('Please enter the Serial No');
      return false;
    }

    // Location validation
    if (!location || location.trim() === '') {
      this.toastr.error('Please enter the Location');
      return false;
    }

    // Battery Voltage Type validation
    if (!batteryType || batteryType === 'PS') {
      this.toastr.error('Please Select the Battery Type');
      return false;
    }

    // DateCode validation
    if (!startDate || startDate === '' || startDate === '1900-01-01') {
      this.toastr.error('Please enter the DateCode');
      return false;
    }

    const datecode = new Date(startDate);
    const today = new Date();
    if (isNaN(datecode.getTime())) {
      this.toastr.error('Please enter the valid datecode');
      return false;
    }
    if (datecode > today) {
      this.toastr.error("DateCode cannot be higher than today's date");
      return false;
    }

    // Reconciliation validation
    if (!reconciled) {
      this.toastr.error('You must verify the Reconciliation section before Saving PM form');
      return false;
    }

    // Reconciliation "Actual" fields validation - when "Is Correct" is "No"
    const recMakeCorrect = this.reconciliationForm.get('recMakeCorrect')?.value;
    const actMake = this.reconciliationForm.get('actMake')?.value;
    const recModelCorrect = this.reconciliationForm.get('recModelCorrect')?.value;
    const actModel = this.reconciliationForm.get('actModel')?.value;
    const recSerialNoCorrect = this.reconciliationForm.get('recSerialNoCorrect')?.value;
    const actSerialNo = this.reconciliationForm.get('actSerialNo')?.value;
    const battPerStringCorrect = this.reconciliationForm.get('battPerStringCorrect')?.value;
    const actBattPerString = this.reconciliationForm.get('actBattPerString')?.value;

    if (recMakeCorrect === 'NO' && (!actMake || actMake.trim() === '')) {
      this.toastr.error('Actual Make is required when Make is marked as incorrect');
      return false;
    }

    if (recModelCorrect === 'NO' && (!actModel || actModel.trim() === '')) {
      this.toastr.error('Actual Model is required when Model is marked as incorrect');
      return false;
    }

    if (recSerialNoCorrect === 'NO' && (!actSerialNo || actSerialNo.trim() === '')) {
      this.toastr.error('Actual Serial No is required when Serial No is marked as incorrect');
      return false;
    }

    if (battPerStringCorrect === 'NO' && (!actBattPerString || actBattPerString <= 0)) {
      this.toastr.error('Actual Batteries Per String count is required when Batteries Per String is marked as incorrect');
      return false;
    }

    // Battery Charging System Verification
    if (!this.checkZeros(totalBatteryVoltage) || !this.checkZeros(plusTerminalToGnd) || 
        !this.checkZeros(minusTerminalToGnd) || !this.checkZeros(dcChargeCurrent) || 
        !this.checkZeros(acRippleCurrent) || !this.checkZeros(acRippleVoltage)) {
      this.toastr.error('Please complete the Battery Charging System Verification Section. Values Cannot be Zero or Empty.');
      return false;
    }

    // Temperature validations
    if (!roomTemp || roomTemp === '') {
      this.toastr.error('Please enter the room temperature(°F)');
      return false;
    } else {
      this.onRoomTempChange();
    }

    if (!batteryTemp || batteryTemp === '') {
      this.toastr.error('Please enter the Battery temperature(°F)');
      return false;
    } else {
      this.onBatteryTempChange();
    }

    // Battery Terminal Type validation
    if (!battTerminalType || battTerminalType === 'PS') {
      this.toastr.error('You must enter the Battery Terminal Type');
      return false;
    }

    // Battery Terminal Size validation
    if (battTerminal === 'Other') {
      if (!battTerminalValue || battTerminalValue.trim() === '') {
        this.toastr.error('You must enter the Battery Terminal Size when you select Other');
        return false;
      }
    } else if (!battTerminal || battTerminal === 'PS' || battTerminal === '') {
      this.toastr.error('You must select the Battery Terminal Size');
      return false;
    }

    // Replace whole string validation
    if (replaceWholeString) {
      if (!reasonToReplace || reasonToReplace === 'PS' || reasonToReplace === '') {
        this.toastr.error('Please select the reason for recommending to replace the complete string');
        return false;
      }
    }

    // Reading Type validation (Midtronics reference value)
    if (readingType === '2') {
      if (!battMakeModel || battMakeModel.substring(0, 3) === 'Ple') {
        this.toastr.error('Please select midtronics reference value');
        return false;
      } else {
        if (!refValue || refValue === '' || refValue === '0') {
          this.toastr.error('Please enter the midtronics reference value');
          return false;
        } else if (!this.isNumeric(refValue)) {
          this.toastr.error('Please enter the midtronics reference value');
          return false;
        }
      }
    }

    // String Type validation
    if (stringType === '3') {
      if (!packNo || packNo <= 0) {
        this.toastr.error('You must provide the No of Battery Packs');
        return false;
      }
    } else if (stringType === '2') {
      if (!packNo || packNo <= 0) {
        this.toastr.error('You must provide the No of Internal Strings');
        return false;
      }
    }

    // Replace/Monitor calculation validation
    if (!repMonCalculate || repMonCalculate === '0' || repMonCalculate === '') {
      this.toastr.error('Please select how do you want monitor and replace values to be calculated');
      return false;
    }

    // Graph verification validation - only required if there are battery readings rows
    if (this.batteryReadings && this.batteryReadings.length > 0 && !readingsGraphCheck) {
      this.toastr.error('Please check that you have verified the readings in Graph');
      return false;
    }

    // Validate action plan
    if (!this.validateActionPlan()) {
      return false;
    }

    // Equipment Status confirmation
    if (equipStatus !== 'Online') {
      if (!confirm(`Are you sure that the Equipment Status: ${equipStatus}`)) {
        return false;
      }
    }

    return true;
  }
}
