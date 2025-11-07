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
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  batteryAge: number = 0;

  // Battery Type State
  isBatteryTypeLithium: boolean = false;

  // Grid Row Counts
  totalReplace: number = 0;
  totalMonitor: number = 0;

  // Reference Data
  manufacturers: any[] = [];
  batteryHousings: any[] = [];
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
  private loadBatteryGridData(): void {
    this.batteryService
      .getBatteryInfo(this.callNbr, this.equipId, this.batStrId)
      .subscribe(
        (data) => {
          this.batteryReadings = this.mapBatteryDataToRows(data);
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
      intercellConnector: data.resistancePf,
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
    this.enableDisableLithium();
    this.loadReferenceValues();
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
  onSaveBatteryReadings(saveType: 'Save' | 'SaveAsDraft'): void {
    this.isSaving = true;
    this.errorMessage = '';

    try {
      const batteryStringInfo = this.buildBatteryStringInfo();
      batteryStringInfo.saveAsDraft = saveType === 'SaveAsDraft';

      this.batteryService.saveUpdateBatteryStringReadings(batteryStringInfo).subscribe(
        () => {
          this.successMessage = 'Battery readings saved successfully!';
          this.toastr.success('Battery readings saved successfully!');

          // Save reconciliation info
          if (this.reconciliationInfo) {
            const reconInfo = this.buildReconciliationInfo();
            this.batteryService.saveUpdateEquipReconciliationInfo(reconInfo).subscribe(
              () => {
                // Save battery data grid
                this.saveBatteryData();
              },
              (error) => {
                this.handleError('Error saving reconciliation info: ' + error.message);
                this.isSaving = false;
              }
            );
          } else {
            this.saveBatteryData();
          }
        },
        (error) => {
          this.handleError('Error saving battery readings: ' + error.message);
          this.isSaving = false;
        }
      );
    } catch (error) {
      this.handleError('Error preparing data for save: ' + error);
      this.isSaving = false;
    }
  }

  /**
   * Save battery grid data
   */
  private saveBatteryData(): void {
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

    this.batteryService.saveBatteryData(batteryDataList).subscribe(
      () => {
        // Update equipment status
        this.updateEquipmentStatus();
      },
      (error) => {
        this.handleError('Error saving battery data: ' + error.message);
        this.isSaving = false;
      }
    );
  }

  /**
   * Update equipment status
   */
  private updateEquipmentStatus(): void {
    const newStatus = this.getEquipmentStatus();

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
    };

    this.batteryService.updateEquipStatus(statusInfo).subscribe(
      () => {
        this.toastr.success('Equipment status updated successfully!');
        this.isSaving = false;
        // Reload data
        this.loadBatteryStringInfo();
      },
      (error) => {
        this.handleError('Error updating equipment status: ' + error.message);
        this.isSaving = false;
      }
    );
  }

  /**
   * Build battery string info for saving
   */
  private buildBatteryStringInfo(): BatteryStringInfo {
    const startDate = this.batteryStringForm.get('startDate')?.value;
    const dateObj = new Date(startDate);

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
      batVoltage: this.convertToDouble(this.batteryStringForm.get('totalBatteryVoltage')?.value) || 0,
      plusTerminal: this.convertToDouble(this.batteryStringForm.get('plusTerminalToGnd')?.value) || 0,
      minusTerminal: this.convertToDouble(this.batteryStringForm.get('minusTerminalToGnd')?.value) || 0,
      dcCharging: this.convertToDouble(this.batteryStringForm.get('dcChargeCurrent')?.value) || 0,
      acRipple: this.convertToDouble(this.batteryStringForm.get('acRippleVoltage')?.value) || 0,
      acRippleCurrent: this.convertToDouble(this.batteryStringForm.get('acRippleCurrent')?.value) || 0,
      batVoltatePf: this.batteryStringForm.get('batteryVoltageVerify')?.value || '',
      plusTerminalPf: this.batteryStringForm.get('plusTerminalVerify')?.value || '',
      minusTerminalPf: this.batteryStringForm.get('minusTerminalVerify')?.value || '',
      dcChargingPf: this.batteryStringForm.get('dcChargingVerify')?.value || '',
      acRipplePf: this.batteryStringForm.get('acRippleVoltageVerify')?.value || '',
      acRippleCurrentPf: this.batteryStringForm.get('acRippleCurrentVerify')?.value || '',
      resistancePf: this.batteryStringForm.get('intercellConnector')?.value || '',
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
      stringType: this.batteryStringForm.get('stringType')?.value || '',
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
    return `${monthNum}/01/${year}`; // Legacy MM/dd/yyyy with day as 01
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
    // TODO: Get from auth service
    return '';
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.toastr.error(message);
    console.error(message);
  }
}
