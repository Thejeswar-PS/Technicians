import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BatteryReadingsService } from '../../../core/services/battery-readings.service';
import {
  BatteryStringInfo,
  BatteryReadingRow,
  BatteryData,
  UpdateEquipStatus,
  BatteryStatusResult,
} from '../../../core/model/battery-readings.model';

@Component({
  selector: 'app-battery-readings-temp',
  templateUrl: './battery-readings-temp.component.html',
  styleUrls: ['./battery-readings-temp.component.scss'],
})
export class BatteryReadingsTempComponent implements OnInit {
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
  reconciliationForm: FormGroup; // Not used in Temp version but kept for compatibility
  batteryGridForm: FormGroup;

  // Data Models
  batteryStringInfo: BatteryStringInfo | null = null;
  reconciliationInfo: any | null = null; // Not used in Temp version
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
  showReconciliation: boolean = false; // Always false for Temp version
  showChargingVerification: boolean = true;
  showMultimeterReadings: boolean = true;
  showBatteryReadingsGrid: boolean = true;

  // Battery Type State
  isBatteryTypeLithium: boolean = false; // Not used in Temp version

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
    this.reconciliationForm = this.createReconciliationForm(); // Kept for compatibility
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

      if (!this.battNum || this.battNum === '' || this.battNum === '0') {
        this.battNum = '40';
      }
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
      .getBatteryStringReadingsInfoTemp(this.callNbr, this.equipId, this.batStrId)
      .subscribe(
        (data) => {
          this.batteryStringInfo = data;
          this.populateBatteryStringForm(data);
          // this.enableDisableLithium(); // Removed for Temp version
          // this.loadReconciliationInfo(); // Removed for Temp version
          this.loadBatteryGridData();
        },
        (error) => {
          this.handleError('Error loading battery string info: ' + error.message);
          this.loading = false;
        }
      );
  }

  /**
   * Load reconciliation information (NOT USED IN TEMP VERSION)
   */
  private loadReconciliationInfo(): void {
    // Reconciliation not used in Temp version - method kept for compatibility
    return;
  }

  /**
   * Load battery grid data
   */
  private loadBatteryGridData(updateReconciliation: boolean = false): void {
    this.batteryService
      .getBatteryInfoTemp(this.callNbr, this.equipId, this.batStrId)
      .subscribe(
        (data) => {
          this.batteryReadings = this.mapBatteryDataToRows(data);
          // Update batteriesNo with actual count of battery rows
          this.batteryStringForm.patchValue({
            batteriesNo: data.length
          });
          
          // Update reconciliation battPerString only after Change button (not initial load)
          if (updateReconciliation) {
            this.reconciliationForm.patchValue({
              battPerString: data.length
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
    return data.map((item, index) => ({
      batteryId: item.batteryId || index + 1,
      vdc: item.vdc || 0,
      vac: item.vac || 0,
      mhos: item.mhos || 0,
      strap1: item.strap1 || 0,
      strap2: item.strap2 || 0,
      spGravity: item.spGravity || 0,
      cracks: item.cracks || 'N',
      replacementNeeded: item.replacementNeeded || 'N',
      monitoringBattery: item.monitoringBattery || 'N',
      actionPlan: item.actionPlan || '',
      temp: item.temp || 70,
    }));
  }

  /**
   * DisplayBatteryInfo - Legacy equivalent
   * Adjusts battery grid rows based on battery count
   * 1. Calculates expected battery count based on stringType
   * 2. Adds rows if current count < expected
   * 3. Deletes rows if current count > expected (with validation)
   * 4. Saves ALL rows (delete + insert in one operation)
   * 5. Reloads grid data
   */
  private displayBatteryInfo(): void {
    try {
      // Step 1: Calculate expected battery count (legacy: BattNum calculation)
      const stringType = this.batteryStringForm.get('stringType')?.value;
      const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
      const packNo = parseInt(this.batteryStringForm.get('packNo')?.value) || 0;
      
      let expectedBatteryCount = 0;
      if (stringType === '3') {
        // Battery Packs / Trays
        expectedBatteryCount = packNo;
      } else if (stringType === '2') {
        // Internal Single / Parallel Strings
        expectedBatteryCount = packNo * batteriesNo;
      } else {
        // External
        expectedBatteryCount = batteriesNo;
      }

      // Step 2: Get current battery info from backend
      this.batteryService.getBatteryInfoTemp(this.callNbr, this.equipId, this.batStrId).subscribe(
        (currentBatteries) => {
          const currentCount = currentBatteries.length;

          if (currentCount !== expectedBatteryCount) {
            // Battery count mismatch - need to adjust
            if (currentCount < expectedBatteryCount) {
              // Need to add batteries
              this.addMissingBatteryRows(currentBatteries, expectedBatteryCount);
            } else if (currentCount > expectedBatteryCount) {
              // Need to delete extra batteries (with validation)
              this.deleteExtraBatteryRows(currentBatteries, expectedBatteryCount);
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
   */
  private deleteExtraBatteryRows(currentBatteries: BatteryData[], expectedCount: number): void {
    // Validate that batteries to be deleted have VDC = 0 (legacy validation)
    let canDelete = true;
    for (let k = expectedCount; k < currentBatteries.length; k++) {
      if (currentBatteries[k].vdc > 0) {
        canDelete = false;
        this.handleError('Cannot delete battery rows with VDC values > 0. Please clear the values first.');
        break;
      }
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
      .getBatteryStringReadingsInfoTemp(this.callNbr, this.equipId, this.batStrId)
      .subscribe(
        (data) => {
          this.batteryStringInfo = data;
          this.populateBatteryStringFormSimple(data);
          // this.enableDisableLithium(); // Removed for Temp version
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
      packNo: data.batteryPackCount,
      battDisconnect: data.indBattDisconnect,
      indBattInterconnection: data.indBattInterConn,
      rackIntegrity: data.rackIntegrity,
      ventFanOperation: data.ventFanOperation,
      batteriesNo: this.battNum,
      replaceWholeString: data.replaceWholeString,
      mvacCheck: data.chckmVac,
      strapCheck: data.chkStrap,
      battTerminal: data.ddlBattTerminal,
      battTerminalType: data.ddlBattTypeTerminal,
      battTerminalValue: data.txtBattTerminal,
      midType: data.readingMethod,
      readingsGraphCheck: data.chkGraph,
    });

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
  private populateReconciliationForm(data: any /* EquipReconciliationInfo removed for Temp */): void {
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
      recMakeCorrect: [''],
      actMake: [''],
      recModel: [''],
      recModelCorrect: [''],
      actModel: [''],
      recSerialNo: [''],
      recSerialNoCorrect: [''],
      actSerialNo: [''],
      ascStrings: [''],
      ascStringsCorrect: [''],
      actAscStrings: [''],
      battPerString: [''],
      battPerStringCorrect: [''],
      actBattPerString: [''],
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
    // this.enableDisableLithium(); // Removed for Temp version
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
      if (batteryType === 'PS') return;

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

    this.batteryReadings.forEach((row) => {
      const vdc = this.convertToDecimal(row.vdc.toString());
      const mhos = this.convertToDecimal(row.mhos.toString());

      // VDC Analysis
      if (replacelow > 0 || monitorlow > 0) {
        if (vdc >= replace && vdc < replacelow) {
          row.actionPlan = `Float voltage must be between ${replace} and ${replacelow}`;
          row.replacementNeeded = 'Y';
          row.monitoringBattery = 'N';
          totalReplace++;
        } else if (vdc >= monitor2 && vdc < monitorlow) {
          row.actionPlan = `Float voltage between ${monitor2} and ${monitorlow}`;
          row.monitoringBattery = 'Y';
          row.replacementNeeded = 'N';
          totalMonitor++;
        } else {
          row.replacementNeeded = 'N';
          row.monitoringBattery = 'N';
          if (row.cracks !== 'F') {
            row.actionPlan = '';
          } else {
            row.actionPlan = 'Battery is leaking / damaged / corrosion';
          }
        }
      } else {
        if (vdc <= replace) {
          row.actionPlan = `Float voltage is less than or equal to ${replace}. To be Replaced`;
          row.replacementNeeded = 'Y';
          row.monitoringBattery = 'N';
          totalReplace++;
        } else if (vdc <= monitor2) {
          row.actionPlan = `Float voltage is less than or equal to ${monitor2}. To be Monitored`;
          row.monitoringBattery = 'Y';
          row.replacementNeeded = 'N';
          totalMonitor++;
        } else {
          row.replacementNeeded = 'N';
          row.monitoringBattery = 'N';
          if (row.cracks !== 'F') {
            row.actionPlan = '';
          } else {
            row.actionPlan = 'Battery is leaking / damaged / corrosion';
          }
        }
      }

      // MHOS Analysis (Conductance)
      if (readingType === '2' && midType !== '3') {
        if (midType === '1') {
          if (mhos <= mhError) {
            if (row.replacementNeeded === 'N') {
              row.actionPlan = `Fail value:${mhError}. Battery to be Replaced`;
              row.replacementNeeded = 'Y';
              row.monitoringBattery = 'N';
              totalReplace++;
            }
          } else if (mhos <= mhWarning) {
            if (row.monitoringBattery === 'N') {
              row.actionPlan = `Warning value:${mhWarning}. Battery to be Monitored`;
              row.monitoringBattery = 'Y';
              row.replacementNeeded = 'N';
              totalMonitor++;
            }
          }
        } else if (midType === '2') {
          if (mhos > mhError) {
            if (row.replacementNeeded === 'N') {
              row.actionPlan = `Fail value:${mhError}. Battery to be Replaced`;
              row.replacementNeeded = 'Y';
              row.monitoringBattery = 'N';
              totalReplace++;
            }
          } else if (mhos > mhWarning && mhos <= mhError) {
            if (row.monitoringBattery === 'N') {
              row.actionPlan = `Warning value:${mhWarning}. Battery to be Monitored`;
              row.monitoringBattery = 'Y';
              row.replacementNeeded = 'N';
              totalMonitor++;
            }
          }
        }
      }
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
   */
  getEquipmentStatus(): string {
    try {
      const status = this.batteryStringForm.get('equipStatus')?.value;

      if (status === 'Offline') {
        return 'CriticalDeficiency';
      }

      const usedQuantity = parseInt(this.batteryStringForm.get('usedQuantity')?.value) || 0;
      if (usedQuantity > 0) {
        return 'CriticalDeficiency';
      }

      if (this.recommendToReplace() || 
          (this.batteryStringForm.get('reasonToReplace')?.value === 'DA' &&
            this.batteryStringForm.get('replaceWholeString')?.value)) {
        return 'ReplacementRecommended';
      }

      if (this.proactiveReplace()) {
        return 'ProactiveReplacement';
      }

      if (status !== 'Online') {
        return status;
      }

      // Check for deficiencies in grid
      let hasReplace = false;
      let hasMonitor = false;

      this.batteryReadings.forEach((row) => {
        if (row.replacementNeeded === 'Y') hasReplace = true;
        if (row.monitoringBattery === 'Y') hasMonitor = true;
      });

      if (hasReplace) {
        return 'CriticalDeficiency';
      } else if (hasMonitor) {
        return 'OnLine(MinorDeficiency)';
      }

      return 'Online';
    } catch (error) {
      this.handleError('Error determining equipment status: ' + error);
      return 'Online';
    }
  }

  /**
   * Save battery readings
   */
  /**
   * Main save flow - aligned with legacy SaveData() method
   * Flow:
   * 1. Validate() - Validate all form fields
   * 2. BatteryData() - Calculate deficiency and save battery grid
   * 3. SaveUpdateBatteryString() - Save battery string info
   * 4. UpdateBatteryInfo(1) - Update reading type in equipment info
   * 5. SaveUpdateReconciliationInfo() - Save reconciliation
   * 6. GetEquipStatus() - Calculate equipment status (if not Offline)
   * 7. GetReferenceValues() - Reload reference values
   * 8. UpdateEquipStatus() - Update equipment status
   * 9. DisplayBatteryStringInfo() - Reload data
   */
  onSaveBatteryReadings(saveType: 'Save' | 'SaveAsDraft'): void {
    // Validate form before saving
    if (!this.validate()) {
      return;
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
      mhos: row.mhos,
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
        // Step 2: After battery data is saved, save battery string info
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
   * Step 2: Save battery string info (legacy SaveUpdateBatteryString method)
   */
  private saveBatteryStringInfo(saveType: 'Save' | 'SaveAsDraft'): void {
    const batteryStringInfo = this.buildBatteryStringInfo();
    batteryStringInfo.saveAsDraft = saveType === 'SaveAsDraft';

    this.batteryService.saveUpdateBatteryStringReadingsTemp(batteryStringInfo).subscribe(
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
          // this.saveReconciliationInfoStep(); // Removed for Temp version
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
   * Step 4: Save reconciliation info (NOT USED IN TEMP VERSION)
   */
  private saveReconciliationInfoStep(): void {
    // Reconciliation not used in Temp version - skip directly to status calculation
    this.calculateAndUpdateStatus();
  }

  /**
   * Step 5 & 6: Calculate status and reload reference values (legacy GetEquipStatus & GetReferenceValues)
   */
  private calculateAndUpdateStatus(): void {
    const currentStatus = this.batteryStringForm.get('equipStatus')?.value;
    
    // Step 5: Calculate equipment status (legacy GetEquipStatus logic)
    let newStatus = this.getEquipmentStatus();
    
    // Step 6: Reload reference values (legacy GetReferenceValues)
    this.loadReferenceValues();
    
    // Step 7: Update equipment status
    this.updateEquipmentStatusFinal(newStatus);
  }

  /**
   * Step 7: Update equipment status (legacy UpdateEquipStatus method)
   */
  private updateEquipmentStatusFinal(newStatus: string): void {
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
      monthName: this.getMonthFromDate(this.batteryStringForm.get('startDate')?.value),
      year: this.getYearFromDate(this.batteryStringForm.get('startDate')?.value),
      readingType: this.batteryStringForm.get('readingType')?.value || '',
      vfSelection: this.batteryStringForm.get('floatVoltageStatus')?.value || '',
      batteriesPerString: parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0,
      batteriesPerPack: parseInt(this.batteryStringForm.get('packNo')?.value) || 0,
      // Required fields for API validation
      Notes: this.batteryStringForm.get('commentsUsed')?.value || '',
      MaintAuthID: this.getUserId(),
    };

    this.batteryService.updateEquipStatus(statusInfo).subscribe(
      () => {
        this.toastr.success(this.successMessage || 'Battery readings saved successfully!');
        this.isSaving = false;
        this.saving = false;
        
        // Step 8: Reload data (legacy DisplayBatteryStringInfo)
        this.loadBatteryStringInfo();
      },
      (error) => {
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
    this.saving = true;
    
    // Step 1: Save battery string as draft (legacy: SaveUpdateBatteryString)
    const batteryStringInfo = this.buildBatteryStringInfo();
    batteryStringInfo.saveAsDraft = true;

    this.batteryService.saveUpdateBatteryStringReadingsTemp(batteryStringInfo).subscribe(
      () => {
        // Step 2: Update equipment batteries (legacy: UpdateBatteryInfo(2))
        const batteryData = {
          readingType: this.batteryStringForm.get('readingType')?.value || '',
          batteriesPerString: parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0,
          batteriesPerPack: parseInt(this.batteryStringForm.get('packNo')?.value) || 0,
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
        // After UpdateBatteryInfo(2), call DisplayBatteryInfo() to adjust rows
        this.displayBatteryInfo();
        this.saving = false;
      },
      (error) => {
        this.handleError(`Error updating battery info: ${error.message}`);
        this.saving = false;
      }
    );
  }

  /**
   * Build battery string info for saving
   */
  private buildBatteryStringInfo(): BatteryStringInfo {
    const startDate = this.batteryStringForm.get('startDate')?.value;
    const dateObj = new Date(startDate);
    
    // Step 1: Get battery voltage validation using getBatteryFloatVoltage (legacy flow)
    const batteryVoltage = this.convertToDouble(this.batteryStringForm.get('totalBatteryVoltage')?.value) || 0;
    const batteriesNo = parseInt(this.batteryStringForm.get('batteriesNo')?.value) || 0;
    const stringType = this.batteryStringForm.get('stringType')?.value || '';
    
    let batVoltagePf = this.batteryStringForm.get('batteryVoltageVerify')?.value || '';
    
    // Step 2: Call getBatteryFloatVoltage and validate battery voltage (legacy SaveUpdateBatteryString logic)
    if (batteryVoltage > 0 && stringType !== '3') {
      const voltageRange = this.getBatteryFloatVoltage();
      const minVoltForString = voltageRange.lowVolt * batteriesNo;
      const maxVoltForString = voltageRange.maxVolt * batteriesNo;
      
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
      batteryPackCount: parseInt(this.batteryStringForm.get('packNo')?.value) || 0,
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
  private buildReconciliationInfo(): any /* EquipReconciliationInfo removed for Temp */ {
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
      const date = new Date(dateString);
      return date.toLocaleString('default', { month: 'long' });
    } catch {
      return '';
    }
  }

  private getYearFromDate(dateString: string): number {
    try {
      const date = new Date(dateString);
      return date.getFullYear();
    } catch {
      return 0;
    }
  }

  private getUserId(): string {
    // Return the current technician's employee ID
    return this.techId;
  }

  /**
   * Update action plan based on dropdown changes
   */
  onRowDropdownChange(row: BatteryReadingRow): void {
    // Update action plan based on the dropdown selections
    if (row.replacementNeeded === 'Y') {
      if (row.cracks === 'F') {
        row.actionPlan = 'Float voltage or Conductance value is not as per manufacturer specification';
      } else if (!row.actionPlan || !row.actionPlan.includes('Float voltage')) {
        row.actionPlan = 'Float voltage or Conductance value is not as per manufacturer specification';
      }
      row.monitoringBattery = 'N';
    } else if (row.monitoringBattery === 'Y') {
      if (row.cracks === 'F') {
        row.actionPlan = 'Float voltage or Conductance value is not as per manufacturer specification';
      } else if (!row.actionPlan || !row.actionPlan.includes('Float voltage')) {
        row.actionPlan = 'Float voltage or Conductance value is not as per manufacturer specification';
      }
      row.replacementNeeded = 'N';
    } else {
      // Both are 'N'
      if (row.cracks === 'F') {
        row.actionPlan = 'Battery is leaking / damaged / corrosion';
      } else {
        row.actionPlan = '';
      }
    }

    // Update totals
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
            if (!this.checkZeros(battery.mhos)) {
              this.toastr.error(`Please enter the MHOS value for Battery No: ${battery.batteryId}`);
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

    // Graph verification validation
    if (!readingsGraphCheck) {
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



