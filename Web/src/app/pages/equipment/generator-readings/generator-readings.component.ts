import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentService } from '../../../core/services/equipment.service';

export interface GeneratorInfo {
  callNbr: string;
  equipId: number;
  equipNo: string;
  techId: string;
  techName: string;
  
  // Equipment Verification
  genDateCodeMonth: string;
  genDateCodeYear: string;
  genLocation: string;
  siteIDNum: string;
  engineModel: string;
  engineSN: string;
  manufacturer: string;
  oilFilterPartNum: string;
  numOilFilters: string;
  fuelFilterPartNum: string;
  numFuelFilters: string;
  coolantFilterPartNum: string;
  numCoolantFilters: string;
  airFilterPartNum: string;
  numAirFilters: string;
  waterSepPartNum: string;
  numWaterSepFilters: string;
  amtOil: string;
  amtCoolant: string;
  status: string;
  
  // Battery Maintenance
  batDateCodeMonth: string;
  batDateCodeYear: string;
  batCleanliness: string;
  electrolyteLevel: string;
  clampTightness: string;
  checkBatCharger: string;
  checkCables: string;
  checkBatPosts: string;
  checkBatLugs: string;
  applyCorrInhibitor: string;
  alternatorVoltage: string;
  bat1Voltage: string;
  bat2Voltage: string;
  bat3Voltage: string;
  bat4Voltage: string;
  chargingVoltageOffline: string;
  chargingVoltageOnline: string;
  chargingCurrentOffline: string;
  chargingCurrentOnline: string;
  checkAlarms: string;
  batNotes: string;
  
  // Battery Readings
  bat1VDC: string;
  bat1Cond: string;
  bat1SG: string;
  bat1SG2: string;
  bat1SG4: string;
  bat2VDC: string;
  bat2Cond: string;
  bat2SG: string;
  bat3VDC: string;
  bat3Cond: string;
  bat3SG: string;
  bat3SG2: string;
  bat3SG4: string;
  bat4VDC: string;
  bat4Cond: string;
  bat4SG: string;
  
  // Cooling System
  checkCoolantLeaks: string;
  checkCoolantLevel: string;
  testCoolant: string;
  checkFanBelts: string;
  checkRadiatorDamage: string;
  radiatorCap: string;
  checkWaterPump: string;
  checkEngBlockHeater: string;
  checkCoolantHoses: string;
  coolantReading: string;
  lubeDrivePulley: string;
  coolantAdded: string;
  engHtrTemp: string;
  changeFilter: string;
  coolingMinorLeaks: string;
  checkRadiator: string;
  pressTestSys: string;
  coolingSysNotes: string;
  
  // Fuel System
  checkFuelLeaks: string;
  checkRemotePump: string;
  checkDayTank: string;
  checkTransferPump: string;
  changeDayTankFilter: string;
  checkLinkage: string;
  changeFuelFilter: string;
  changeWaterSeperator: string;
  fuelMinorLeaks: string;
  lubricateGovLinkage: string;
  fuelNotes: string;
  
  // Lubrication System
  takeOilSample: string;
  changeLubeOil: string;
  changeLubeOilFilter: string;
  checkLubeLeaks: string;
  checkOilLevel: string;
  disposeUsedOil: string;
  wipeEngine: string;
  lubeNotes: string;
  
  // Intake/Exhaust System
  checkExhaustSystem: string;
  checkAirInductionSys: string;
  checkAirIntakeFilter: string;
  checkCrankcase: string;
  checkLouvers: string;
  checkFlexConnection: string;
  checkRainCap: string;
  checkExhaustLeaks: string;
  repairExhaustLeaks: string;
  checkBoxDrain: string;
  drainCondensationTrap: string;
  exhaustNotes: string;
  
  // Generator/Control Panel
  checkGenBrushes: string;
  checkGenConnection: string;
  checkGenBreaker: string;
  checkControlWire: string;
  checkFaultLamps: string;
  checkGenBearing: string;
  cleanControlPanel: string;
  cleanGenVent: string;
  lubeCircuitBreaker: string;
  checkLubeGenBearing: string;
  checkAccuracy: string;
  controlPanelNotes: string;
  
  // Engine Performance
  engHours: string;
  oilPressureCold: string;
  waterTemp: string;
  checkEngLeaks: string;
  tachometer: string;
  oilPressureHot: string;
  testOvercrank: string;
  checkAllAlarms: string;
  
  // Generator Performance
  freq: string;
  currentA: string;
  currentB: string;
  currentC: string;
  voltageAB: string;
  voltageBC: string;
  voltageCA: string;
  voltageAN: string;
  voltageBN: string;
  voltageCN: string;
}

@Component({
  selector: 'app-generator-readings',
  templateUrl: './generator-readings.component.html',
  styleUrls: ['./generator-readings.component.scss']
})
export class GeneratorReadingsComponent implements OnInit {
  
  // Route parameters
  callNbr: string = '';
  equipId: number = 0;
  equipNo: string = '';
  techId: string = '';
  techName: string = '';
  archive: string = '';
  year: string = '';
  
  // Data
  generatorInfo: GeneratorInfo | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isSaving = false;
  
  // Status dropdown options
  statusOptions = [
    { value: 'Online', label: 'On-Line' },
    { value: 'CriticalDeficiency', label: 'Critical Deficiency' },
    { value: 'ReplacementRecommended', label: 'Replacement Recommended' },
    { value: 'OnLine(MajorDeficiency)', label: 'On-Line(Major Deficiency)' },
    { value: 'OnLine(MinorDeficiency)', label: 'On-Line(Minor Deficiency)' },
    { value: 'Offline', label: 'Off-Line' }
  ];
  
  // Years for dropdowns
  yearOptions = Array.from({ length: 62 }, (_, i) => 2020 - i);
  
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  passFailOptions = [
    { value: 'P', label: 'Pass' },
    { value: 'F', label: 'Fail' }
  ];

  passFailNAOptions = [
    { value: 'P', label: 'Pass' },
    { value: 'F', label: 'Fail' },
    { value: 'A', label: 'N/A' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private toastr: ToastrService
  ) {
    this.initializeGeneratorInfo();
  }

  ngOnInit(): void {
    this.loadRouteParams();
  }

  private initializeGeneratorInfo(): void {
    this.generatorInfo = {
      callNbr: '',
      equipId: 0,
      equipNo: '',
      techId: '',
      techName: '',
      genDateCodeMonth: '',
      genDateCodeYear: '',
      genLocation: '',
      siteIDNum: '',
      engineModel: '',
      engineSN: '',
      manufacturer: '',
      oilFilterPartNum: '',
      numOilFilters: '',
      fuelFilterPartNum: '',
      numFuelFilters: '',
      coolantFilterPartNum: '',
      numCoolantFilters: '',
      airFilterPartNum: '',
      numAirFilters: '',
      waterSepPartNum: '',
      numWaterSepFilters: '',
      amtOil: '',
      amtCoolant: '',
      status: 'Online',
      batDateCodeMonth: '',
      batDateCodeYear: '',
      batCleanliness: '',
      electrolyteLevel: '',
      clampTightness: '',
      checkBatCharger: '',
      checkCables: '',
      checkBatPosts: '',
      checkBatLugs: '',
      applyCorrInhibitor: '',
      alternatorVoltage: '',
      bat1Voltage: '',
      bat2Voltage: '',
      bat3Voltage: '',
      bat4Voltage: '',
      chargingVoltageOffline: '',
      chargingVoltageOnline: '',
      chargingCurrentOffline: '',
      chargingCurrentOnline: '',
      checkAlarms: '',
      batNotes: '',
      bat1VDC: '',
      bat1Cond: '',
      bat1SG: '',
      bat1SG2: '',
      bat1SG4: '',
      bat2VDC: '',
      bat2Cond: '',
      bat2SG: '',
      bat3VDC: '',
      bat3Cond: '',
      bat3SG: '',
      bat3SG2: '',
      bat3SG4: '',
      bat4VDC: '',
      bat4Cond: '',
      bat4SG: '',
      checkCoolantLeaks: '',
      checkCoolantLevel: '',
      testCoolant: '',
      checkFanBelts: '',
      checkRadiatorDamage: '',
      radiatorCap: '',
      checkWaterPump: '',
      checkEngBlockHeater: '',
      checkCoolantHoses: '',
      coolantReading: '',
      lubeDrivePulley: '',
      coolantAdded: '',
      engHtrTemp: '',
      changeFilter: '',
      coolingMinorLeaks: '',
      checkRadiator: '',
      pressTestSys: '',
      coolingSysNotes: '',
      checkFuelLeaks: '',
      checkRemotePump: '',
      checkDayTank: '',
      checkTransferPump: '',
      changeDayTankFilter: '',
      checkLinkage: '',
      changeFuelFilter: '',
      changeWaterSeperator: '',
      fuelMinorLeaks: '',
      lubricateGovLinkage: '',
      fuelNotes: '',
      takeOilSample: '',
      changeLubeOil: '',
      changeLubeOilFilter: '',
      checkLubeLeaks: '',
      checkOilLevel: '',
      disposeUsedOil: '',
      wipeEngine: '',
      lubeNotes: '',
      checkExhaustSystem: '',
      checkAirInductionSys: '',
      checkAirIntakeFilter: '',
      checkCrankcase: '',
      checkLouvers: '',
      checkFlexConnection: '',
      checkRainCap: '',
      checkExhaustLeaks: '',
      repairExhaustLeaks: '',
      checkBoxDrain: '',
      drainCondensationTrap: '',
      exhaustNotes: '',
      checkGenBrushes: '',
      checkGenConnection: '',
      checkGenBreaker: '',
      checkControlWire: '',
      checkFaultLamps: '',
      checkGenBearing: '',
      cleanControlPanel: '',
      cleanGenVent: '',
      lubeCircuitBreaker: '',
      checkLubeGenBearing: '',
      checkAccuracy: '',
      controlPanelNotes: '',
      engHours: '',
      oilPressureCold: '',
      waterTemp: '',
      checkEngLeaks: '',
      tachometer: '',
      oilPressureHot: '',
      testOvercrank: '',
      checkAllAlarms: '',
      freq: '',
      currentA: '',
      currentB: '',
      currentC: '',
      voltageAB: '',
      voltageBC: '',
      voltageCA: '',
      voltageAN: '',
      voltageBN: '',
      voltageCN: ''
    };
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.equipId = parseInt(params['EquipId']) || 0;
      this.equipNo = decodeURIComponent(params['EquipNo'] || '');
      this.techId = params['Tech'] || '';
      this.techName = decodeURIComponent(params['TechName'] || '');
      this.archive = params['Archive'] || '';
      this.year = params['Year'] || '';
      
      if (this.callNbr && this.equipNo) {
        this.loadPageData();
      } else {
        this.errorMessage = 'Missing required parameters: CallNbr or EquipNo';
      }
    });
  }

  private loadPageData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.loadEquipInfo().finally(() => {
      this.loadGeneratorData();
    });
  }

  // Helpers to safely read legacy API fields with varying casing and formats
  private getFirstDefined(record: any, keys: string[]): any {
    if (!record) return undefined;
    for (const k of keys) {
      if (record[k] !== undefined && record[k] !== null) {
        return record[k];
      }
    }
    return undefined;
  }

  private toTrimmedString(val: any): string {
    if (val === undefined || val === null) return '';
    return val.toString().trim();
  }

  private normalizeMonth(val: any): string {
    // Accept numeric or string, return trimmed string; blank if falsy
    if (val === undefined || val === null) return '';
    const s = val.toString().trim();
    return s === '0' ? '' : s;
  }

  private normalizeYear(val: any): string {
    // Blank for 0, 1900, or falsy; else trimmed string
    if (val === undefined || val === null) return '';
    const s = val.toString().trim();
    if (s === '' || s === '0' || s === '1900') return '';
    return s;
  }

  private getMonthName(monthValue: string): string {
    // Month values are already stored as month names (January-December) or empty
    // Just return the value as-is for the save payload
    return monthValue || '';
  }

  private loadEquipInfo(): Promise<void> {
    return new Promise(resolve => {
      if (!this.callNbr || !this.equipId || !this.equipNo) {
        resolve();
        return;
      }

      this.equipmentService.editEquipInfo(this.callNbr, this.equipId, this.equipNo).subscribe({
        next: (data: any) => {
          const record = Array.isArray(data) ? data[0] : data;
          if (record) {
            if (!this.generatorInfo) {
              this.initializeGeneratorInfo();
            }

            if (this.generatorInfo) {
              // Map legacy fields case-insensitively and normalize
              this.generatorInfo.engineSN = this.toTrimmedString(
                this.getFirstDefined(record, ['SerialID', 'serialID', 'serialId'])
              );
              this.generatorInfo.engineModel = this.toTrimmedString(
                this.getFirstDefined(record, ['Version', 'version'])
              );
              this.generatorInfo.genDateCodeMonth = this.normalizeMonth(
                this.getFirstDefined(record, ['EquipMonth', 'equipMonth'])
              );
              this.generatorInfo.genDateCodeYear = this.normalizeYear(
                this.getFirstDefined(record, ['EquipYear', 'equipYear'])
              );
              this.generatorInfo.manufacturer = this.toTrimmedString(
                this.getFirstDefined(record, ['VendorId', 'vendorId', 'vendorID'])
              );
              this.generatorInfo.genLocation = this.toTrimmedString(
                this.getFirstDefined(record, ['Location', 'location'])
              );
              const statusVal = this.toTrimmedString(
                this.getFirstDefined(record, ['codeEquipmentStatus', 'CodeEquipmentStatus'])
              );
              if (statusVal) {
                this.generatorInfo.status = statusVal;
              }
              // Ensure core identifiers are present in bound model
              this.generatorInfo.callNbr = this.callNbr;
              this.generatorInfo.equipId = this.equipId;
              this.generatorInfo.equipNo = this.equipNo;
            }
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading equipment info for generator:', err);
          resolve();
        }
      });
    });
  }

  private normalizeZero(value: any): string {
    if (value === null || value === undefined) return '';
    if (value === '0' || value === 0) return '';
    return value.toString();
  }

  private normalizeGeneratorData(data: any): GeneratorInfo {
    const normalized = { ...this.generatorInfo, ...data } as GeneratorInfo;
    const zeroFields: Array<keyof GeneratorInfo> = [
      'bat1Voltage', 'bat2Voltage', 'bat3Voltage', 'bat4Voltage',
      'bat1VDC', 'bat1Cond', 'bat1SG', 'bat1SG2', 'bat1SG4',
      'bat2VDC', 'bat2Cond', 'bat2SG',
      'bat3VDC', 'bat3Cond', 'bat3SG', 'bat3SG2', 'bat3SG4',
      'bat4VDC', 'bat4Cond', 'bat4SG',
      'currentA', 'currentB', 'currentC',
      'voltageAB', 'voltageBC', 'voltageCA', 'voltageAN', 'voltageBN', 'voltageCN',
      'amtOil', 'amtCoolant'
    ];

    zeroFields.forEach(field => {
      (normalized as any)[field] = this.normalizeZero((normalized as any)[field]);
    });

    return normalized;
  }

  private loadGeneratorData(): void {
    this.errorMessage = '';

    this.equipmentService.getGeneratorInfo(this.callNbr, this.equipNo, this.equipId).subscribe({
      next: (data: GeneratorInfo) => {
        this.generatorInfo = this.normalizeGeneratorData({
          ...data,
          callNbr: this.callNbr,
          equipId: this.equipId,
          equipNo: this.equipNo,
          techId: this.techId,
          techName: this.techName
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading generator data:', error);
        this.isLoading = false;
        if (this.generatorInfo) {
          this.generatorInfo.callNbr = this.callNbr;
          this.generatorInfo.equipId = this.equipId;
          this.generatorInfo.equipNo = this.equipNo;
          this.generatorInfo.techId = this.techId;
          this.generatorInfo.techName = this.techName;
        }
      }
    });
  }

  saveGeneratorData(): void {
    if (!this.generatorInfo || !confirm('Are you sure you want to save the generator readings?')) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.generatorInfo.callNbr = this.callNbr;
    this.generatorInfo.equipId = this.equipId;
    this.generatorInfo.equipNo = this.equipNo;
    this.generatorInfo.techId = this.techId;
    this.generatorInfo.techName = this.techName;

    const payload: any = {
      IdCounter: this.equipNo,
      CallNbr: this.callNbr,
      EquipId: this.equipId,
      EquipNo: this.equipNo,
      Tech: this.techId,
      TechName: this.techName,
      GenDateCodeMonth: this.getMonthName(this.generatorInfo.genDateCodeMonth) || '',
      GenDateCodeYear: this.generatorInfo.genDateCodeYear || '',
      BatCleanliness: this.generatorInfo.batCleanliness || '',
      ElectrolyteLevel: this.generatorInfo.electrolyteLevel || '',
      ClampTightness: this.generatorInfo.clampTightness || '',
      CheckBatCharger: this.generatorInfo.checkBatCharger || '',
      CheckCables: this.generatorInfo.checkCables || '',
      CheckBatPosts: this.generatorInfo.checkBatPosts || '',
      CheckBatLugs: this.generatorInfo.checkBatLugs || '',
      ApplyCorrInhibitor: this.generatorInfo.applyCorrInhibitor || '',
      AlternatorVoltage: this.generatorInfo.alternatorVoltage || '',
      Bat1Voltage: this.generatorInfo.bat1Voltage || '',
      Bat2Voltage: this.generatorInfo.bat2Voltage || '',
      Bat3Voltage: this.generatorInfo.bat3Voltage || '',
      Bat4Voltage: this.generatorInfo.bat4Voltage || '',
      ChargingVoltageOffline: this.generatorInfo.chargingVoltageOffline || '',
      ChargingVoltageOnline: this.generatorInfo.chargingVoltageOnline || '',
      ChargingCurrentOffline: this.generatorInfo.chargingCurrentOffline || '',
      ChargingCurrentOnline: this.generatorInfo.chargingCurrentOnline || '',
      CheckAlarms: this.generatorInfo.checkAlarms || '',
      BatNotes: this.generatorInfo.batNotes || '',
      Bat1VDC: this.generatorInfo.bat1VDC || '',
      Bat1Cond: this.generatorInfo.bat1Cond || '',
      Bat1SG: this.generatorInfo.bat1SG || '',
      Bat2VDC: this.generatorInfo.bat2VDC || '',
      Bat2Cond: this.generatorInfo.bat2Cond || '',
      Bat2SG: this.generatorInfo.bat2SG || '',
      Bat3VDC: this.generatorInfo.bat3VDC || '',
      Bat3Cond: this.generatorInfo.bat3Cond || '',
      Bat3SG: this.generatorInfo.bat3SG || '',
      Bat4VDC: this.generatorInfo.bat4VDC || '',
      Bat4Cond: this.generatorInfo.bat4Cond || '',
      Bat4SG: this.generatorInfo.bat4SG || '',
      CheckCoolantLeaks: this.generatorInfo.checkCoolantLeaks || '',
      CheckCoolantLevel: this.generatorInfo.checkCoolantLevel || '',
      TestCoolant: this.generatorInfo.testCoolant || '',
      CheckFanBelts: this.generatorInfo.checkFanBelts || '',
      CheckRadiatorDamage: this.generatorInfo.checkRadiatorDamage || '',
      RadiatorCap: this.generatorInfo.radiatorCap || '',
      CheckWaterPump: this.generatorInfo.checkWaterPump || '',
      CheckEngBlockHeater: this.generatorInfo.checkEngBlockHeater || '',
      CheckCoolantHoses: this.generatorInfo.checkCoolantHoses || '',
      CoolantReading: this.generatorInfo.coolantReading || '',
      LubeDrivePulley: this.generatorInfo.lubeDrivePulley || '',
      CoolantAdded: this.generatorInfo.coolantAdded || '',
      EngHtrTemp: this.generatorInfo.engHtrTemp || '',
      ChangeFilter: this.generatorInfo.changeFilter || '',
      CoolingMinorLeaks: this.generatorInfo.coolingMinorLeaks || '',
      CheckRadiator: this.generatorInfo.checkRadiator || '',
      PressTestSys: this.generatorInfo.pressTestSys || '',
      CoolingSysNotes: this.generatorInfo.coolingSysNotes || '',
      CheckFuelLeaks: this.generatorInfo.checkFuelLeaks || '',
      CheckRemotePump: this.generatorInfo.checkRemotePump || '',
      CheckDayTank: this.generatorInfo.checkDayTank || '',
      CheckTransferPump: this.generatorInfo.checkTransferPump || '',
      ChangeDayTankFilter: this.generatorInfo.changeDayTankFilter || '',
      CheckLinkage: this.generatorInfo.checkLinkage || '',
      ChangeFuelFilter: this.generatorInfo.changeFuelFilter || '',
      ChangeWaterSeperator: this.generatorInfo.changeWaterSeperator || '',
      FuelMinorLeaks: this.generatorInfo.fuelMinorLeaks || '',
      LubricateGovLinkage: this.generatorInfo.lubricateGovLinkage || '',
      FuelNotes: this.generatorInfo.fuelNotes || '',
      TakeOilSample: this.generatorInfo.takeOilSample || '',
      ChangeLubeOil: this.generatorInfo.changeLubeOil || '',
      ChangeLubeOilFilter: this.generatorInfo.changeLubeOilFilter || '',
      CheckLubeLeaks: this.generatorInfo.checkLubeLeaks || '',
      CheckOilLevel: this.generatorInfo.checkOilLevel || '',
      DisposeUsedOil: this.generatorInfo.disposeUsedOil || '',
      WipeEngine: this.generatorInfo.wipeEngine || '',
      LubeNotes: this.generatorInfo.lubeNotes || '',
      CheckExhaustSystem: this.generatorInfo.checkExhaustSystem || '',
      CheckAirInductionSys: this.generatorInfo.checkAirInductionSys || '',
      CheckAirIntakeFilter: this.generatorInfo.checkAirIntakeFilter || '',
      CheckCrankcase: this.generatorInfo.checkCrankcase || '',
      CheckLouvers: this.generatorInfo.checkLouvers || '',
      CheckFlexConnection: this.generatorInfo.checkFlexConnection || '',
      CheckrainCap: this.generatorInfo.checkRainCap || '',
      CheckExhaustLeaks: this.generatorInfo.checkExhaustLeaks || '',
      RepairExhaustLeaks: this.generatorInfo.repairExhaustLeaks || '',
      CheckBoxDrain: this.generatorInfo.checkBoxDrain || '',
      DrainCondensationTrap: this.generatorInfo.drainCondensationTrap || '',
      ExhaustNotes: this.generatorInfo.exhaustNotes || '',
      CheckGenBrushes: this.generatorInfo.checkGenBrushes || '',
      CheckGenConnection: this.generatorInfo.checkGenConnection || '',
      CheckGenBreaker: this.generatorInfo.checkGenBreaker || '',
      CheckControlWire: this.generatorInfo.checkControlWire || '',
      CheckFaultLamps: this.generatorInfo.checkFaultLamps || '',
      CheckGenBearing: this.generatorInfo.checkGenBearing || '',
      CleanControlPanel: this.generatorInfo.cleanControlPanel || '',
      CleanGenVent: this.generatorInfo.cleanGenVent || '',
      LubeCircuitBreaker: this.generatorInfo.lubeCircuitBreaker || '',
      CheckLubeGenBearing: this.generatorInfo.checkLubeGenBearing || '',
      BatDateCodeMonth: this.getMonthName(this.generatorInfo.batDateCodeMonth) || '',
      BatDateCodeYear: this.generatorInfo.batDateCodeYear || '',
      CheckAccuracy: this.generatorInfo.checkAccuracy || '',
      ControlPanelNotes: this.generatorInfo.controlPanelNotes || '',
      EngHours: this.generatorInfo.engHours || '',
      OilPressureCold: this.generatorInfo.oilPressureCold || '',
      WaterTemp: this.generatorInfo.waterTemp || '',
      CheckEngLeaks: this.generatorInfo.checkEngLeaks || '',
      Tachometer: this.generatorInfo.tachometer || '',
      OilPressureHot: this.generatorInfo.oilPressureHot || '',
      TestOvercrank: this.generatorInfo.testOvercrank || '',
      CheckAllAlarms: this.generatorInfo.checkAllAlarms || '',
      Freq: this.generatorInfo.freq || '',
      CurrentA: this.generatorInfo.currentA || '',
      CurrentB: this.generatorInfo.currentB || '',
      CurrentC: this.generatorInfo.currentC || '',
      VoltageAB: this.generatorInfo.voltageAB || '',
      VoltageBC: this.generatorInfo.voltageBC || '',
      VoltageCA: this.generatorInfo.voltageCA || '',
      VoltageAN: this.generatorInfo.voltageAN || '',
      VoltageBN: this.generatorInfo.voltageBN || '',
      VoltageCN: this.generatorInfo.voltageCN || '',
      GenLocation: this.generatorInfo.genLocation || '',
      SiteIDNum: this.generatorInfo.siteIDNum || '',
      EngModel: this.generatorInfo.engineModel || '',
      EngSN: this.generatorInfo.engineSN || '',
      Manuf: this.generatorInfo.manufacturer || '',
      OilFilterPartNum: this.generatorInfo.oilFilterPartNum || '',
      NumOilFilter: this.generatorInfo.numOilFilters || '',
      FuelFilterPartNum: this.generatorInfo.fuelFilterPartNum || '',
      NumFuelFilter: this.generatorInfo.numFuelFilters || '',
      CoolantFilterpartNum: this.generatorInfo.coolantFilterPartNum || '',
      NumCoolantFilter: this.generatorInfo.numCoolantFilters || '',
      AirFilterPartNum: this.generatorInfo.airFilterPartNum || '',
      NumAirFilter: this.generatorInfo.numAirFilters || '',
      WaterSepPartNum: this.generatorInfo.waterSepPartNum || '',
      NumWaterSepFilter: this.generatorInfo.numWaterSepFilters || '',
      AmtOil: this.generatorInfo.amtOil || '',
      AmtCoolant: this.generatorInfo.amtCoolant || '',
      Bat1SG2: this.generatorInfo.bat1SG2 || '',
      Bat1SG4: this.generatorInfo.bat1SG4 || '',
      Bat3SG2: this.generatorInfo.bat3SG2 || '',
      Bat3SG4: this.generatorInfo.bat3SG4 || ''
    };

    this.equipmentService.updateGeneratorInfo(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Generator readings saved successfully!';
        this.toastr.success(this.successMessage);
        setTimeout(() => {
          this.goBack();
        }, 1500);
      },
      error: (error: any) => {
        this.isSaving = false;
        this.errorMessage = error.message || 'Error saving generator readings';
        this.toastr.error(this.errorMessage);
        console.error('Error saving generator data:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId,
        TechName: this.techName,
        Archive: this.archive,
        Year: this.year
      }
    });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
