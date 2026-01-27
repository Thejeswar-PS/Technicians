import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { StsService } from 'src/app/core/services/sts.service';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { BatteryReadingsService } from 'src/app/core/services/battery-readings.service';
import { STSReadings, STSReconciliationInfo, STS_VOLTAGE_CONFIGS, STS_OUTPUT_VOLTAGE_CONFIGS, VoltageConfiguration } from 'src/app/core/model/sts-readings.model';
import { EquipFilterCurrents } from 'src/app/core/model/ups-readings.model';

@Component({
  selector: 'app-sts-readings',
  templateUrl: './sts-readings.component.html',
  styleUrls: ['./sts-readings.component.scss']
})
export class StsReadingsComponent implements OnInit {
  // Route parameters
  callNbr: string = '';
  equipId: number = 0;
  stsId: string = '';
  techId: string = '';
  techName: string = '';
  digest: string = '';

  // Form groups
  equipmentForm!: FormGroup;
  reconciliationForm!: FormGroup;
  visualForm!: FormGroup;
  inputSource1Form!: FormGroup;
  inputSource2Form!: FormGroup;
  outputForm!: FormGroup;
  transferVerificationForm!: FormGroup;
  commentsForm!: FormGroup;

  // Dropdown options
  manufacturers: Array<{ value: string; label: string }> = [];
  statusOptions = [
    { value: 'Online', label: 'On-Line' },
    { value: 'CriticalDeficiency', label: 'Critical Deficiency' },
    { value: 'OnLine(MajorDeficiency)', label: 'On-Line(Major Deficiency)' },
    { value: 'OnLine(MinorDeficiency)', label: 'On-Line(Minor Deficiency)' },
    { value: 'Offline', label: 'Off-Line' }
  ];

  passFailOptions = [
    { value: 'P', label: 'Pass' },
    { value: 'F', label: 'Fail' },
    { value: 'A', label: 'N/A' }
  ];

  yesNoOptions = [
    { value: 'YS', label: 'Yes' },
    { value: 'NO', label: 'No' },
    { value: 'NA', label: 'N/A' }
  ];

  voltageConfigs = STS_VOLTAGE_CONFIGS;
  outputVoltageConfigs = STS_OUTPUT_VOLTAGE_CONFIGS;

  // UI state
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  
  // Filter Current and THD visibility
  showInputSrc1FilterCurrent = false;
  showInputSrc1THD = false;
  showInputSrc2FilterCurrent = false;
  showInputSrc2THD = false;
  showOutputFilterCurrent = false;
  showOutputTHD = false;
  filterCurrentsData: EquipFilterCurrents | null = null;

  // Current voltage selections
  selectedInputSource1: string = '0';
  selectedInputSource2: string = '0';
  selectedOutput: string = '0';

  // Visibility flags for voltage sections - Input Source 1
  showInputSrc1_120 = false;
  showInputSrc1_240 = false;
  showInputSrc1_208 = false;
  showInputSrc1_480 = false;
  showInputSrc1_575 = false;
  showInputSrc1_600 = false;

  // Visibility flags for voltage sections - Input Source 2
  showInputSrc2_120 = false;
  showInputSrc2_240 = false;
  showInputSrc2_208 = false;
  showInputSrc2_480 = false;
  showInputSrc2_575 = false;
  showInputSrc2_600 = false;

  // Visibility flags for output voltage sections
  showOutput120 = false;
  showOutput240 = false;
  showOutput208 = false;
  showOutput480 = false;
  showOutput575 = false;
  showOutput600 = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private stsService: StsService,
    private equipmentService: EquipmentService,
    private batteryService: BatteryReadingsService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRouteParams();
    this.initializeForms();
    this.setupReconciliationValidation();
    this.setupFilterCurrentCheckboxHandlers();
    this.loadManufacturers();
    this.loadData();
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.equipId = parseInt(params['EquipId'] || '0');
      this.stsId = decodeURIComponent(params['STSId'] || '');
      this.techId = params['Tech'] || '';
      this.techName = params['TechName'] || '';
      this.digest = params['Digest'] || '';
    });
  }

  private initializeForms(): void {
    // Equipment Verification Form
    this.equipmentForm = this.fb.group({
      manufacturer: ['', Validators.required],
      modelNo: [''],
      serialNo: ['', Validators.required],
      location: ['', Validators.required],
      dateCode: [null],
      kva: [''],
      temperature: [''],
      status: ['Online'],
      statusNotes: ['']
    });

    // Reconciliation Form
    this.reconciliationForm = this.fb.group({
      recModel: [''],
      recModelCorrect: ['YS'],
      actModel: [''],
      recSerialNo: [''],
      recSerialNoCorrect: ['YS'],
      actSerialNo: [''],
      kvaSize: [''],
      kvaCorrect: ['YS'],
      actKVA: [''],
      totalEquips: [''],
      totalEquipsCorrect: ['YS'],
      actTotalEquips: [''],
      verified: [false]
    });

    // Visual and Mechanical Form
    this.visualForm = this.fb.group({
      busswork: ['P'],
      transformers: ['P'],
      powerConn: ['P'],
      mainCirBreaks: ['P'],
      subfeedCirBreaks: ['P'],
      currentCTs: ['P'],
      circuitBoards: ['P'],
      filterCapacitors: ['P'],
      epoConn: ['P'],
      wiringConn: ['P'],
      ribbonCables: ['P'],
      compAirClean: ['P'],
      frontPanel: ['P'],
      internalPower: ['P'],
      localMonitoring: ['P'],
      localEPO: ['P'],
      comments1: ['']
    });

    // Input Source 1 Form
    this.inputSource1Form = this.fb.group({
      inputSource1: ['0'],
      inputSrc1FilterCurrent: [false],
      inputSrc1ThdPercent: [false],
      // 120V
      src1_120VoltA: ['120'],
      src1_120VoltA_PF: ['P'],
      src1_120CurrA: [''],
      src1_120CurrA_PF: ['P'],
      src1_120Freq: ['60'],
      src1_120Freq_PF: ['P'],
      // 240V
      src1_240VoltA: ['120'],
      src1_240VoltA_PF: ['P'],
      src1_240VoltB: ['120'],
      src1_240VoltB_PF: ['P'],
      src1_240CurrA: [''],
      src1_240CurrA_PF: ['P'],
      src1_240CurrB: [''],
      src1_240CurrB_PF: ['P'],
      src1_240Freq: ['60'],
      src1_240Freq_PF: ['P'],
      // 208V
      src1_208VoltAB: ['208'],
      src1_208VoltAB_PF: ['P'],
      src1_208VoltBC: ['208'],
      src1_208VoltBC_PF: ['P'],
      src1_208VoltCA: ['208'],
      src1_208VoltCA_PF: ['P'],
      src1_208CurrA: [''],
      src1_208CurrA_PF: ['P'],
      src1_208CurrB: [''],
      src1_208CurrB_PF: ['P'],
      src1_208CurrC: [''],
      src1_208CurrC_PF: ['P'],
      src1_208Freq: ['60'],
      src1_208Freq_PF: ['P'],
      // 480V
      src1_480VoltAB: ['480'],
      src1_480VoltAB_PF: ['P'],
      src1_480VoltBC: ['480'],
      src1_480VoltBC_PF: ['P'],
      src1_480VoltCA: ['480'],
      src1_480VoltCA_PF: ['P'],
      src1_480CurrA: [''],
      src1_480CurrA_PF: ['P'],
      src1_480CurrB: [''],
      src1_480CurrB_PF: ['P'],
      src1_480CurrC: [''],
      src1_480CurrC_PF: ['P'],
      src1_480Freq: ['60'],
      src1_480Freq_PF: ['P'],
      // 575V
      src1_575VoltAB: ['575'],
      src1_575VoltAB_PF: ['P'],
      src1_575VoltBC: ['575'],
      src1_575VoltBC_PF: ['P'],
      src1_575VoltCA: ['575'],
      src1_575VoltCA_PF: ['P'],
      src1_575CurrA: [''],
      src1_575CurrA_PF: ['P'],
      src1_575CurrB: [''],
      src1_575CurrB_PF: ['P'],
      src1_575CurrC: [''],
      src1_575CurrC_PF: ['P'],
      src1_575Freq: ['60'],
      src1_575Freq_PF: ['P'],
      // 600V
      src1_600VoltAB: ['600'],
      src1_600VoltAB_PF: ['P'],
      src1_600VoltBC: ['600'],
      src1_600VoltBC_PF: ['P'],
      src1_600VoltCA: ['600'],
      src1_600VoltCA_PF: ['P'],
      src1_600CurrA: [''],
      src1_600CurrA_PF: ['P'],
      src1_600CurrB: [''],
      src1_600CurrB_PF: ['P'],
      src1_600CurrC: [''],
      src1_600CurrC_PF: ['P'],
      src1_600Freq: ['60'],
      src1_600Freq_PF: ['P'],

      // Input Source 1 Filter Current detail fields
      src1FilterCurrentA: [''],
      src1FilterCurrentA_PF: ['P'],
      src1FilterCurrentB: [''],
      src1FilterCurrentB_PF: ['P'],
      src1FilterCurrentC: [''],
      src1FilterCurrentC_PF: ['P'],

      // Input Source 1 THD detail fields
      src1ThdA: [''],
      src1ThdA_PF: ['P'],
      src1ThdB: [''],
      src1ThdB_PF: ['P'],
      src1ThdC: [''],
      src1ThdC_PF: ['P']
    });

    // Input Source 2 Form
    this.inputSource2Form = this.fb.group({
      inputSource2: ['0'],
      inputSrc2FilterCurrent: [false],
      inputSrc2ThdPercent: [false],
      // 120V
      src2_120VoltA: ['120'],
      src2_120VoltA_PF: ['P'],
      src2_120CurrA: [''],
      src2_120CurrA_PF: ['P'],
      src2_120Freq: ['60'],
      src2_120Freq_PF: ['P'],
      // 240V
      src2_240VoltA: ['120'],
      src2_240VoltA_PF: ['P'],
      src2_240VoltB: ['120'],
      src2_240VoltB_PF: ['P'],
      src2_240CurrA: [''],
      src2_240CurrA_PF: ['P'],
      src2_240CurrB: [''],
      src2_240CurrB_PF: ['P'],
      src2_240Freq: ['60'],
      src2_240Freq_PF: ['P'],
      // 208V
      src2_208VoltAB: ['208'],
      src2_208VoltAB_PF: ['P'],
      src2_208VoltBC: ['208'],
      src2_208VoltBC_PF: ['P'],
      src2_208VoltCA: ['208'],
      src2_208VoltCA_PF: ['P'],
      src2_208CurrA: [''],
      src2_208CurrA_PF: ['P'],
      src2_208CurrB: [''],
      src2_208CurrB_PF: ['P'],
      src2_208CurrC: [''],
      src2_208CurrC_PF: ['P'],
      src2_208Freq: ['60'],
      src2_208Freq_PF: ['P'],
      // 480V
      src2_480VoltAB: ['480'],
      src2_480VoltAB_PF: ['P'],
      src2_480VoltBC: ['480'],
      src2_480VoltBC_PF: ['P'],
      src2_480VoltCA: ['480'],
      src2_480VoltCA_PF: ['P'],
      src2_480CurrA: [''],
      src2_480CurrA_PF: ['P'],
      src2_480CurrB: [''],
      src2_480CurrB_PF: ['P'],
      src2_480CurrC: [''],
      src2_480CurrC_PF: ['P'],
      src2_480Freq: ['60'],
      src2_480Freq_PF: ['P'],
      // 575V
      src2_575VoltAB: ['575'],
      src2_575VoltAB_PF: ['P'],
      src2_575VoltBC: ['575'],
      src2_575VoltBC_PF: ['P'],
      src2_575VoltCA: ['575'],
      src2_575VoltCA_PF: ['P'],
      src2_575CurrA: [''],
      src2_575CurrA_PF: ['P'],
      src2_575CurrB: [''],
      src2_575CurrB_PF: ['P'],
      src2_575CurrC: [''],
      src2_575CurrC_PF: ['P'],
      src2_575Freq: ['60'],
      src2_575Freq_PF: ['P'],
      // 600V
      src2_600VoltAB: ['600'],
      src2_600VoltAB_PF: ['P'],
      src2_600VoltBC: ['600'],
      src2_600VoltBC_PF: ['P'],
      src2_600VoltCA: ['600'],
      src2_600VoltCA_PF: ['P'],
      src2_600CurrA: [''],
      src2_600CurrA_PF: ['P'],
      src2_600CurrB: [''],
      src2_600CurrB_PF: ['P'],
      src2_600CurrC: [''],
      src2_600CurrC_PF: ['P'],
      src2_600Freq: ['60'],
      src2_600Freq_PF: ['P'],

      // Input Source 2 Filter Current detail fields
      src2FilterCurrentA: [''],
      src2FilterCurrentA_PF: ['P'],
      src2FilterCurrentB: [''],
      src2FilterCurrentB_PF: ['P'],
      src2FilterCurrentC: [''],
      src2FilterCurrentC_PF: ['P'],

      // Input Source 2 THD detail fields
      src2ThdA: [''],
      src2ThdA_PF: ['P'],
      src2ThdB: [''],
      src2ThdB_PF: ['P'],
      src2ThdC: [''],
      src2ThdC_PF: ['P']
    });

    // Output Form
    this.outputForm = this.fb.group({
      output: ['0'],
      outputFilterCurrent: [false],
      outputThdPercent: [false],
      // 120V Output
      output120VoltA: ['120'],
      output120VoltA_PF: ['P'],
      output120CurrA: [''],
      output120CurrA_PF: ['P'],
      output120LoadA: [''],
      output120LoadA_PF: ['P'],
      output120TotalLoad: [''],
      output120Freq: ['60'],
      output120Freq_PF: ['P'],
      // 240V Output
      output240VoltA: ['120'],
      output240VoltA_PF: ['P'],
      output240VoltB: ['120'],
      output240VoltB_PF: ['P'],
      output240CurrA: [''],
      output240CurrA_PF: ['P'],
      output240CurrB: [''],
      output240CurrB_PF: ['P'],
      output240LoadA: [''],
      output240LoadA_PF: ['P'],
      output240LoadB: [''],
      output240LoadB_PF: ['P'],
      output240TotalLoad: [''],
      output240Freq: ['60'],
      output240Freq_PF: ['P'],
      // 208V Output
      output208VoltAB: ['208'],
      output208VoltAB_PF: ['P'],
      output208VoltBC: ['208'],
      output208VoltBC_PF: ['P'],
      output208VoltCA: ['208'],
      output208VoltCA_PF: ['P'],
      output208CurrA: [''],
      output208CurrA_PF: ['P'],
      output208CurrB: [''],
      output208CurrB_PF: ['P'],
      output208CurrC: [''],
      output208CurrC_PF: ['P'],
      output208LoadA: [''],
      output208LoadA_PF: ['P'],
      output208LoadB: [''],
      output208LoadB_PF: ['P'],
      output208LoadC: [''],
      output208LoadC_PF: ['P'],
      output208TotalLoad: [''],
      output208Freq: ['60'],
      output208Freq_PF: ['P'],
      // 480V Output
      output480VoltAB: ['480'],
      output480VoltAB_PF: ['P'],
      output480VoltBC: ['480'],
      output480VoltBC_PF: ['P'],
      output480VoltCA: ['480'],
      output480VoltCA_PF: ['P'],
      output480CurrA: [''],
      output480CurrA_PF: ['P'],
      output480CurrB: [''],
      output480CurrB_PF: ['P'],
      output480CurrC: [''],
      output480CurrC_PF: ['P'],
      output480LoadA: [''],
      output480LoadA_PF: ['P'],
      output480LoadB: [''],
      output480LoadB_PF: ['P'],
      output480LoadC: [''],
      output480LoadC_PF: ['P'],
      output480TotalLoad: [''],
      output480Freq: ['60'],
      output480Freq_PF: ['P'],
      // 575V Output
      output575VoltAB: ['575'],
      output575VoltAB_PF: ['P'],
      output575VoltBC: ['575'],
      output575VoltBC_PF: ['P'],
      output575VoltCA: ['575'],
      output575VoltCA_PF: ['P'],
      output575CurrA: [''],
      output575CurrA_PF: ['P'],
      output575CurrB: [''],
      output575CurrB_PF: ['P'],
      output575CurrC: [''],
      output575CurrC_PF: ['P'],
      output575LoadA: [''],
      output575LoadA_PF: ['P'],
      output575LoadB: [''],
      output575LoadB_PF: ['P'],
      output575LoadC: [''],
      output575LoadC_PF: ['P'],
      output575TotalLoad: [''],
      output575Freq: ['60'],
      output575Freq_PF: ['P'],
      // 600V Output
      output600VoltAB: ['600'],
      output600VoltAB_PF: ['P'],
      output600VoltBC: ['600'],
      output600VoltBC_PF: ['P'],
      output600VoltCA: ['600'],
      output600VoltCA_PF: ['P'],
      output600CurrA: [''],
      output600CurrA_PF: ['P'],
      output600CurrB: [''],
      output600CurrB_PF: ['P'],
      output600CurrC: [''],
      output600CurrC_PF: ['P'],
      output600LoadA: [''],
      output600LoadA_PF: ['P'],
      output600LoadB: [''],
      output600LoadB_PF: ['P'],
      output600LoadC: [''],
      output600LoadC_PF: ['P'],
      output600TotalLoad: [''],
      output600Freq: ['60'],
      output600Freq_PF: ['P'],

      // Output Filter Current detail fields
      outputFilterCurrentA: [''],
      outputFilterCurrentA_PF: ['P'],
      outputFilterCurrentB: [''],
      outputFilterCurrentB_PF: ['P'],
      outputFilterCurrentC: [''],
      outputFilterCurrentC_PF: ['P'],

      // Output THD detail fields
      outputThdA: [''],
      outputThdA_PF: ['P'],
      outputThdB: [''],
      outputThdB_PF: ['P'],
      outputThdC: [''],
      outputThdC_PF: ['P']
    });

    // Transfer Verification Form
    this.transferVerificationForm = this.fb.group({
      transferVerification: ['P'],
      prefAlter: ['P'],
      transByPass: ['P'],
      stsByPass: ['P'],
      verifyAlarm: ['P']
    });

    // Comments Form
    this.commentsForm = this.fb.group({
      comments5: ['']
    });
  }

  private setupReconciliationValidation(): void {
    const pairs = [
      { correct: 'recModelCorrect', actual: 'actModel' },
      { correct: 'recSerialNoCorrect', actual: 'actSerialNo' },
      { correct: 'kvaCorrect', actual: 'actKVA' },
      { correct: 'totalEquipsCorrect', actual: 'actTotalEquips' }
    ];

    pairs.forEach(({ correct, actual }) => {
      const correctCtrl = this.reconciliationForm?.get(correct);
      if (!correctCtrl) return;

      // Apply initial state
      this.applyReconciliationRule(correct, actual, correctCtrl.value);

      // React to future changes
      correctCtrl.valueChanges.subscribe(value => {
        this.applyReconciliationRule(correct, actual, value);
      });
    });
  }

  private applyReconciliationRule(correctControlName: string, actualControlName: string, currentValue?: any): void {
    const actualCtrl = this.reconciliationForm?.get(actualControlName);
    const correctCtrl = this.reconciliationForm?.get(correctControlName);
    const correctValue = currentValue !== undefined ? currentValue : correctCtrl?.value;

    if (!actualCtrl) {
      return;
    }

    const isIncorrect = correctValue === 'NO';

    if (isIncorrect) {
      actualCtrl.enable({ emitEvent: false });
      actualCtrl.setValidators([Validators.required]);
    } else {
      actualCtrl.disable({ emitEvent: false });
      actualCtrl.clearValidators();
    }

    actualCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private async loadManufacturers(): Promise<void> {
    try {
      this.equipmentService.getManufacturerNames().subscribe({
        next: (manufacturers) => {
          const list = Array.isArray(manufacturers) ? manufacturers : [];
          this.manufacturers = list
            .filter((m: any) => m)
            .map((m: any) => ({
              value: (m.manufID || m.vendorId || m.id || m.value || '').toString().trim(),
              label: (m.manufName || m.vendorNm || m.name || m.label || m.text || '').toString().trim()
            }))
            .filter(m => m.value && m.label);
        },
        error: (error) => {
          console.error('Error loading manufacturers:', error);
          this.toastr.error('Failed to load manufacturers');
        }
      });
    } catch (error) {
      console.error('Error loading manufacturers:', error);
      this.toastr.error('Failed to load manufacturers');
    }
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    
    try {
      const [readings, equipInfo] = await Promise.all([
        this.stsService.getSTSReadings(this.callNbr, this.equipId, this.stsId).toPromise(),
        this.equipmentService.editEquipInfo(this.callNbr, this.equipId, this.stsId).toPromise()
      ]);

      if (readings) {
        this.populateForms(readings);
      } else if (equipInfo) {
        // Populate equipment info for new readings
        this.equipmentForm.patchValue({
          manufacturer: equipInfo.vendorId || '',
          modelNo: equipInfo.model || '',
          serialNo: equipInfo.serialNo || '',
          location: equipInfo.location || '',
          kva: equipInfo.kva || ''
        });
      }

      // Load reconciliation data
      await this.loadReconciliationInfo();

      // Load filter currents data
      await this.loadFilterCurrentsData();

    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.status !== 404) {
        this.errorMessage = 'Failed to load STS data';
        this.toastr.error(this.errorMessage);
      }
    } finally {
      this.loading = false;
    }
  }

  private async loadReconciliationInfo(): Promise<void> {
    try {
      const reconInfo = await this.batteryService.getEquipReconciliationInfo(this.callNbr, this.equipId).toPromise();
      if (reconInfo) {
        this.reconciliationForm.patchValue({
          recModel: reconInfo.model || '',
          recModelCorrect: reconInfo.modelCorrect || 'YS',
          actModel: reconInfo.actModel || '',
          recSerialNo: reconInfo.serialNo || '',
          recSerialNoCorrect: reconInfo.serialNoCorrect || 'YS',
          actSerialNo: reconInfo.actSerialNo || '',
          kvaSize: reconInfo.kva || '',
          kvaCorrect: reconInfo.kvaCorrect || 'YS',
          actKVA: reconInfo.actKva || '',
          totalEquips: reconInfo.totalEquips || '',
          totalEquipsCorrect: reconInfo.totalEquipsCorrect || 'YS',
          actTotalEquips: reconInfo.actTotalEquips || '',
          verified: reconInfo.verified || false
        });
      }
    } catch (error) {
      console.error('Error loading reconciliation info:', error);
    }
  }

  private populateForms(data: STSReadings): void {
    // Equipment form
    this.equipmentForm.patchValue({
      manufacturer: data.manufacturer?.trim() || '',
      modelNo: data.modelNo?.trim() || '',
      serialNo: data.serialNo?.trim() || '',
      location: data.location?.trim() || '',
      kva: data.kva?.trim() || '',
      temperature: data.temp || '',
      status: data.status?.trim() || 'Online',
      statusNotes: data.statusNotes?.trim() || ''
    });

    if (data.year && data.month) {
      const parsed = new Date(`${data.month} 1, ${data.year}`);
      if (!isNaN(parsed.getTime())) {
        this.equipmentForm.patchValue({ dateCode: parsed.toISOString().substring(0, 10) });
      }
    }

    // Visual form
    this.visualForm.patchValue({
      busswork: data.busswork || 'P',
      transformers: data.transformers || 'P',
      powerConn: data.powerConn || 'P',
      mainCirBreaks: data.mainCirBreaks || 'P',
      subfeedCirBreaks: data.subfeedCirBreaks || 'P',
      currentCTs: data.currentCTs || 'P',
      circuitBoards: data.circuitBoards || 'P',
      filterCapacitors: (data as any).fanCapacitors || data.filterCapacitors || 'P',
      epoConn: data.epoConn || 'P',
      wiringConn: data.wiringConn || 'P',
      ribbonCables: data.ribbonCables || 'P',
      compAirClean: data.compAirClean || 'P',
      frontPanel: data.frontPanel || 'P',
      internalPower: data.internalPower || 'P',
      localMonitoring: data.localMonitoring || 'P',
      localEPO: data.localEPO || 'P',
      comments1: data.comments || data.comments1 || ''
    });

    // Input source 1 (API uses 'input' field)
    const inputSource1 = (data as any).input || data.inputSource1;
    if (inputSource1) {
      this.selectedInputSource1 = inputSource1;
      this.inputSource1Form.patchValue({ inputSource1: inputSource1 });
      this.onInputSource1Change();
      
      // Map voltage-specific readings based on voltage type
      const apiData = data as any;
      if (inputSource1 === '1') { // 120V
        this.inputSource1Form.patchValue({
          src1_120VoltA: apiData.inputVoltA_T || data.inputSrc1VoltA_T || '',
          src1_120VoltA_PF: apiData.inputVoltA_PF || data.inputSrc1VoltA_PF || 'P',
          src1_120CurrA: apiData.inputCurrA_T || data.inputSrc1CurrA_T || '',
          src1_120CurrA_PF: apiData.inputCurrA_PF || data.inputSrc1CurrA_PF || 'P',
          src1_120Freq: apiData.inputFreq_T || data.inputSrc1Freq_T || 60,
          src1_120Freq_PF: apiData.inputFreq_PF || data.inputSrc1Freq_PF || 'P'
        });
      } else if (inputSource1 === '2') { // 240V
        this.inputSource1Form.patchValue({
          src1_240VoltA: apiData.inputVoltA_T || data.inputSrc1VoltA_T || '',
          src1_240VoltA_PF: apiData.inputVoltA_PF || data.inputSrc1VoltA_PF || 'P',
          src1_240VoltB: apiData.inputVoltB_T || data.inputSrc1VoltB_T || '',
          src1_240VoltB_PF: apiData.inputVoltB_PF || data.inputSrc1VoltB_PF || 'P',
          src1_240CurrA: apiData.inputCurrA_T || data.inputSrc1CurrA_T || '',
          src1_240CurrA_PF: apiData.inputCurrA_PF || data.inputSrc1CurrA_PF || 'P',
          src1_240CurrB: apiData.inputCurrB_T || data.inputSrc1CurrB_T || '',
          src1_240CurrB_PF: apiData.inputCurrB_PF || data.inputSrc1CurrB_PF || 'P',
          src1_240Freq: apiData.inputFreq_T || data.inputSrc1Freq_T || 60,
          src1_240Freq_PF: apiData.inputFreq_PF || data.inputSrc1Freq_PF || 'P'
        });
      } else if (inputSource1 === '3') { // 208V
        this.inputSource1Form.patchValue({
          src1_208VoltAB: apiData.inputVoltA_T || data.inputSrc1VoltA_T || '',
          src1_208VoltAB_PF: apiData.inputVoltA_PF || data.inputSrc1VoltA_PF || 'P',
          src1_208VoltBC: apiData.inputVoltB_T || data.inputSrc1VoltB_T || '',
          src1_208VoltBC_PF: apiData.inputVoltB_PF || data.inputSrc1VoltB_PF || 'P',
          src1_208VoltCA: apiData.inputVoltC_T || data.inputSrc1VoltC_T || '',
          src1_208VoltCA_PF: apiData.inputVoltC_PF || data.inputSrc1VoltC_PF || 'P',
          src1_208CurrA: apiData.inputCurrA_T || data.inputSrc1CurrA_T || '',
          src1_208CurrA_PF: apiData.inputCurrA_PF || data.inputSrc1CurrA_PF || 'P',
          src1_208CurrB: apiData.inputCurrB_T || data.inputSrc1CurrB_T || '',
          src1_208CurrB_PF: apiData.inputCurrB_PF || data.inputSrc1CurrB_PF || 'P',
          src1_208CurrC: apiData.inputCurrC_T || data.inputSrc1CurrC_T || '',
          src1_208CurrC_PF: apiData.inputCurrC_PF || data.inputSrc1CurrC_PF || 'P',
          src1_208Freq: apiData.inputFreq_T || data.inputSrc1Freq_T || 60,
          src1_208Freq_PF: apiData.inputFreq_PF || data.inputSrc1Freq_PF || 'P'
        });
      } else if (inputSource1 === '4') { // 480V
        this.inputSource1Form.patchValue({
          src1_480VoltAB: apiData.inputVoltA_T || data.inputSrc1VoltA_T || '',
          src1_480VoltAB_PF: apiData.inputVoltA_PF || data.inputSrc1VoltA_PF || 'P',
          src1_480VoltBC: apiData.inputVoltB_T || data.inputSrc1VoltB_T || '',
          src1_480VoltBC_PF: apiData.inputVoltB_PF || data.inputSrc1VoltB_PF || 'P',
          src1_480VoltCA: apiData.inputVoltC_T || data.inputSrc1VoltC_T || '',
          src1_480VoltCA_PF: apiData.inputVoltC_PF || data.inputSrc1VoltC_PF || 'P',
          src1_480CurrA: apiData.inputCurrA_T || data.inputSrc1CurrA_T || '',
          src1_480CurrA_PF: apiData.inputCurrA_PF || data.inputSrc1CurrA_PF || 'P',
          src1_480CurrB: apiData.inputCurrB_T || data.inputSrc1CurrB_T || '',
          src1_480CurrB_PF: apiData.inputCurrB_PF || data.inputSrc1CurrB_PF || 'P',
          src1_480CurrC: apiData.inputCurrC_T || data.inputSrc1CurrC_T || '',
          src1_480CurrC_PF: apiData.inputCurrC_PF || data.inputSrc1CurrC_PF || 'P',
          src1_480Freq: apiData.inputFreq_T || data.inputSrc1Freq_T || 60,
          src1_480Freq_PF: apiData.inputFreq_PF || data.inputSrc1Freq_PF || 'P'
        });
      } else if (inputSource1 === '5') { // 600V
        this.inputSource1Form.patchValue({
          src1_600VoltAB: apiData.inputVoltA_T || data.inputSrc1VoltA_T || '',
          src1_600VoltAB_PF: apiData.inputVoltA_PF || data.inputSrc1VoltA_PF || 'P',
          src1_600VoltBC: apiData.inputVoltB_T || data.inputSrc1VoltB_T || '',
          src1_600VoltBC_PF: apiData.inputVoltB_PF || data.inputSrc1VoltB_PF || 'P',
          src1_600VoltCA: apiData.inputVoltC_T || data.inputSrc1VoltC_T || '',
          src1_600VoltCA_PF: apiData.inputVoltC_PF || data.inputSrc1VoltC_PF || 'P',
          src1_600CurrA: apiData.inputCurrA_T || data.inputSrc1CurrA_T || '',
          src1_600CurrA_PF: apiData.inputCurrA_PF || data.inputSrc1CurrA_PF || 'P',
          src1_600CurrB: apiData.inputCurrB_T || data.inputSrc1CurrB_T || '',
          src1_600CurrB_PF: apiData.inputCurrB_PF || data.inputSrc1CurrB_PF || 'P',
          src1_600CurrC: apiData.inputCurrC_T || data.inputSrc1CurrC_T || '',
          src1_600CurrC_PF: apiData.inputCurrC_PF || data.inputSrc1CurrC_PF || 'P',
          src1_600Freq: apiData.inputFreq_T || data.inputSrc1Freq_T || 60,
          src1_600Freq_PF: apiData.inputFreq_PF || data.inputSrc1Freq_PF || 'P'
        });
      } else if (inputSource1 === '6') { // 575V
        this.inputSource1Form.patchValue({
          src1_575VoltAB: apiData.inputVoltA_T || data.inputSrc1VoltA_T || '',
          src1_575VoltAB_PF: apiData.inputVoltA_PF || data.inputSrc1VoltA_PF || 'P',
          src1_575VoltBC: apiData.inputVoltB_T || data.inputSrc1VoltB_T || '',
          src1_575VoltBC_PF: apiData.inputVoltB_PF || data.inputSrc1VoltB_PF || 'P',
          src1_575VoltCA: apiData.inputVoltC_T || data.inputSrc1VoltC_T || '',
          src1_575VoltCA_PF: apiData.inputVoltC_PF || data.inputSrc1VoltC_PF || 'P',
          src1_575CurrA: apiData.inputCurrA_T || data.inputSrc1CurrA_T || '',
          src1_575CurrA_PF: apiData.inputCurrA_PF || data.inputSrc1CurrA_PF || 'P',
          src1_575CurrB: apiData.inputCurrB_T || data.inputSrc1CurrB_T || '',
          src1_575CurrB_PF: apiData.inputCurrB_PF || data.inputSrc1CurrB_PF || 'P',
          src1_575CurrC: apiData.inputCurrC_T || data.inputSrc1CurrC_T || '',
          src1_575CurrC_PF: apiData.inputCurrC_PF || data.inputSrc1CurrC_PF || 'P',
          src1_575Freq: apiData.inputFreq_T || data.inputSrc1Freq_T || 60,
          src1_575Freq_PF: apiData.inputFreq_PF || data.inputSrc1Freq_PF || 'P'
        });
      }
    }

    // Input source 2 (API uses 'srcTwo' field)
    const inputSource2 = (data as any).srcTwo || data.inputSource2;
    if (inputSource2) {
      this.selectedInputSource2 = inputSource2;
      this.inputSource2Form.patchValue({ inputSource2: inputSource2 });
      this.onInputSource2Change();
      
      // Map voltage-specific readings based on voltage type
      const apiData = data as any;
      if (inputSource2 === '1') { // 120V
        this.inputSource2Form.patchValue({
          src2_120VoltA: apiData.srcTwoVoltA_T || data.inputSrc2VoltA_T || '',
          src2_120VoltA_PF: apiData.srcTwoVoltA_PF || data.inputSrc2VoltA_PF || 'P',
          src2_120CurrA: apiData.srcTwoCurrA_T || data.inputSrc2CurrA_T || '',
          src2_120CurrA_PF: apiData.srcTwoCurrA_PF || data.inputSrc2CurrA_PF || 'P',
          src2_120Freq: apiData.srcTwoFreq_T || data.inputSrc2Freq_T || 60,
          src2_120Freq_PF: apiData.srcTwoFreq_PF || data.inputSrc2Freq_PF || 'P'
        });
      } else if (inputSource2 === '2') { // 240V
        this.inputSource2Form.patchValue({
          src2_240VoltA: apiData.srcTwoVoltA_T || data.inputSrc2VoltA_T || '',
          src2_240VoltA_PF: apiData.srcTwoVoltA_PF || data.inputSrc2VoltA_PF || 'P',
          src2_240VoltB: apiData.srcTwoVoltB_T || data.inputSrc2VoltB_T || '',
          src2_240VoltB_PF: apiData.srcTwoVoltB_PF || data.inputSrc2VoltB_PF || 'P',
          src2_240CurrA: apiData.srcTwoCurrA_T || data.inputSrc2CurrA_T || '',
          src2_240CurrA_PF: apiData.srcTwoCurrA_PF || data.inputSrc2CurrA_PF || 'P',
          src2_240CurrB: apiData.srcTwoCurrB_T || data.inputSrc2CurrB_T || '',
          src2_240CurrB_PF: apiData.srcTwoCurrB_PF || data.inputSrc2CurrB_PF || 'P',
          src2_240Freq: apiData.srcTwoFreq_T || data.inputSrc2Freq_T || 60,
          src2_240Freq_PF: apiData.srcTwoFreq_PF || data.inputSrc2Freq_PF || 'P'
        });
      } else if (inputSource2 === '3') { // 208V
        this.inputSource2Form.patchValue({
          src2_208VoltAB: apiData.srcTwoVoltA_T || data.inputSrc2VoltA_T || '',
          src2_208VoltAB_PF: apiData.srcTwoVoltA_PF || data.inputSrc2VoltA_PF || 'P',
          src2_208VoltBC: apiData.srcTwoVoltB_T || data.inputSrc2VoltB_T || '',
          src2_208VoltBC_PF: apiData.srcTwoVoltB_PF || data.inputSrc2VoltB_PF || 'P',
          src2_208VoltCA: apiData.srcTwoVoltC_T || data.inputSrc2VoltC_T || '',
          src2_208VoltCA_PF: apiData.srcTwoVoltC_PF || data.inputSrc2VoltC_PF || 'P',
          src2_208CurrA: apiData.srcTwoCurrA_T || data.inputSrc2CurrA_T || '',
          src2_208CurrA_PF: apiData.srcTwoCurrA_PF || data.inputSrc2CurrA_PF || 'P',
          src2_208CurrB: apiData.srcTwoCurrB_T || data.inputSrc2CurrB_T || '',
          src2_208CurrB_PF: apiData.srcTwoCurrB_PF || data.inputSrc2CurrB_PF || 'P',
          src2_208CurrC: apiData.srcTwoCurrC_T || data.inputSrc2CurrC_T || '',
          src2_208CurrC_PF: apiData.srcTwoCurrC_PF || data.inputSrc2CurrC_PF || 'P',
          src2_208Freq: apiData.srcTwoFreq_T || data.inputSrc2Freq_T || 60,
          src2_208Freq_PF: apiData.srcTwoFreq_PF || data.inputSrc2Freq_PF || 'P'
        });
      } else if (inputSource2 === '4') { // 480V
        this.inputSource2Form.patchValue({
          src2_480VoltAB: apiData.srcTwoVoltA_T || data.inputSrc2VoltA_T || '',
          src2_480VoltAB_PF: apiData.srcTwoVoltA_PF || data.inputSrc2VoltA_PF || 'P',
          src2_480VoltBC: apiData.srcTwoVoltB_T || data.inputSrc2VoltB_T || '',
          src2_480VoltBC_PF: apiData.srcTwoVoltB_PF || data.inputSrc2VoltB_PF || 'P',
          src2_480VoltCA: apiData.srcTwoVoltC_T || data.inputSrc2VoltC_T || '',
          src2_480VoltCA_PF: apiData.srcTwoVoltC_PF || data.inputSrc2VoltC_PF || 'P',
          src2_480CurrA: apiData.srcTwoCurrA_T || data.inputSrc2CurrA_T || '',
          src2_480CurrA_PF: apiData.srcTwoCurrA_PF || data.inputSrc2CurrA_PF || 'P',
          src2_480CurrB: apiData.srcTwoCurrB_T || data.inputSrc2CurrB_T || '',
          src2_480CurrB_PF: apiData.srcTwoCurrB_PF || data.inputSrc2CurrB_PF || 'P',
          src2_480CurrC: apiData.srcTwoCurrC_T || data.inputSrc2CurrC_T || '',
          src2_480CurrC_PF: apiData.srcTwoCurrC_PF || data.inputSrc2CurrC_PF || 'P',
          src2_480Freq: apiData.srcTwoFreq_T || data.inputSrc2Freq_T || 60,
          src2_480Freq_PF: apiData.srcTwoFreq_PF || data.inputSrc2Freq_PF || 'P'
        });
      } else if (inputSource2 === '5') { // 600V
        this.inputSource2Form.patchValue({
          src2_600VoltAB: apiData.srcTwoVoltA_T || data.inputSrc2VoltA_T || '',
          src2_600VoltAB_PF: apiData.srcTwoVoltA_PF || data.inputSrc2VoltA_PF || 'P',
          src2_600VoltBC: apiData.srcTwoVoltB_T || data.inputSrc2VoltB_T || '',
          src2_600VoltBC_PF: apiData.srcTwoVoltB_PF || data.inputSrc2VoltB_PF || 'P',
          src2_600VoltCA: apiData.srcTwoVoltC_T || data.inputSrc2VoltC_T || '',
          src2_600VoltCA_PF: apiData.srcTwoVoltC_PF || data.inputSrc2VoltC_PF || 'P',
          src2_600CurrA: apiData.srcTwoCurrA_T || data.inputSrc2CurrA_T || '',
          src2_600CurrA_PF: apiData.srcTwoCurrA_PF || data.inputSrc2CurrA_PF || 'P',
          src2_600CurrB: apiData.srcTwoCurrB_T || data.inputSrc2CurrB_T || '',
          src2_600CurrB_PF: apiData.srcTwoCurrB_PF || data.inputSrc2CurrB_PF || 'P',
          src2_600CurrC: apiData.srcTwoCurrC_T || data.inputSrc2CurrC_T || '',
          src2_600CurrC_PF: apiData.srcTwoCurrC_PF || data.inputSrc2CurrC_PF || 'P',
          src2_600Freq: apiData.srcTwoFreq_T || data.inputSrc2Freq_T || 60,
          src2_600Freq_PF: apiData.srcTwoFreq_PF || data.inputSrc2Freq_PF || 'P'
        });
      } else if (inputSource2 === '6') { // 575V
        this.inputSource2Form.patchValue({
          src2_575VoltAB: apiData.srcTwoVoltA_T || data.inputSrc2VoltA_T || '',
          src2_575VoltAB_PF: apiData.srcTwoVoltA_PF || data.inputSrc2VoltA_PF || 'P',
          src2_575VoltBC: apiData.srcTwoVoltB_T || data.inputSrc2VoltB_T || '',
          src2_575VoltBC_PF: apiData.srcTwoVoltB_PF || data.inputSrc2VoltB_PF || 'P',
          src2_575VoltCA: apiData.srcTwoVoltC_T || data.inputSrc2VoltC_T || '',
          src2_575VoltCA_PF: apiData.srcTwoVoltC_PF || data.inputSrc2VoltC_PF || 'P',
          src2_575CurrA: apiData.srcTwoCurrA_T || data.inputSrc2CurrA_T || '',
          src2_575CurrA_PF: apiData.srcTwoCurrA_PF || data.inputSrc2CurrA_PF || 'P',
          src2_575CurrB: apiData.srcTwoCurrB_T || data.inputSrc2CurrB_T || '',
          src2_575CurrB_PF: apiData.srcTwoCurrB_PF || data.inputSrc2CurrB_PF || 'P',
          src2_575CurrC: apiData.srcTwoCurrC_T || data.inputSrc2CurrC_T || '',
          src2_575CurrC_PF: apiData.srcTwoCurrC_PF || data.inputSrc2CurrC_PF || 'P',
          src2_575Freq: apiData.srcTwoFreq_T || data.inputSrc2Freq_T || 60,
          src2_575Freq_PF: apiData.srcTwoFreq_PF || data.inputSrc2Freq_PF || 'P'
        });
      }
    }

    // Output
    if (data.output) {
      this.selectedOutput = data.output;
      this.outputForm.patchValue({ output: data.output });
      this.onOutputChange();
      
      // Map voltage-specific output readings
      if (data.output === '1') { // 120V
        this.outputForm.patchValue({
          output120VoltA: data.outputVoltA_T || '',
          output120VoltA_PF: data.outputVoltA_PF || 'P',
          output120CurrA: data.outputCurrA_T || '',
          output120CurrA_PF: data.outputCurrA_PF || 'P',
          output120LoadA: data.outputLoadA || '',
          output120LoadA_PF: data.outputLoadA_PF || 'P',
          output120TotalLoad: data.totalLoad || '',
          output120Freq: data.outputFreq_T || 60,
          output120Freq_PF: data.outputFreq_PF || 'P'
        });
      } else if (data.output === '2') { // 240V
        this.outputForm.patchValue({
          output240VoltA: data.outputVoltA_T || '',
          output240VoltA_PF: data.outputVoltA_PF || 'P',
          output240VoltB: data.outputVoltB_T || '',
          output240VoltB_PF: data.outputVoltB_PF || 'P',
          output240CurrA: data.outputCurrA_T || '',
          output240CurrA_PF: data.outputCurrA_PF || 'P',
          output240CurrB: data.outputCurrB_T || '',
          output240CurrB_PF: data.outputCurrB_PF || 'P',
          output240LoadA: data.outputLoadA || '',
          output240LoadA_PF: data.outputLoadA_PF || 'P',
          output240LoadB: data.outputLoadB || '',
          output240LoadB_PF: data.outputLoadB_PF || 'P',
          output240TotalLoad: data.totalLoad || '',
          output240Freq: data.outputFreq_T || 60,
          output240Freq_PF: data.outputFreq_PF || 'P'
        });
      } else if (data.output === '3') { // 208V
        this.outputForm.patchValue({
          output208VoltAB: data.outputVoltA_T || '',
          output208VoltAB_PF: data.outputVoltA_PF || 'P',
          output208VoltBC: data.outputVoltB_T || '',
          output208VoltBC_PF: data.outputVoltB_PF || 'P',
          output208VoltCA: data.outputVoltC_T || '',
          output208VoltCA_PF: data.outputVoltC_PF || 'P',
          output208CurrA: data.outputCurrA_T || '',
          output208CurrA_PF: data.outputCurrA_PF || 'P',
          output208CurrB: data.outputCurrB_T || '',
          output208CurrB_PF: data.outputCurrB_PF || 'P',
          output208CurrC: data.outputCurrC_T || '',
          output208CurrC_PF: data.outputCurrC_PF || 'P',
          output208LoadA: data.outputLoadA || '',
          output208LoadA_PF: data.outputLoadA_PF || 'P',
          output208LoadB: data.outputLoadB || '',
          output208LoadB_PF: data.outputLoadB_PF || 'P',
          output208LoadC: data.outputLoadC || '',
          output208LoadC_PF: data.outputLoadC_PF || 'P',
          output208TotalLoad: data.totalLoad || '',
          output208Freq: data.outputFreq_T || 60,
          output208Freq_PF: data.outputFreq_PF || 'P'
        });
      } else if (data.output === '4') { // 480V
        this.outputForm.patchValue({
          output480VoltAB: data.outputVoltA_T || '',
          output480VoltAB_PF: data.outputVoltA_PF || 'P',
          output480VoltBC: data.outputVoltB_T || '',
          output480VoltBC_PF: data.outputVoltB_PF || 'P',
          output480VoltCA: data.outputVoltC_T || '',
          output480VoltCA_PF: data.outputVoltC_PF || 'P',
          output480CurrA: data.outputCurrA_T || '',
          output480CurrA_PF: data.outputCurrA_PF || 'P',
          output480CurrB: data.outputCurrB_T || '',
          output480CurrB_PF: data.outputCurrB_PF || 'P',
          output480CurrC: data.outputCurrC_T || '',
          output480CurrC_PF: data.outputCurrC_PF || 'P',
          output480LoadA: data.outputLoadA || '',
          output480LoadA_PF: data.outputLoadA_PF || 'P',
          output480LoadB: data.outputLoadB || '',
          output480LoadB_PF: data.outputLoadB_PF || 'P',
          output480LoadC: data.outputLoadC || '',
          output480LoadC_PF: data.outputLoadC_PF || 'P',
          output480TotalLoad: data.totalLoad || '',
          output480Freq: data.outputFreq_T || 60,
          output480Freq_PF: data.outputFreq_PF || 'P'
        });
      } else if (data.output === '5') { // 600V
        this.outputForm.patchValue({
          output600VoltAB: data.outputVoltA_T || '',
          output600VoltAB_PF: data.outputVoltA_PF || 'P',
          output600VoltBC: data.outputVoltB_T || '',
          output600VoltBC_PF: data.outputVoltB_PF || 'P',
          output600VoltCA: data.outputVoltC_T || '',
          output600VoltCA_PF: data.outputVoltC_PF || 'P',
          output600CurrA: data.outputCurrA_T || '',
          output600CurrA_PF: data.outputCurrA_PF || 'P',
          output600CurrB: data.outputCurrB_T || '',
          output600CurrB_PF: data.outputCurrB_PF || 'P',
          output600CurrC: data.outputCurrC_T || '',
          output600CurrC_PF: data.outputCurrC_PF || 'P',
          output600LoadA: data.outputLoadA || '',
          output600LoadA_PF: data.outputLoadA_PF || 'P',
          output600LoadB: data.outputLoadB || '',
          output600LoadB_PF: data.outputLoadB_PF || 'P',
          output600LoadC: data.outputLoadC || '',
          output600LoadC_PF: data.outputLoadC_PF || 'P',
          output600TotalLoad: data.totalLoad || '',
          output600Freq: data.outputFreq_T || 60,
          output600Freq_PF: data.outputFreq_PF || 'P'
        });
      } else if (data.output === '6') { // 575V
        this.outputForm.patchValue({
          output575VoltAB: data.outputVoltA_T || '',
          output575VoltAB_PF: data.outputVoltA_PF || 'P',
          output575VoltBC: data.outputVoltB_T || '',
          output575VoltBC_PF: data.outputVoltB_PF || 'P',
          output575VoltCA: data.outputVoltC_T || '',
          output575VoltCA_PF: data.outputVoltC_PF || 'P',
          output575CurrA: data.outputCurrA_T || '',
          output575CurrA_PF: data.outputCurrA_PF || 'P',
          output575CurrB: data.outputCurrB_T || '',
          output575CurrB_PF: data.outputCurrB_PF || 'P',
          output575CurrC: data.outputCurrC_T || '',
          output575CurrC_PF: data.outputCurrC_PF || 'P',
          output575LoadA: data.outputLoadA || '',
          output575LoadA_PF: data.outputLoadA_PF || 'P',
          output575LoadB: data.outputLoadB || '',
          output575LoadB_PF: data.outputLoadB_PF || 'P',
          output575LoadC: data.outputLoadC || '',
          output575LoadC_PF: data.outputLoadC_PF || 'P',
          output575TotalLoad: data.totalLoad || '',
          output575Freq: data.outputFreq_T || 60,
          output575Freq_PF: data.outputFreq_PF || 'P'
        });
      }
    }

    // Transfer verification (API uses 'tVerification' for transferVerification)
    const apiData = data as any;
    this.transferVerificationForm.patchValue({
      transferVerification: apiData.tVerification || data.transferVerification || 'P',
      prefAlter: data.prefAlter || 'P',
      transByPass: data.transByPass || 'P',
      stsByPass: data.stsByPass || 'P',
      verifyAlarm: data.verifyAlarm || 'P'
    });

    // Comments
    this.commentsForm.patchValue({
      comments5: data.comments5 || ''
    });
  }

  // Voltage selection change handlers
  onInputSource1Change(): void {
    this.selectedInputSource1 = this.inputSource1Form.get('inputSource1')?.value || '0';
    
    this.showInputSrc1_120 = this.selectedInputSource1 === '1';
    this.showInputSrc1_240 = this.selectedInputSource1 === '2';
    this.showInputSrc1_208 = this.selectedInputSource1 === '3';
    this.showInputSrc1_480 = this.selectedInputSource1 === '4';
    this.showInputSrc1_575 = this.selectedInputSource1 === '6';
    this.showInputSrc1_600 = this.selectedInputSource1 === '5';
  }

  onInputSource2Change(): void {
    this.selectedInputSource2 = this.inputSource2Form.get('inputSource2')?.value || '0';
    
    this.showInputSrc2_120 = this.selectedInputSource2 === '1';
    this.showInputSrc2_240 = this.selectedInputSource2 === '2';
    this.showInputSrc2_208 = this.selectedInputSource2 === '3';
    this.showInputSrc2_480 = this.selectedInputSource2 === '4';
    this.showInputSrc2_575 = this.selectedInputSource2 === '6';
    this.showInputSrc2_600 = this.selectedInputSource2 === '5';
  }

  onOutputChange(): void {
    this.selectedOutput = this.outputForm.get('output')?.value || '0';
    
    this.showOutput120 = this.selectedOutput === '1';
    this.showOutput240 = this.selectedOutput === '2';
    this.showOutput208 = this.selectedOutput === '3';
    this.showOutput480 = this.selectedOutput === '4';
    this.showOutput575 = this.selectedOutput === '6';
    this.showOutput600 = this.selectedOutput === '5';
  }

  private async loadFilterCurrentsData(): Promise<void> {
    try {
      const response = await this.equipmentService.getEquipFilterCurrents(this.callNbr, this.equipId).toPromise();
      if (response?.success && response.data) {
        this.filterCurrentsData = response.data;
        this.populateFilterCurrentsFromLegacyData(response.data);
      }
    } catch (error) {
      console.error('Error loading filter currents data:', error);
    }
  }

  private populateFilterCurrentsFromLegacyData(data: EquipFilterCurrents): void {
    if (!data) {
      return;
    }

    // Input Source 1 Filter Current data
    if (data.chkIpFilter) {
      this.inputSource1Form.patchValue({
        inputSrc1FilterCurrent: true,
        src1FilterCurrentA: this.convertZeroToEmpty(data.ipFilterCurrA_T),
        src1FilterCurrentA_PF: data.ipFilterCurrA_PF || 'P',
        src1FilterCurrentB: this.convertZeroToEmpty(data.ipFilterCurrB_T),
        src1FilterCurrentB_PF: data.ipFilterCurrB_PF || 'P',
        src1FilterCurrentC: this.convertZeroToEmpty(data.ipFilterCurrC_T),
        src1FilterCurrentC_PF: data.ipFilterCurrC_PF || 'P'
      });
      this.showInputSrc1FilterCurrent = true;
    }

    // Input Source 1 THD data
    if (data.chkIpThd) {
      this.inputSource1Form.patchValue({
        inputSrc1ThdPercent: true,
        src1ThdA: this.convertZeroToEmpty(data.ipFilterThdA_T),
        src1ThdA_PF: data.ipFilterThdA_PF || 'P',
        src1ThdB: this.convertZeroToEmpty(data.ipFilterThdB_T),
        src1ThdB_PF: data.ipFilterThdB_PF || 'P',
        src1ThdC: this.convertZeroToEmpty(data.ipFilterThdC_T),
        src1ThdC_PF: data.ipFilterThdC_PF || 'P'
      });
      this.showInputSrc1THD = true;
    }

    // Input Source 2 Filter Current data (using same backend fields as Input Source 1)
    // Note: STS has 2 input sources, so we reuse the same data for both if available
    if (data.chkIpFilter) {
      this.inputSource2Form.patchValue({
        inputSrc2FilterCurrent: true,
        src2FilterCurrentA: this.convertZeroToEmpty(data.ipFilterCurrA_T),
        src2FilterCurrentA_PF: data.ipFilterCurrA_PF || 'P',
        src2FilterCurrentB: this.convertZeroToEmpty(data.ipFilterCurrB_T),
        src2FilterCurrentB_PF: data.ipFilterCurrB_PF || 'P',
        src2FilterCurrentC: this.convertZeroToEmpty(data.ipFilterCurrC_T),
        src2FilterCurrentC_PF: data.ipFilterCurrC_PF || 'P'
      });
      this.showInputSrc2FilterCurrent = true;
    }

    // Input Source 2 THD data
    if (data.chkIpThd) {
      this.inputSource2Form.patchValue({
        inputSrc2ThdPercent: true,
        src2ThdA: this.convertZeroToEmpty(data.ipFilterThdA_T),
        src2ThdA_PF: data.ipFilterThdA_PF || 'P',
        src2ThdB: this.convertZeroToEmpty(data.ipFilterThdB_T),
        src2ThdB_PF: data.ipFilterThdB_PF || 'P',
        src2ThdC: this.convertZeroToEmpty(data.ipFilterThdC_T),
        src2ThdC_PF: data.ipFilterThdC_PF || 'P'
      });
      this.showInputSrc2THD = true;
    }

    // Output Filter Current data
    if (data.chkOpFilter) {
      this.outputForm.patchValue({
        outputFilterCurrent: true,
        outputFilterCurrentA: this.convertZeroToEmpty(data.opFilterCurrA_T),
        outputFilterCurrentA_PF: data.opFilterCurrA_PF || 'P',
        outputFilterCurrentB: this.convertZeroToEmpty(data.opFilterCurrB_T),
        outputFilterCurrentB_PF: data.opFilterCurrB_PF || 'P',
        outputFilterCurrentC: this.convertZeroToEmpty(data.opFilterCurrC_T),
        outputFilterCurrentC_PF: data.opFilterCurrC_PF || 'P'
      });
      this.showOutputFilterCurrent = true;
    }

    // Output THD data
    if (data.chkOpThd) {
      this.outputForm.patchValue({
        outputThdPercent: true,
        outputThdA: this.convertZeroToEmpty(data.opFilterThdA_T),
        outputThdA_PF: data.opFilterThdA_PF || 'P',
        outputThdB: this.convertZeroToEmpty(data.opFilterThdB_T),
        outputThdB_PF: data.opFilterThdB_PF || 'P',
        outputThdC: this.convertZeroToEmpty(data.opFilterThdC_T),
        outputThdC_PF: data.opFilterThdC_PF || 'P'
      });
      this.showOutputTHD = true;
    }
  }

  private async saveFilterCurrentsData(): Promise<void> {
    console.log('saveFilterCurrentsData called');
    
    const hasInputSrc1FilterCurrent = !!this.inputSource1Form.get('inputSrc1FilterCurrent')?.value;
    const hasInputSrc1THD = !!this.inputSource1Form.get('inputSrc1ThdPercent')?.value;
    const hasInputSrc2FilterCurrent = !!this.inputSource2Form.get('inputSrc2FilterCurrent')?.value;
    const hasInputSrc2THD = !!this.inputSource2Form.get('inputSrc2ThdPercent')?.value;
    const hasOutputFilterCurrent = !!this.outputForm.get('outputFilterCurrent')?.value;
    const hasOutputTHD = !!this.outputForm.get('outputThdPercent')?.value;

    console.log('Filter/THD data available:', {
      hasInputSrc1FilterCurrent,
      hasInputSrc1THD,
      hasInputSrc2FilterCurrent,
      hasInputSrc2THD,
      hasOutputFilterCurrent,
      hasOutputTHD
    });

    if (!hasInputSrc1FilterCurrent && !hasInputSrc1THD && !hasInputSrc2FilterCurrent && 
        !hasInputSrc2THD && !hasOutputFilterCurrent && !hasOutputTHD) {
      console.log('No filter currents or THD data to save, returning early');
      return;
    }

    // For STS with 2 input sources, we save Input Source 1 data to the input fields
    // If only Source 2 is filled, use Source 2 data
    const filterCurrentsData: EquipFilterCurrents = {
      callNbr: this.callNbr,
      equipId: this.equipId,

      chkIpFilter: hasInputSrc1FilterCurrent || hasInputSrc2FilterCurrent,
      ipFilterCurrA_T: this.convertToDouble(
        hasInputSrc1FilterCurrent 
          ? this.inputSource1Form.get('src1FilterCurrentA')?.value
          : this.inputSource2Form.get('src2FilterCurrentA')?.value
      ),
      ipFilterCurrA_PF: (hasInputSrc1FilterCurrent 
        ? this.inputSource1Form.get('src1FilterCurrentA_PF')?.value
        : this.inputSource2Form.get('src2FilterCurrentA_PF')?.value) || 'P',
      ipFilterCurrB_T: this.convertToDouble(
        hasInputSrc1FilterCurrent
          ? this.inputSource1Form.get('src1FilterCurrentB')?.value
          : this.inputSource2Form.get('src2FilterCurrentB')?.value
      ),
      ipFilterCurrB_PF: (hasInputSrc1FilterCurrent
        ? this.inputSource1Form.get('src1FilterCurrentB_PF')?.value
        : this.inputSource2Form.get('src2FilterCurrentB_PF')?.value) || 'P',
      ipFilterCurrC_T: this.convertToDouble(
        hasInputSrc1FilterCurrent
          ? this.inputSource1Form.get('src1FilterCurrentC')?.value
          : this.inputSource2Form.get('src2FilterCurrentC')?.value
      ),
      ipFilterCurrC_PF: (hasInputSrc1FilterCurrent
        ? this.inputSource1Form.get('src1FilterCurrentC_PF')?.value
        : this.inputSource2Form.get('src2FilterCurrentC_PF')?.value) || 'P',

      chkIpThd: hasInputSrc1THD || hasInputSrc2THD,
      ipFilterThdA_T: this.convertToDouble(
        hasInputSrc1THD
          ? this.inputSource1Form.get('src1ThdA')?.value
          : this.inputSource2Form.get('src2ThdA')?.value
      ),
      ipFilterThdA_PF: (hasInputSrc1THD
        ? this.inputSource1Form.get('src1ThdA_PF')?.value
        : this.inputSource2Form.get('src2ThdA_PF')?.value) || 'P',
      ipFilterThdB_T: this.convertToDouble(
        hasInputSrc1THD
          ? this.inputSource1Form.get('src1ThdB')?.value
          : this.inputSource2Form.get('src2ThdB')?.value
      ),
      ipFilterThdB_PF: (hasInputSrc1THD
        ? this.inputSource1Form.get('src1ThdB_PF')?.value
        : this.inputSource2Form.get('src2ThdB_PF')?.value) || 'P',
      ipFilterThdC_T: this.convertToDouble(
        hasInputSrc1THD
          ? this.inputSource1Form.get('src1ThdC')?.value
          : this.inputSource2Form.get('src2ThdC')?.value
      ),
      ipFilterThdC_PF: (hasInputSrc1THD
        ? this.inputSource1Form.get('src1ThdC_PF')?.value
        : this.inputSource2Form.get('src2ThdC_PF')?.value) || 'P',

      chkOpFilter: hasOutputFilterCurrent,
      opFilterCurrA_T: this.convertToDouble(this.outputForm.get('outputFilterCurrentA')?.value),
      opFilterCurrA_PF: this.outputForm.get('outputFilterCurrentA_PF')?.value || 'P',
      opFilterCurrB_T: this.convertToDouble(this.outputForm.get('outputFilterCurrentB')?.value),
      opFilterCurrB_PF: this.outputForm.get('outputFilterCurrentB_PF')?.value || 'P',
      opFilterCurrC_T: this.convertToDouble(this.outputForm.get('outputFilterCurrentC')?.value),
      opFilterCurrC_PF: this.outputForm.get('outputFilterCurrentC_PF')?.value || 'P',

      chkOpThd: hasOutputTHD,
      opFilterThdA_T: this.convertToDouble(this.outputForm.get('outputThdA')?.value),
      opFilterThdA_PF: this.outputForm.get('outputThdA_PF')?.value || 'P',
      opFilterThdB_T: this.convertToDouble(this.outputForm.get('outputThdB')?.value),
      opFilterThdB_PF: this.outputForm.get('outputThdB_PF')?.value || 'P',
      opFilterThdC_T: this.convertToDouble(this.outputForm.get('outputThdC')?.value),
      opFilterThdC_PF: this.outputForm.get('outputThdC_PF')?.value || 'P',

      modifiedBy: this.authService.currentUserValue?.username || 'SYSTEM'
    };

    console.log('Sending filterCurrentsData to API:', filterCurrentsData);
    try {
      const response = await this.equipmentService.saveUpdateEquipFilterCurrents(filterCurrentsData).toPromise();
      console.log('saveUpdateEquipFilterCurrents response:', response);
    } catch (error) {
      console.error('Error saving filter currents data:', error);
      throw error;
    }
  }

  private convertToDouble(value: any): number {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  private convertZeroToEmpty(value: number | undefined): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value === 0 ? '' : value.toString();
  }

  private toNumber(value: any): number {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  private setupFilterCurrentCheckboxHandlers(): void {
    this.inputSource1Form.get('inputSrc1FilterCurrent')?.valueChanges.subscribe(checked => {
      this.showInputSrc1FilterCurrent = !!checked;
    });

    this.inputSource1Form.get('inputSrc1ThdPercent')?.valueChanges.subscribe(checked => {
      this.showInputSrc1THD = !!checked;
    });

    this.inputSource2Form.get('inputSrc2FilterCurrent')?.valueChanges.subscribe(checked => {
      this.showInputSrc2FilterCurrent = !!checked;
    });

    this.inputSource2Form.get('inputSrc2ThdPercent')?.valueChanges.subscribe(checked => {
      this.showInputSrc2THD = !!checked;
    });

    this.outputForm.get('outputFilterCurrent')?.valueChanges.subscribe(checked => {
      this.showOutputFilterCurrent = !!checked;
    });

    this.outputForm.get('outputThdPercent')?.valueChanges.subscribe(checked => {
      this.showOutputTHD = !!checked;
    });
  }

  // Calculate phase-to-neutral voltage
  calculatePhaseToNeutral(voltage: number): number {
    return this.stsService.calculatePhaseToNeutralVoltage(voltage);
  }

  getPhaseToNeutralLabel(phase: string): string {
    return `P - N (${phase})`;
  }

  // Calculate output load percentages based on current output selection
  calculateOutputLoadPercent(): void {
    const kva = this.toNumber(this.equipmentForm.get('kva')?.value);
    if (!kva) {
      this.toastr.error('Enter KVA before calculating load.');
      return;
    }

    const output = this.selectedOutput;
    const phasePF = (load: number): string => {
      if (load >= 80) {
        return 'F';
      }
      return 'P';
    };

    const setValues = (payload: any) => this.outputForm.patchValue(payload);

    if (output === '1') { // 120V single-phase
      const voltA = this.toNumber(this.outputForm.get('output120VoltA')?.value);
      const currA = this.toNumber(this.outputForm.get('output120CurrA')?.value);
      if (!voltA || !currA) {
        this.toastr.error('Enter Output Voltage A and Current A for 120V.');
        return;
      }
      const loadA = (currA * voltA) / 1000 / kva * 100;
      setValues({
        output120LoadA: +loadA.toFixed(2),
        output120TotalLoad: +loadA.toFixed(2),
        output120LoadA_PF: phasePF(loadA)
      });
      return;
    }

    if (output === '2') { // 240V split-phase
      const phaseKva = kva / 2;
      const voltA = this.toNumber(this.outputForm.get('output240VoltA')?.value);
      const voltB = this.toNumber(this.outputForm.get('output240VoltB')?.value);
      const currA = this.toNumber(this.outputForm.get('output240CurrA')?.value);
      const currB = this.toNumber(this.outputForm.get('output240CurrB')?.value);
      if (!voltA || !voltB || !currA || !currB || !phaseKva) {
        this.toastr.error('Enter Output Voltage/Current A and B for 240V.');
        return;
      }
      const loadA = (currA * voltA) / 1000 / phaseKva * 100;
      const loadB = (currB * voltB) / 1000 / phaseKva * 100;
      const total = (loadA + loadB) / 2;
      setValues({
        output240LoadA: +loadA.toFixed(2),
        output240LoadB: +loadB.toFixed(2),
        output240TotalLoad: +total.toFixed(2),
        output240LoadA_PF: phasePF(loadA),
        output240LoadB_PF: phasePF(loadB)
      });
      return;
    }

    const threePhaseCalc = (
      voltA: number,
      voltB: number,
      voltC: number,
      currA: number,
      currB: number,
      currC: number,
      loadKeys: { a: string; b: string; c: string; total: string; pfA: string; pfB: string; pfC: string }
    ) => {
      const phaseKva = kva / 3;
      if (!phaseKva || !voltA || !voltB || !voltC || !currA || !currB || !currC) {
        this.toastr.error('Enter all three phase voltage and current values for the selected output.');
        return;
      }
      const loadA = (voltA * currA) / 1732 / phaseKva * 100;
      const loadB = (voltB * currB) / 1732 / phaseKva * 100;
      const loadC = (voltC * currC) / 1732 / phaseKva * 100;
      const total = (loadA + loadB + loadC) / 3;
      setValues({
        [loadKeys.a]: +loadA.toFixed(2),
        [loadKeys.b]: +loadB.toFixed(2),
        [loadKeys.c]: +loadC.toFixed(2),
        [loadKeys.total]: +total.toFixed(2),
        [loadKeys.pfA]: phasePF(loadA),
        [loadKeys.pfB]: phasePF(loadB),
        [loadKeys.pfC]: phasePF(loadC)
      });
    };

    if (output === '3') { // 208V
      threePhaseCalc(
        this.toNumber(this.outputForm.get('output208VoltAB')?.value),
        this.toNumber(this.outputForm.get('output208VoltBC')?.value),
        this.toNumber(this.outputForm.get('output208VoltCA')?.value),
        this.toNumber(this.outputForm.get('output208CurrA')?.value),
        this.toNumber(this.outputForm.get('output208CurrB')?.value),
        this.toNumber(this.outputForm.get('output208CurrC')?.value),
        {
          a: 'output208LoadA',
          b: 'output208LoadB',
          c: 'output208LoadC',
          total: 'output208TotalLoad',
          pfA: 'output208LoadA_PF',
          pfB: 'output208LoadB_PF',
          pfC: 'output208LoadC_PF'
        }
      );
      return;
    }

    if (output === '4') { // 480V
      threePhaseCalc(
        this.toNumber(this.outputForm.get('output480VoltAB')?.value),
        this.toNumber(this.outputForm.get('output480VoltBC')?.value),
        this.toNumber(this.outputForm.get('output480VoltCA')?.value),
        this.toNumber(this.outputForm.get('output480CurrA')?.value),
        this.toNumber(this.outputForm.get('output480CurrB')?.value),
        this.toNumber(this.outputForm.get('output480CurrC')?.value),
        {
          a: 'output480LoadA',
          b: 'output480LoadB',
          c: 'output480LoadC',
          total: 'output480TotalLoad',
          pfA: 'output480LoadA_PF',
          pfB: 'output480LoadB_PF',
          pfC: 'output480LoadC_PF'
        }
      );
      return;
    }

    if (output === '5') { // 600V
      threePhaseCalc(
        this.toNumber(this.outputForm.get('output600VoltAB')?.value),
        this.toNumber(this.outputForm.get('output600VoltBC')?.value),
        this.toNumber(this.outputForm.get('output600VoltCA')?.value),
        this.toNumber(this.outputForm.get('output600CurrA')?.value),
        this.toNumber(this.outputForm.get('output600CurrB')?.value),
        this.toNumber(this.outputForm.get('output600CurrC')?.value),
        {
          a: 'output600LoadA',
          b: 'output600LoadB',
          c: 'output600LoadC',
          total: 'output600TotalLoad',
          pfA: 'output600LoadA_PF',
          pfB: 'output600LoadB_PF',
          pfC: 'output600LoadC_PF'
        }
      );
      return;
    }

    if (output === '6') { // 575V
      threePhaseCalc(
        this.toNumber(this.outputForm.get('output575VoltAB')?.value),
        this.toNumber(this.outputForm.get('output575VoltBC')?.value),
        this.toNumber(this.outputForm.get('output575VoltCA')?.value),
        this.toNumber(this.outputForm.get('output575CurrA')?.value),
        this.toNumber(this.outputForm.get('output575CurrB')?.value),
        this.toNumber(this.outputForm.get('output575CurrC')?.value),
        {
          a: 'output575LoadA',
          b: 'output575LoadB',
          c: 'output575LoadC',
          total: 'output575TotalLoad',
          pfA: 'output575LoadA_PF',
          pfB: 'output575LoadB_PF',
          pfC: 'output575LoadC_PF'
        }
      );
      return;
    }

    this.toastr.error('Select an output voltage to calculate load.');
  }


  // Save methods
  async saveAsDraft(): Promise<void> {
    await this.save(true);
  }

  async saveSTS(): Promise<void> {
    if (!this.validateInputs()) {
      return;
    }
    await this.save(false);
  }

  private validateInputs(): boolean {
    const alertAndFocus = (msg: string, control?: any): boolean => {
      window.alert(msg);
      control?.markAsTouched?.();
      return false;
    };

    const manufacturer = (this.equipmentForm.get('manufacturer')?.value || '').trim();
    if (manufacturer.toLowerCase().startsWith('ple')) {
      return alertAndFocus('Please select the manufacturer', this.equipmentForm.get('manufacturer'));
    }

    const model = (this.equipmentForm.get('modelNo')?.value || '').trim();
    if (!model) {
      return alertAndFocus('Please enter the Model No', this.equipmentForm.get('modelNo'));
    }

    const serialNo = (this.equipmentForm.get('serialNo')?.value || '').trim();
    if (!serialNo) {
      return alertAndFocus('Please enter the Serial No', this.equipmentForm.get('serialNo'));
    }

    const location = (this.equipmentForm.get('location')?.value || '').trim();
    if (!location) {
      return alertAndFocus('Please enter the Location', this.equipmentForm.get('location'));
    }

    const dateCode = this.equipmentForm.get('dateCode')?.value;
    if (!dateCode) {
      return alertAndFocus('Please enter the DateCode.', this.equipmentForm.get('dateCode'));
    }
    const dateCodeDt = new Date(dateCode);
    const today = new Date();
    if (isNaN(dateCodeDt.getTime()) || dateCodeDt > today) {
      return alertAndFocus("DateCode cannot be higher than today's date", this.equipmentForm.get('dateCode'));
    }

    const kvaStr = (this.equipmentForm.get('kva')?.value || '').toString().trim();
    const kva = parseFloat(kvaStr);
    if (!kvaStr || !kva) {
      return alertAndFocus('Please enter the KVA value', this.equipmentForm.get('kva'));
    }

    const tempStr = (this.equipmentForm.get('temperature')?.value || '').toString().trim();
    const temp = parseInt(tempStr, 10);
    if (!tempStr || temp === 0) {
      return alertAndFocus('Please enter the Temperature', this.equipmentForm.get('temperature'));
    }
    if (!(temp > 67 && temp < 78)) {
      // Legacy sets minor deficiency when out of band
      this.equipmentForm.get('status')?.setValue('OnLine(MinorDeficiency)');
    }

    // Reconciliation must be verified
    const reconVerified = !!this.reconciliationForm.get('verified')?.value;
    if (!reconVerified) {
      return alertAndFocus('You must verify the Reconciliation section before saving.', this.reconciliationForm.get('verified'));
    }

    // Actual fields are required when marked as incorrect
    const recModelCorrect = (this.reconciliationForm.get('recModelCorrect')?.value || '').toString();
    const recSerialCorrect = (this.reconciliationForm.get('recSerialNoCorrect')?.value || '').toString();
    const kvaCorrect = (this.reconciliationForm.get('kvaCorrect')?.value || '').toString();
    const totalEquipsCorrect = (this.reconciliationForm.get('totalEquipsCorrect')?.value || '').toString();

    if (recModelCorrect === 'NO' && !(this.reconciliationForm.get('actModel')?.value || '').toString().trim()) {
      return alertAndFocus('Please enter Actual Model when Model is marked No.', this.reconciliationForm.get('actModel'));
    }

    if (recSerialCorrect === 'NO' && !(this.reconciliationForm.get('actSerialNo')?.value || '').toString().trim()) {
      return alertAndFocus('Please enter Actual Serial No when Serial No is marked No.', this.reconciliationForm.get('actSerialNo'));
    }

    if (kvaCorrect === 'NO' && !(this.reconciliationForm.get('actKVA')?.value || '').toString().trim()) {
      return alertAndFocus('Please enter Actual KVA when KVA is marked No.', this.reconciliationForm.get('actKVA'));
    }

    if (totalEquipsCorrect === 'NO' && !(this.reconciliationForm.get('actTotalEquips')?.value || '').toString().trim()) {
      return alertAndFocus('Please enter Actual Total Equipments when Total Equipments is marked No.', this.reconciliationForm.get('actTotalEquips'));
    }

    // Input/Output selections must be chosen
    if (this.selectedInputSource1 === '0' || this.selectedOutput === '0') {
      return alertAndFocus('You must enter the values for Input and Output voltages.');
    }

    // Frequency tolerance checks
    const comments5Ctrl = this.commentsForm.get('comments5');
    const appendComment = (msg: string) => {
      const existing = comments5Ctrl?.value || '';
      comments5Ctrl?.setValue(`${existing}${existing ? '\n' : ''}${msg}`);
    };

    const inputFreqPFKey = () => {
      switch (this.selectedInputSource1) {
        case '1': return 'src1_120Freq_PF';
        case '2': return 'src1_240Freq_PF';
        case '3': return 'src1_208Freq_PF';
        case '4': return 'src1_480Freq_PF';
        case '5': return 'src1_600Freq_PF';
        case '6': return 'src1_575Freq_PF';
        default: return '';
      }
    };

    const inputFreqKey = () => {
      switch (this.selectedInputSource1) {
        case '1': return 'src1_120Freq';
        case '2': return 'src1_240Freq';
        case '3': return 'src1_208Freq';
        case '4': return 'src1_480Freq';
        case '5': return 'src1_600Freq';
        case '6': return 'src1_575Freq';
        default: return '';
      }
    };

    const outputFreqPFKey = () => {
      switch (this.selectedOutput) {
        case '1': return 'output120Freq_PF';
        case '2': return 'output240Freq_PF';
        case '3': return 'output208Freq_PF';
        case '4': return 'output480Freq_PF';
        case '5': return 'output600Freq_PF';
        case '6': return 'output575Freq_PF';
        default: return '';
      }
    };

    const outputFreqKey = () => {
      switch (this.selectedOutput) {
        case '1': return 'output120Freq';
        case '2': return 'output240Freq';
        case '3': return 'output208Freq';
        case '4': return 'output480Freq';
        case '5': return 'output600Freq';
        case '6': return 'output575Freq';
        default: return '';
      }
    };

    const inputFreqVal = parseFloat(this.inputSource1Form.get(inputFreqKey())?.value || '0');
    const outputFreqVal = parseFloat(this.outputForm.get(outputFreqKey())?.value || '0');

    if (!(inputFreqVal >= 55 && inputFreqVal <= 65)) {
      const proceed = window.confirm('Input Frequency not within specified tolerance. Continue?');
      if (!proceed) { return false; }
      this.inputSource1Form.get(inputFreqPFKey())?.setValue('F');
      appendComment('Input Frequency not within specified tolerance.');
    } else {
      this.inputSource1Form.get(inputFreqPFKey())?.setValue('P');
    }

    if (!(outputFreqVal >= 58 && outputFreqVal <= 62)) {
      const proceed = window.confirm('Output Frequency not within specified tolerance. Continue?');
      if (!proceed) { return false; }
      this.outputForm.get(outputFreqPFKey())?.setValue('F');
      appendComment('Output Frequency not within specified tolerance.');
    } else {
      this.outputForm.get(outputFreqPFKey())?.setValue('P');
    }

    // Comments required if any select marked Fail
    const anyFail = (
      this.visualForm.value && Object.values(this.visualForm.value).includes('F')
    ) || (
      this.inputSource1Form.value && Object.values(this.inputSource1Form.value).includes('F')
    ) || (
      this.inputSource2Form.value && Object.values(this.inputSource2Form.value).includes('F')
    ) || (
      this.outputForm.value && Object.values(this.outputForm.value).includes('F')
    );

    const hasComments = (this.visualForm.get('comments1')?.value || '').trim() || (comments5Ctrl?.value || '').trim() || (this.equipmentForm.get('statusNotes')?.value || '').trim();
    if (anyFail && !hasComments) {
      return alertAndFocus('You must enter the respected comments if anything is selected as Fail.', comments5Ctrl);
    }

    return true;
  }

  private async save(isDraft: boolean): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const currentUser = this.authService.currentUserValue;
      const userId = currentUser?.windowsID || currentUser?.id?.toString() || this.techId;

      const dateCodeValue = this.equipmentForm.get('dateCode')?.value;
      let monthName = '';
      let year = new Date().getFullYear();
      if (dateCodeValue) {
        // Parse date as local date to avoid timezone issues
        // dateCodeValue is in YYYY-MM-DD format from the date input
        const parts = dateCodeValue.split('-');
        if (parts.length === 3) {
          const parsed = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          if (!isNaN(parsed.getTime())) {
            monthName = parsed.toLocaleString('en-US', { month: 'long' });
            year = parsed.getFullYear();
          }
        }
      }

      const src1 = this.extractInputSource1Values();
      const src2 = this.extractInputSource2Values();
      const data: STSReadings = {
        stsId: this.stsId,
        callNbr: this.callNbr,
        equipId: this.equipId,
        
        // Equipment
        manufacturer: this.equipmentForm.get('manufacturer')?.value || '',
        modelNo: this.equipmentForm.get('modelNo')?.value || '',
        serialNo: this.equipmentForm.get('serialNo')?.value || '',
        location: this.equipmentForm.get('location')?.value || '',
        month: monthName,
        year: year,
        temp: parseFloat(this.equipmentForm.get('temperature')?.value || '0'),
        status: this.equipmentForm.get('status')?.value || 'Online',
        statusNotes: this.equipmentForm.get('statusNotes')?.value || '',
        kva: this.equipmentForm.get('kva')?.value || '',
        comments: this.equipmentForm.get('comments1')?.value || '',
        
        // Reconciliation
        recModel: this.reconciliationForm.get('recModel')?.value || '',
        recModelCorrect: this.reconciliationForm.get('recModelCorrect')?.value || 'YS',
        actModel: this.reconciliationForm.get('actModel')?.value || '',
        recSerialNo: this.reconciliationForm.get('recSerialNo')?.value || '',
        recSerialNoCorrect: this.reconciliationForm.get('recSerialNoCorrect')?.value || 'YS',
        actSerialNo: this.reconciliationForm.get('actSerialNo')?.value || '',
        kvaSize: this.reconciliationForm.get('kvaSize')?.value || '',
        kvaCorrect: this.reconciliationForm.get('kvaCorrect')?.value || 'YS',
        actKVA: this.reconciliationForm.get('actKVA')?.value || '',
        totalEquips: parseInt(this.reconciliationForm.get('totalEquips')?.value || '0'),
        totalEquipsCorrect: this.reconciliationForm.get('totalEquipsCorrect')?.value || 'YS',
        actTotalEquips: parseInt(this.reconciliationForm.get('actTotalEquips')?.value || '0'),
        verified: this.reconciliationForm.get('verified')?.value || false,
        
        // Visual
        busswork: this.visualForm.get('busswork')?.value || 'P',
        transformers: this.visualForm.get('transformers')?.value || 'P',
        powerConn: this.visualForm.get('powerConn')?.value || 'P',
        mainCirBreaks: this.visualForm.get('mainCirBreaks')?.value || 'P',
        subfeedCirBreaks: this.visualForm.get('subfeedCirBreaks')?.value || 'P',
        currentCTs: this.visualForm.get('currentCTs')?.value || 'P',
        circuitBoards: this.visualForm.get('circuitBoards')?.value || 'P',
        filterCapacitors: this.visualForm.get('filterCapacitors')?.value || 'P',
        fanCapacitors: this.visualForm.get('filterCapacitors')?.value || 'P',
        epoConn: this.visualForm.get('epoConn')?.value || 'P',
        wiringConn: this.visualForm.get('wiringConn')?.value || 'P',
        ribbonCables: this.visualForm.get('ribbonCables')?.value || 'P',
        compAirClean: this.visualForm.get('compAirClean')?.value || 'P',
        frontPanel: this.visualForm.get('frontPanel')?.value || 'P',
        internalPower: this.visualForm.get('internalPower')?.value || 'P',
        localMonitoring: this.visualForm.get('localMonitoring')?.value || 'P',
        localEPO: this.visualForm.get('localEPO')?.value || 'P',
        comments1: this.visualForm.get('comments1')?.value || '',
        
        // Input sources and output - Extract voltage-specific values
        inputSource1: this.selectedInputSource1,
        ...src1,
        // Legacy field names aligned to GET payload
        input: this.selectedInputSource1,
        inputVoltA_T: src1.inputSrc1VoltA_T,
        inputVoltA_PF: src1.inputSrc1VoltA_PF,
        inputVoltB_T: src1.inputSrc1VoltB_T,
        inputVoltB_PF: src1.inputSrc1VoltB_PF,
        inputVoltC_T: src1.inputSrc1VoltC_T,
        inputVoltC_PF: src1.inputSrc1VoltC_PF,
        inputCurrA_T: src1.inputSrc1CurrA_T,
        inputCurrA_PF: src1.inputSrc1CurrA_PF,
        inputCurrB_T: src1.inputSrc1CurrB_T,
        inputCurrB_PF: src1.inputSrc1CurrB_PF,
        inputCurrC_T: src1.inputSrc1CurrC_T,
        inputCurrC_PF: src1.inputSrc1CurrC_PF,
        inputFreq_T: src1.inputSrc1Freq_T,
        inputFreq_PF: src1.inputSrc1Freq_PF,
        
        inputSource2: this.selectedInputSource2,
        ...src2,
        // Legacy field names aligned to GET payload
        srcTwo: this.selectedInputSource2,
        srcTwoVoltA_T: src2.inputSrc2VoltA_T,
        srcTwoVoltA_PF: src2.inputSrc2VoltA_PF,
        srcTwoVoltB_T: src2.inputSrc2VoltB_T,
        srcTwoVoltB_PF: src2.inputSrc2VoltB_PF,
        srcTwoVoltC_T: src2.inputSrc2VoltC_T,
        srcTwoVoltC_PF: src2.inputSrc2VoltC_PF,
        srcTwoCurrA_T: src2.inputSrc2CurrA_T,
        srcTwoCurrA_PF: src2.inputSrc2CurrA_PF,
        srcTwoCurrB_T: src2.inputSrc2CurrB_T,
        srcTwoCurrB_PF: src2.inputSrc2CurrB_PF,
        srcTwoCurrC_T: src2.inputSrc2CurrC_T,
        srcTwoCurrC_PF: src2.inputSrc2CurrC_PF,
        srcTwoFreq_T: src2.inputSrc2Freq_T,
        srcTwoFreq_PF: src2.inputSrc2Freq_PF,
        
        output: this.selectedOutput,
        ...this.extractOutputValues(),
        
        // Transfer verification
        transferVerification: this.transferVerificationForm.get('transferVerification')?.value || 'P',
        tVerification: this.transferVerificationForm.get('transferVerification')?.value || 'P',
        prefAlter: this.transferVerificationForm.get('prefAlter')?.value || 'P',
        transByPass: this.transferVerificationForm.get('transByPass')?.value || 'P',
        stsByPass: this.transferVerificationForm.get('stsByPass')?.value || 'P',
        verifyAlarm: this.transferVerificationForm.get('verifyAlarm')?.value || 'P',
        
        comments5: this.commentsForm.get('comments5')?.value || '',
        
        saveAsDraft: isDraft,
        maint_Auth_Id: userId
      };

      console.log('===== SAVING STS READINGS START =====');
      console.log('Data to save:', data);
      
      // 1. SaveUpdateSTSVerification(ButtonType)
      const result = await this.stsService.saveSTSReadings(data).toPromise();
      console.log('saveSTSReadings response:', result);

      const isSuccessful = result && (result.success !== false && !!result.message);
      if (!isSuccessful) {
        console.error('Save failed - result not successful');
        this.errorMessage = (result as any)?.error || result?.message || 'Failed to save STS readings';
        this.toastr.error(this.errorMessage);
        return;
      }
      console.log('✓ Step 1: STS readings saved successfully');

      // 2. SaveUpdateReconciliationInfo() - handled within SaveSTSReadings via backend
      console.log('✓ Step 2: Reconciliation info saved (within STS save)');

      // 2b. Save Filter Currents / THD data
      console.log('Step 2b: Starting filter currents save...');
      try {
        await this.saveFilterCurrentsData();
        console.log('✓ Step 2b: Filter currents data saved successfully');
      } catch (filterError) {
        console.error('✗ Error saving filter currents (non-critical):', filterError);
      }

      // 3. if (ddlStatus.SelectedValue != "Offline") { ddlStatus.SelectedValue = GetEquipStatus(); }
      console.log('Step 3: Checking if status needs recalculation...');
      let statusToSend = this.equipmentForm.get('status')?.value || 'Online';
      if (statusToSend !== 'Offline') {
        console.log('  Status is not Offline, calling GetEquipStatus...');
        try {
          statusToSend = (await this.getEquipStatus())?.trim() || 'Online';
          console.log('  GetEquipStatus returned:', statusToSend);
          this.equipmentForm.patchValue({ status: statusToSend });
        } catch (err) {
          console.error('  Error calling GetEquipStatus:', err);
        }
      }
      console.log('✓ Step 3: Status recalculation complete, statusToSend:', statusToSend);

      // 4. da.UpdateEquipStatus(UES)
      console.log('Step 4: Calling UpdateEquipStatus...');
      try {
        const updateResult = await this.batteryService.updateEquipStatus({
          callNbr: this.callNbr,
          equipId: this.equipId,
          status: statusToSend,
          statusNotes: this.equipmentForm.get('statusNotes')?.value || '',
          tableName: 'aaETechSTS',
          manufacturer: this.equipmentForm.get('manufacturer')?.value || '',
          modelNo: this.equipmentForm.get('modelNo')?.value || '',
          serialNo: this.equipmentForm.get('serialNo')?.value || '',
          location: this.equipmentForm.get('location')?.value || '',
          monthName: monthName,
          year: year,
          readingType: '1',
          // Fields required by UpdateEquipStatus (legacy API expectations)
          vfSelection: this.equipmentForm.get('vfSelection')?.value || '',
          batteriesPerString: this.equipmentForm.get('batteriesPerString')?.value || 0,
          batteriesPerPack: this.equipmentForm.get('batteriesPerPack')?.value || 0,
          Notes: this.equipmentForm.get('statusNotes')?.value || '',
          MaintAuthID: (this as any).authService?.currentUserValue?.id || this.techId || ''
        }).toPromise();
        
        console.log('  updateEquipStatus response:', updateResult);
        
        if (!updateResult?.success) {
          console.error('  Update failed - result not successful');
        } else {
          console.log('  ✓ Equipment status updated successfully');
        }
      } catch (err: any) {
        console.error('  Error updating equipment status:', err);
      }
      console.log('✓ Step 4: UpdateEquipStatus complete');

      console.log('===== ALL OPERATIONS COMPLETE =====');
      this.successMessage = isDraft ? 'STS readings saved as draft successfully' : 'STS readings saved successfully';
      console.log('Showing success message:', this.successMessage);
      this.toastr.success(this.successMessage);
      
      // Refresh data to reflect persisted values (legacy page reload behavior)
      console.log('Reloading form with saved data...');
      await this.loadData();
      
    } catch (error: any) {
      console.error('Error saving STS readings:', error);
      this.errorMessage = error.message || 'Failed to save STS readings';
      this.toastr.error(this.errorMessage);
    } finally {
      this.saving = false;
    }
  }

  // Mirrors legacy SaveData status flow, including GetEquipStatus equivalent and conditional status update
  private async handleStatusUpdate(isDraft: boolean, monthName: string, year: number): Promise<boolean> {
    console.log('handleStatusUpdate called with isDraft=', isDraft);
    
    const statusFromForm = this.equipmentForm.get('status')?.value || 'Online';
    const statusNotes = (this.equipmentForm.get('statusNotes')?.value || '').trim();
    console.log('statusFromForm:', statusFromForm, 'statusNotes:', statusNotes);

    // Use status from form directly - backend endpoints for calculate/update don't exist yet
    let resolvedStatus = statusFromForm;
    console.log('Using form status directly:', resolvedStatus);

    const isOnline = resolvedStatus === 'Online';
    const needsNotes = !isOnline && !isDraft;
    console.log('isOnline:', isOnline, 'needsNotes:', needsNotes);

    if (needsNotes && !statusNotes) {
      console.error('Status is not Online and needs notes but none provided');
      this.errorMessage = 'Please enter the reason for Equipment Status.';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Draft behavior: only update status when Online (matches legacy branch)
    if (isDraft && !isOnline) {
      console.log('Draft mode and status not Online - skipping status update');
      return true;
    }

    // Note: Backend endpoints for calculate-sts-status and update-sts-status don't exist yet
    // Once implemented, they should be called here to update equipment status in the database
    console.log('✓ Status handling complete (backend endpoints pending implementation)');
    return true;
  }

  // Implements legacy GetEquipStatus logic - analyzes job summary to determine equipment status
  private async getEquipStatus(): Promise<string> {
    try {
      console.log('getEquipStatus: Fetching job summary and status descriptions...');
      const [jobSummary, statusDesc] = await Promise.all([
        this.equipmentService.getJobSummaryReport(this.callNbr, this.equipId, 'STS').toPromise(),
        this.equipmentService.getStatusDescription('STS').toPromise()
      ]);

      let resultStatus = 'Online';
      const rows = jobSummary?.Tables?.[0]?.Rows?.length ? jobSummary.Tables[0].Rows : jobSummary?.data?.primaryData;
      console.log('getEquipStatus rows:', rows);
      
      if (rows && rows.length > 0) {
        const row = rows[0];
        const columns = jobSummary?.Tables?.[0]?.Columns || Object.keys(row);
        
        for (const col of columns) {
          const tempColumnRaw = (col.ColumnName || col || '').toString();
          const tempColumn = tempColumnRaw.trim();
          const rawValue = (row[tempColumn] ?? row[col] ?? '').toString();
          const tempField = rawValue.trim();

          let shouldCheckStatus = false;

          const columnLower = tempColumn.toLowerCase();
          if (columnLower.includes('action') || columnLower.includes('critical')) {
            if (tempField === 'Y') {
              shouldCheckStatus = true;
            }
          } else {
            if (tempField === 'N' || tempField === 'F' || tempField === 'True' || tempField === '12') {
              shouldCheckStatus = true;
            }
          }

          if (shouldCheckStatus) {
            console.log('getEquipStatus match ->', { tempColumn, tempField });
            resultStatus = 'OnLine(MinorDeficiency)';
            const statusTables = (statusDesc as any)?.Tables;
            const statusRows = Array.isArray(statusTables?.[0]?.Rows)
              ? statusTables[0].Rows
              : Array.isArray(statusDesc)
                ? statusDesc as any[]
                : [];
            
            for (const dr of statusRows) {
              const descColumn = (dr['ColumnName'] || '').toString().trim();
              if (descColumn.toLowerCase() === columnLower) {
                const type = (dr['StatusType'] || '').toString().trim();
                console.log('getEquipStatus override ->', { tempColumn, type });
                if (type === 'CriticalDeficiency') {
                  return 'CriticalDeficiency';
                } else if (type === 'OnLine(MajorDeficiency)') {
                  resultStatus = 'OnLine(MajorDeficiency)';
                }
              }
            }
          }
        }
      }
      console.log('getEquipStatus resultStatus ->', resultStatus);
      return resultStatus;
    } catch (e) {
      console.error('getEquipStatus error ->', e);
      return 'Online';
    }
  }

  goBack(): void {
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId,
        TechName: this.techName
      }
    });
  }

  getInputConfig(value: string): VoltageConfiguration | undefined {
    return this.voltageConfigs.find(cfg => cfg.value === value);
  }

  getOutputConfig(value: string): VoltageConfiguration | undefined {
    return this.outputVoltageConfigs.find(cfg => cfg.value === value);
  }

  // Extract voltage-specific values for input source 1
  private extractInputSource1Values(): any {
    const voltage = this.selectedInputSource1;
    const result: any = {
      inputSrc1VoltA_T: 0,
      inputSrc1VoltA_PF: 'P',
      inputSrc1VoltB_T: 0,
      inputSrc1VoltB_PF: 'P',
      inputSrc1VoltC_T: 0,
      inputSrc1VoltC_PF: 'P',
      inputSrc1CurrA_T: 0,
      inputSrc1CurrA_PF: 'P',
      inputSrc1CurrB_T: 0,
      inputSrc1CurrB_PF: 'P',
      inputSrc1CurrC_T: 0,
      inputSrc1CurrC_PF: 'P',
      inputSrc1Freq_T: 60,
      inputSrc1Freq_PF: 'P'
    };

    if (voltage === '1') { // 120V
      result.inputSrc1VoltA_T = parseFloat(this.inputSource1Form.get('src1_120VoltA')?.value || '0');
      result.inputSrc1VoltA_PF = this.inputSource1Form.get('src1_120VoltA_PF')?.value || 'P';
      result.inputSrc1CurrA_T = parseFloat(this.inputSource1Form.get('src1_120CurrA')?.value || '0');
      result.inputSrc1CurrA_PF = this.inputSource1Form.get('src1_120CurrA_PF')?.value || 'P';
      result.inputSrc1Freq_T = parseFloat(this.inputSource1Form.get('src1_120Freq')?.value || '60');
      result.inputSrc1Freq_PF = this.inputSource1Form.get('src1_120Freq_PF')?.value || 'P';
    } else if (voltage === '2') { // 240V
      result.inputSrc1VoltA_T = parseFloat(this.inputSource1Form.get('src1_240VoltA')?.value || '0');
      result.inputSrc1VoltA_PF = this.inputSource1Form.get('src1_240VoltA_PF')?.value || 'P';
      result.inputSrc1VoltB_T = parseFloat(this.inputSource1Form.get('src1_240VoltB')?.value || '0');
      result.inputSrc1VoltB_PF = this.inputSource1Form.get('src1_240VoltB_PF')?.value || 'P';
      result.inputSrc1CurrA_T = parseFloat(this.inputSource1Form.get('src1_240CurrA')?.value || '0');
      result.inputSrc1CurrA_PF = this.inputSource1Form.get('src1_240CurrA_PF')?.value || 'P';
      result.inputSrc1CurrB_T = parseFloat(this.inputSource1Form.get('src1_240CurrB')?.value || '0');
      result.inputSrc1CurrB_PF = this.inputSource1Form.get('src1_240CurrB_PF')?.value || 'P';
      result.inputSrc1Freq_T = parseFloat(this.inputSource1Form.get('src1_240Freq')?.value || '60');
      result.inputSrc1Freq_PF = this.inputSource1Form.get('src1_240Freq_PF')?.value || 'P';
    } else if (voltage === '3') { // 208V
      result.inputSrc1VoltA_T = parseFloat(this.inputSource1Form.get('src1_208VoltAB')?.value || '0');
      result.inputSrc1VoltA_PF = this.inputSource1Form.get('src1_208VoltAB_PF')?.value || 'P';
      result.inputSrc1VoltB_T = parseFloat(this.inputSource1Form.get('src1_208VoltBC')?.value || '0');
      result.inputSrc1VoltB_PF = this.inputSource1Form.get('src1_208VoltBC_PF')?.value || 'P';
      result.inputSrc1VoltC_T = parseFloat(this.inputSource1Form.get('src1_208VoltCA')?.value || '0');
      result.inputSrc1VoltC_PF = this.inputSource1Form.get('src1_208VoltCA_PF')?.value || 'P';
      result.inputSrc1CurrA_T = parseFloat(this.inputSource1Form.get('src1_208CurrA')?.value || '0');
      result.inputSrc1CurrA_PF = this.inputSource1Form.get('src1_208CurrA_PF')?.value || 'P';
      result.inputSrc1CurrB_T = parseFloat(this.inputSource1Form.get('src1_208CurrB')?.value || '0');
      result.inputSrc1CurrB_PF = this.inputSource1Form.get('src1_208CurrB_PF')?.value || 'P';
      result.inputSrc1CurrC_T = parseFloat(this.inputSource1Form.get('src1_208CurrC')?.value || '0');
      result.inputSrc1CurrC_PF = this.inputSource1Form.get('src1_208CurrC_PF')?.value || 'P';
      result.inputSrc1Freq_T = parseFloat(this.inputSource1Form.get('src1_208Freq')?.value || '60');
      result.inputSrc1Freq_PF = this.inputSource1Form.get('src1_208Freq_PF')?.value || 'P';
    } else if (voltage === '4') { // 480V
      result.inputSrc1VoltA_T = parseFloat(this.inputSource1Form.get('src1_480VoltAB')?.value || '0');
      result.inputSrc1VoltA_PF = this.inputSource1Form.get('src1_480VoltAB_PF')?.value || 'P';
      result.inputSrc1VoltB_T = parseFloat(this.inputSource1Form.get('src1_480VoltBC')?.value || '0');
      result.inputSrc1VoltB_PF = this.inputSource1Form.get('src1_480VoltBC_PF')?.value || 'P';
      result.inputSrc1VoltC_T = parseFloat(this.inputSource1Form.get('src1_480VoltCA')?.value || '0');
      result.inputSrc1VoltC_PF = this.inputSource1Form.get('src1_480VoltCA_PF')?.value || 'P';
      result.inputSrc1CurrA_T = parseFloat(this.inputSource1Form.get('src1_480CurrA')?.value || '0');
      result.inputSrc1CurrA_PF = this.inputSource1Form.get('src1_480CurrA_PF')?.value || 'P';
      result.inputSrc1CurrB_T = parseFloat(this.inputSource1Form.get('src1_480CurrB')?.value || '0');
      result.inputSrc1CurrB_PF = this.inputSource1Form.get('src1_480CurrB_PF')?.value || 'P';
      result.inputSrc1CurrC_T = parseFloat(this.inputSource1Form.get('src1_480CurrC')?.value || '0');
      result.inputSrc1CurrC_PF = this.inputSource1Form.get('src1_480CurrC_PF')?.value || 'P';
      result.inputSrc1Freq_T = parseFloat(this.inputSource1Form.get('src1_480Freq')?.value || '60');
      result.inputSrc1Freq_PF = this.inputSource1Form.get('src1_480Freq_PF')?.value || 'P';
    } else if (voltage === '5') { // 600V
      result.inputSrc1VoltA_T = parseFloat(this.inputSource1Form.get('src1_600VoltAB')?.value || '0');
      result.inputSrc1VoltA_PF = this.inputSource1Form.get('src1_600VoltAB_PF')?.value || 'P';
      result.inputSrc1VoltB_T = parseFloat(this.inputSource1Form.get('src1_600VoltBC')?.value || '0');
      result.inputSrc1VoltB_PF = this.inputSource1Form.get('src1_600VoltBC_PF')?.value || 'P';
      result.inputSrc1VoltC_T = parseFloat(this.inputSource1Form.get('src1_600VoltCA')?.value || '0');
      result.inputSrc1VoltC_PF = this.inputSource1Form.get('src1_600VoltCA_PF')?.value || 'P';
      result.inputSrc1CurrA_T = parseFloat(this.inputSource1Form.get('src1_600CurrA')?.value || '0');
      result.inputSrc1CurrA_PF = this.inputSource1Form.get('src1_600CurrA_PF')?.value || 'P';
      result.inputSrc1CurrB_T = parseFloat(this.inputSource1Form.get('src1_600CurrB')?.value || '0');
      result.inputSrc1CurrB_PF = this.inputSource1Form.get('src1_600CurrB_PF')?.value || 'P';
      result.inputSrc1CurrC_T = parseFloat(this.inputSource1Form.get('src1_600CurrC')?.value || '0');
      result.inputSrc1CurrC_PF = this.inputSource1Form.get('src1_600CurrC_PF')?.value || 'P';
      result.inputSrc1Freq_T = parseFloat(this.inputSource1Form.get('src1_600Freq')?.value || '60');
      result.inputSrc1Freq_PF = this.inputSource1Form.get('src1_600Freq_PF')?.value || 'P';
    } else if (voltage === '6') { // 575V
      result.inputSrc1VoltA_T = parseFloat(this.inputSource1Form.get('src1_575VoltAB')?.value || '0');
      result.inputSrc1VoltA_PF = this.inputSource1Form.get('src1_575VoltAB_PF')?.value || 'P';
      result.inputSrc1VoltB_T = parseFloat(this.inputSource1Form.get('src1_575VoltBC')?.value || '0');
      result.inputSrc1VoltB_PF = this.inputSource1Form.get('src1_575VoltBC_PF')?.value || 'P';
      result.inputSrc1VoltC_T = parseFloat(this.inputSource1Form.get('src1_575VoltCA')?.value || '0');
      result.inputSrc1VoltC_PF = this.inputSource1Form.get('src1_575VoltCA_PF')?.value || 'P';
      result.inputSrc1CurrA_T = parseFloat(this.inputSource1Form.get('src1_575CurrA')?.value || '0');
      result.inputSrc1CurrA_PF = this.inputSource1Form.get('src1_575CurrA_PF')?.value || 'P';
      result.inputSrc1CurrB_T = parseFloat(this.inputSource1Form.get('src1_575CurrB')?.value || '0');
      result.inputSrc1CurrB_PF = this.inputSource1Form.get('src1_575CurrB_PF')?.value || 'P';
      result.inputSrc1CurrC_T = parseFloat(this.inputSource1Form.get('src1_575CurrC')?.value || '0');
      result.inputSrc1CurrC_PF = this.inputSource1Form.get('src1_575CurrC_PF')?.value || 'P';
      result.inputSrc1Freq_T = parseFloat(this.inputSource1Form.get('src1_575Freq')?.value || '60');
      result.inputSrc1Freq_PF = this.inputSource1Form.get('src1_575Freq_PF')?.value || 'P';
    }

    return result;
  }

  // Extract voltage-specific values for input source 2
  private extractInputSource2Values(): any {
    const voltage = this.selectedInputSource2;
    const result: any = {
      inputSrc2VoltA_T: 0,
      inputSrc2VoltA_PF: 'P',
      inputSrc2VoltB_T: 0,
      inputSrc2VoltB_PF: 'P',
      inputSrc2VoltC_T: 0,
      inputSrc2VoltC_PF: 'P',
      inputSrc2CurrA_T: 0,
      inputSrc2CurrA_PF: 'P',
      inputSrc2CurrB_T: 0,
      inputSrc2CurrB_PF: 'P',
      inputSrc2CurrC_T: 0,
      inputSrc2CurrC_PF: 'P',
      inputSrc2Freq_T: 60,
      inputSrc2Freq_PF: 'P'
    };

    if (voltage === '1') { // 120V
      result.inputSrc2VoltA_T = parseFloat(this.inputSource2Form.get('src2_120VoltA')?.value || '0');
      result.inputSrc2VoltA_PF = this.inputSource2Form.get('src2_120VoltA_PF')?.value || 'P';
      result.inputSrc2CurrA_T = parseFloat(this.inputSource2Form.get('src2_120CurrA')?.value || '0');
      result.inputSrc2CurrA_PF = this.inputSource2Form.get('src2_120CurrA_PF')?.value || 'P';
      result.inputSrc2Freq_T = parseFloat(this.inputSource2Form.get('src2_120Freq')?.value || '60');
      result.inputSrc2Freq_PF = this.inputSource2Form.get('src2_120Freq_PF')?.value || 'P';
    } else if (voltage === '2') { // 240V
      result.inputSrc2VoltA_T = parseFloat(this.inputSource2Form.get('src2_240VoltA')?.value || '0');
      result.inputSrc2VoltA_PF = this.inputSource2Form.get('src2_240VoltA_PF')?.value || 'P';
      result.inputSrc2VoltB_T = parseFloat(this.inputSource2Form.get('src2_240VoltB')?.value || '0');
      result.inputSrc2VoltB_PF = this.inputSource2Form.get('src2_240VoltB_PF')?.value || 'P';
      result.inputSrc2CurrA_T = parseFloat(this.inputSource2Form.get('src2_240CurrA')?.value || '0');
      result.inputSrc2CurrA_PF = this.inputSource2Form.get('src2_240CurrA_PF')?.value || 'P';
      result.inputSrc2CurrB_T = parseFloat(this.inputSource2Form.get('src2_240CurrB')?.value || '0');
      result.inputSrc2CurrB_PF = this.inputSource2Form.get('src2_240CurrB_PF')?.value || 'P';
      result.inputSrc2Freq_T = parseFloat(this.inputSource2Form.get('src2_240Freq')?.value || '60');
      result.inputSrc2Freq_PF = this.inputSource2Form.get('src2_240Freq_PF')?.value || 'P';
    } else if (voltage === '3') { // 208V
      result.inputSrc2VoltA_T = parseFloat(this.inputSource2Form.get('src2_208VoltAB')?.value || '0');
      result.inputSrc2VoltA_PF = this.inputSource2Form.get('src2_208VoltAB_PF')?.value || 'P';
      result.inputSrc2VoltB_T = parseFloat(this.inputSource2Form.get('src2_208VoltBC')?.value || '0');
      result.inputSrc2VoltB_PF = this.inputSource2Form.get('src2_208VoltBC_PF')?.value || 'P';
      result.inputSrc2VoltC_T = parseFloat(this.inputSource2Form.get('src2_208VoltCA')?.value || '0');
      result.inputSrc2VoltC_PF = this.inputSource2Form.get('src2_208VoltCA_PF')?.value || 'P';
      result.inputSrc2CurrA_T = parseFloat(this.inputSource2Form.get('src2_208CurrA')?.value || '0');
      result.inputSrc2CurrA_PF = this.inputSource2Form.get('src2_208CurrA_PF')?.value || 'P';
      result.inputSrc2CurrB_T = parseFloat(this.inputSource2Form.get('src2_208CurrB')?.value || '0');
      result.inputSrc2CurrB_PF = this.inputSource2Form.get('src2_208CurrB_PF')?.value || 'P';
      result.inputSrc2CurrC_T = parseFloat(this.inputSource2Form.get('src2_208CurrC')?.value || '0');
      result.inputSrc2CurrC_PF = this.inputSource2Form.get('src2_208CurrC_PF')?.value || 'P';
      result.inputSrc2Freq_T = parseFloat(this.inputSource2Form.get('src2_208Freq')?.value || '60');
      result.inputSrc2Freq_PF = this.inputSource2Form.get('src2_208Freq_PF')?.value || 'P';
    } else if (voltage === '4') { // 480V
      result.inputSrc2VoltA_T = parseFloat(this.inputSource2Form.get('src2_480VoltAB')?.value || '0');
      result.inputSrc2VoltA_PF = this.inputSource2Form.get('src2_480VoltAB_PF')?.value || 'P';
      result.inputSrc2VoltB_T = parseFloat(this.inputSource2Form.get('src2_480VoltBC')?.value || '0');
      result.inputSrc2VoltB_PF = this.inputSource2Form.get('src2_480VoltBC_PF')?.value || 'P';
      result.inputSrc2VoltC_T = parseFloat(this.inputSource2Form.get('src2_480VoltCA')?.value || '0');
      result.inputSrc2VoltC_PF = this.inputSource2Form.get('src2_480VoltCA_PF')?.value || 'P';
      result.inputSrc2CurrA_T = parseFloat(this.inputSource2Form.get('src2_480CurrA')?.value || '0');
      result.inputSrc2CurrA_PF = this.inputSource2Form.get('src2_480CurrA_PF')?.value || 'P';
      result.inputSrc2CurrB_T = parseFloat(this.inputSource2Form.get('src2_480CurrB')?.value || '0');
      result.inputSrc2CurrB_PF = this.inputSource2Form.get('src2_480CurrB_PF')?.value || 'P';
      result.inputSrc2CurrC_T = parseFloat(this.inputSource2Form.get('src2_480CurrC')?.value || '0');
      result.inputSrc2CurrC_PF = this.inputSource2Form.get('src2_480CurrC_PF')?.value || 'P';
      result.inputSrc2Freq_T = parseFloat(this.inputSource2Form.get('src2_480Freq')?.value || '60');
      result.inputSrc2Freq_PF = this.inputSource2Form.get('src2_480Freq_PF')?.value || 'P';
    } else if (voltage === '5') { // 600V
      result.inputSrc2VoltA_T = parseFloat(this.inputSource2Form.get('src2_600VoltAB')?.value || '0');
      result.inputSrc2VoltA_PF = this.inputSource2Form.get('src2_600VoltAB_PF')?.value || 'P';
      result.inputSrc2VoltB_T = parseFloat(this.inputSource2Form.get('src2_600VoltBC')?.value || '0');
      result.inputSrc2VoltB_PF = this.inputSource2Form.get('src2_600VoltBC_PF')?.value || 'P';
      result.inputSrc2VoltC_T = parseFloat(this.inputSource2Form.get('src2_600VoltCA')?.value || '0');
      result.inputSrc2VoltC_PF = this.inputSource2Form.get('src2_600VoltCA_PF')?.value || 'P';
      result.inputSrc2CurrA_T = parseFloat(this.inputSource2Form.get('src2_600CurrA')?.value || '0');
      result.inputSrc2CurrA_PF = this.inputSource2Form.get('src2_600CurrA_PF')?.value || 'P';
      result.inputSrc2CurrB_T = parseFloat(this.inputSource2Form.get('src2_600CurrB')?.value || '0');
      result.inputSrc2CurrB_PF = this.inputSource2Form.get('src2_600CurrB_PF')?.value || 'P';
      result.inputSrc2CurrC_T = parseFloat(this.inputSource2Form.get('src2_600CurrC')?.value || '0');
      result.inputSrc2CurrC_PF = this.inputSource2Form.get('src2_600CurrC_PF')?.value || 'P';
      result.inputSrc2Freq_T = parseFloat(this.inputSource2Form.get('src2_600Freq')?.value || '60');
      result.inputSrc2Freq_PF = this.inputSource2Form.get('src2_600Freq_PF')?.value || 'P';
    } else if (voltage === '6') { // 575V
      result.inputSrc2VoltA_T = parseFloat(this.inputSource2Form.get('src2_575VoltAB')?.value || '0');
      result.inputSrc2VoltA_PF = this.inputSource2Form.get('src2_575VoltAB_PF')?.value || 'P';
      result.inputSrc2VoltB_T = parseFloat(this.inputSource2Form.get('src2_575VoltBC')?.value || '0');
      result.inputSrc2VoltB_PF = this.inputSource2Form.get('src2_575VoltBC_PF')?.value || 'P';
      result.inputSrc2VoltC_T = parseFloat(this.inputSource2Form.get('src2_575VoltCA')?.value || '0');
      result.inputSrc2VoltC_PF = this.inputSource2Form.get('src2_575VoltCA_PF')?.value || 'P';
      result.inputSrc2CurrA_T = parseFloat(this.inputSource2Form.get('src2_575CurrA')?.value || '0');
      result.inputSrc2CurrA_PF = this.inputSource2Form.get('src2_575CurrA_PF')?.value || 'P';
      result.inputSrc2CurrB_T = parseFloat(this.inputSource2Form.get('src2_575CurrB')?.value || '0');
      result.inputSrc2CurrB_PF = this.inputSource2Form.get('src2_575CurrB_PF')?.value || 'P';
      result.inputSrc2CurrC_T = parseFloat(this.inputSource2Form.get('src2_575CurrC')?.value || '0');
      result.inputSrc2CurrC_PF = this.inputSource2Form.get('src2_575CurrC_PF')?.value || 'P';
      result.inputSrc2Freq_T = parseFloat(this.inputSource2Form.get('src2_575Freq')?.value || '60');
      result.inputSrc2Freq_PF = this.inputSource2Form.get('src2_575Freq_PF')?.value || 'P';
    }

    return result;
  }

  // Extract voltage-specific values for output
  private extractOutputValues(): any {
    const voltage = this.selectedOutput;
    const result: any = {
      outputVoltA_T: 0,
      outputVoltA_PF: 'P',
      outputVoltB_T: 0,
      outputVoltB_PF: 'P',
      outputVoltC_T: 0,
      outputVoltC_PF: 'P',
      outputCurrA_T: 0,
      outputCurrA_PF: 'P',
      outputCurrB_T: 0,
      outputCurrB_PF: 'P',
      outputCurrC_T: 0,
      outputCurrC_PF: 'P',
      outputFreq_T: 60,
      outputFreq_PF: 'P',
      outputLoadA: 0,
      outputLoadA_PF: 'P',
      outputLoadB: 0,
      outputLoadB_PF: 'P',
      outputLoadC: 0,
      outputLoadC_PF: 'P',
      totalLoad: 0
    };

    if (voltage === '1') { // 120V
      result.outputVoltA_T = parseFloat(this.outputForm.get('output120VoltA')?.value || '0');
      result.outputVoltA_PF = this.outputForm.get('output120VoltA_PF')?.value || 'P';
      result.outputCurrA_T = parseFloat(this.outputForm.get('output120CurrA')?.value || '0');
      result.outputCurrA_PF = this.outputForm.get('output120CurrA_PF')?.value || 'P';
      result.outputLoadA = parseFloat(this.outputForm.get('output120LoadA')?.value || '0');
      result.outputLoadA_PF = this.outputForm.get('output120LoadA_PF')?.value || 'P';
      result.totalLoad = parseFloat(this.outputForm.get('output120TotalLoad')?.value || '0');
      result.outputFreq_T = parseFloat(this.outputForm.get('output120Freq')?.value || '60');
      result.outputFreq_PF = this.outputForm.get('output120Freq_PF')?.value || 'P';
    } else if (voltage === '2') { // 240V
      result.outputVoltA_T = parseFloat(this.outputForm.get('output240VoltA')?.value || '0');
      result.outputVoltA_PF = this.outputForm.get('output240VoltA_PF')?.value || 'P';
      result.outputVoltB_T = parseFloat(this.outputForm.get('output240VoltB')?.value || '0');
      result.outputVoltB_PF = this.outputForm.get('output240VoltB_PF')?.value || 'P';
      result.outputCurrA_T = parseFloat(this.outputForm.get('output240CurrA')?.value || '0');
      result.outputCurrA_PF = this.outputForm.get('output240CurrA_PF')?.value || 'P';
      result.outputCurrB_T = parseFloat(this.outputForm.get('output240CurrB')?.value || '0');
      result.outputCurrB_PF = this.outputForm.get('output240CurrB_PF')?.value || 'P';
      result.outputLoadA = parseFloat(this.outputForm.get('output240LoadA')?.value || '0');
      result.outputLoadA_PF = this.outputForm.get('output240LoadA_PF')?.value || 'P';
      result.outputLoadB = parseFloat(this.outputForm.get('output240LoadB')?.value || '0');
      result.outputLoadB_PF = this.outputForm.get('output240LoadB_PF')?.value || 'P';
      result.totalLoad = parseFloat(this.outputForm.get('output240TotalLoad')?.value || '0');
      result.outputFreq_T = parseFloat(this.outputForm.get('output240Freq')?.value || '60');
      result.outputFreq_PF = this.outputForm.get('output240Freq_PF')?.value || 'P';
    } else if (voltage === '3') { // 208V
      result.outputVoltA_T = parseFloat(this.outputForm.get('output208VoltAB')?.value || '0');
      result.outputVoltA_PF = this.outputForm.get('output208VoltAB_PF')?.value || 'P';
      result.outputVoltB_T = parseFloat(this.outputForm.get('output208VoltBC')?.value || '0');
      result.outputVoltB_PF = this.outputForm.get('output208VoltBC_PF')?.value || 'P';
      result.outputVoltC_T = parseFloat(this.outputForm.get('output208VoltCA')?.value || '0');
      result.outputVoltC_PF = this.outputForm.get('output208VoltCA_PF')?.value || 'P';
      result.outputCurrA_T = parseFloat(this.outputForm.get('output208CurrA')?.value || '0');
      result.outputCurrA_PF = this.outputForm.get('output208CurrA_PF')?.value || 'P';
      result.outputCurrB_T = parseFloat(this.outputForm.get('output208CurrB')?.value || '0');
      result.outputCurrB_PF = this.outputForm.get('output208CurrB_PF')?.value || 'P';
      result.outputCurrC_T = parseFloat(this.outputForm.get('output208CurrC')?.value || '0');
      result.outputCurrC_PF = this.outputForm.get('output208CurrC_PF')?.value || 'P';
      result.outputLoadA = parseFloat(this.outputForm.get('output208LoadA')?.value || '0');
      result.outputLoadA_PF = this.outputForm.get('output208LoadA_PF')?.value || 'P';
      result.outputLoadB = parseFloat(this.outputForm.get('output208LoadB')?.value || '0');
      result.outputLoadB_PF = this.outputForm.get('output208LoadB_PF')?.value || 'P';
      result.outputLoadC = parseFloat(this.outputForm.get('output208LoadC')?.value || '0');
      result.outputLoadC_PF = this.outputForm.get('output208LoadC_PF')?.value || 'P';
      result.totalLoad = parseFloat(this.outputForm.get('output208TotalLoad')?.value || '0');
      result.outputFreq_T = parseFloat(this.outputForm.get('output208Freq')?.value || '60');
      result.outputFreq_PF = this.outputForm.get('output208Freq_PF')?.value || 'P';
    } else if (voltage === '4') { // 480V
      result.outputVoltA_T = parseFloat(this.outputForm.get('output480VoltAB')?.value || '0');
      result.outputVoltA_PF = this.outputForm.get('output480VoltAB_PF')?.value || 'P';
      result.outputVoltB_T = parseFloat(this.outputForm.get('output480VoltBC')?.value || '0');
      result.outputVoltB_PF = this.outputForm.get('output480VoltBC_PF')?.value || 'P';
      result.outputVoltC_T = parseFloat(this.outputForm.get('output480VoltCA')?.value || '0');
      result.outputVoltC_PF = this.outputForm.get('output480VoltCA_PF')?.value || 'P';
      result.outputCurrA_T = parseFloat(this.outputForm.get('output480CurrA')?.value || '0');
      result.outputCurrA_PF = this.outputForm.get('output480CurrA_PF')?.value || 'P';
      result.outputCurrB_T = parseFloat(this.outputForm.get('output480CurrB')?.value || '0');
      result.outputCurrB_PF = this.outputForm.get('output480CurrB_PF')?.value || 'P';
      result.outputCurrC_T = parseFloat(this.outputForm.get('output480CurrC')?.value || '0');
      result.outputCurrC_PF = this.outputForm.get('output480CurrC_PF')?.value || 'P';
      result.outputLoadA = parseFloat(this.outputForm.get('output480LoadA')?.value || '0');
      result.outputLoadA_PF = this.outputForm.get('output480LoadA_PF')?.value || 'P';
      result.outputLoadB = parseFloat(this.outputForm.get('output480LoadB')?.value || '0');
      result.outputLoadB_PF = this.outputForm.get('output480LoadB_PF')?.value || 'P';
      result.outputLoadC = parseFloat(this.outputForm.get('output480LoadC')?.value || '0');
      result.outputLoadC_PF = this.outputForm.get('output480LoadC_PF')?.value || 'P';
      result.totalLoad = parseFloat(this.outputForm.get('output480TotalLoad')?.value || '0');
      result.outputFreq_T = parseFloat(this.outputForm.get('output480Freq')?.value || '60');
      result.outputFreq_PF = this.outputForm.get('output480Freq_PF')?.value || 'P';
    } else if (voltage === '5') { // 600V
      result.outputVoltA_T = parseFloat(this.outputForm.get('output600VoltAB')?.value || '0');
      result.outputVoltA_PF = this.outputForm.get('output600VoltAB_PF')?.value || 'P';
      result.outputVoltB_T = parseFloat(this.outputForm.get('output600VoltBC')?.value || '0');
      result.outputVoltB_PF = this.outputForm.get('output600VoltBC_PF')?.value || 'P';
      result.outputVoltC_T = parseFloat(this.outputForm.get('output600VoltCA')?.value || '0');
      result.outputVoltC_PF = this.outputForm.get('output600VoltCA_PF')?.value || 'P';
      result.outputCurrA_T = parseFloat(this.outputForm.get('output600CurrA')?.value || '0');
      result.outputCurrA_PF = this.outputForm.get('output600CurrA_PF')?.value || 'P';
      result.outputCurrB_T = parseFloat(this.outputForm.get('output600CurrB')?.value || '0');
      result.outputCurrB_PF = this.outputForm.get('output600CurrB_PF')?.value || 'P';
      result.outputCurrC_T = parseFloat(this.outputForm.get('output600CurrC')?.value || '0');
      result.outputCurrC_PF = this.outputForm.get('output600CurrC_PF')?.value || 'P';
      result.outputLoadA = parseFloat(this.outputForm.get('output600LoadA')?.value || '0');
      result.outputLoadA_PF = this.outputForm.get('output600LoadA_PF')?.value || 'P';
      result.outputLoadB = parseFloat(this.outputForm.get('output600LoadB')?.value || '0');
      result.outputLoadB_PF = this.outputForm.get('output600LoadB_PF')?.value || 'P';
      result.outputLoadC = parseFloat(this.outputForm.get('output600LoadC')?.value || '0');
      result.outputLoadC_PF = this.outputForm.get('output600LoadC_PF')?.value || 'P';
      result.totalLoad = parseFloat(this.outputForm.get('output600TotalLoad')?.value || '0');
      result.outputFreq_T = parseFloat(this.outputForm.get('output600Freq')?.value || '60');
      result.outputFreq_PF = this.outputForm.get('output600Freq_PF')?.value || 'P';
    } else if (voltage === '6') { // 575V
      result.outputVoltA_T = parseFloat(this.outputForm.get('output575VoltAB')?.value || '0');
      result.outputVoltA_PF = this.outputForm.get('output575VoltAB_PF')?.value || 'P';
      result.outputVoltB_T = parseFloat(this.outputForm.get('output575VoltBC')?.value || '0');
      result.outputVoltB_PF = this.outputForm.get('output575VoltBC_PF')?.value || 'P';
      result.outputVoltC_T = parseFloat(this.outputForm.get('output575VoltCA')?.value || '0');
      result.outputVoltC_PF = this.outputForm.get('output575VoltCA_PF')?.value || 'P';
      result.outputCurrA_T = parseFloat(this.outputForm.get('output575CurrA')?.value || '0');
      result.outputCurrA_PF = this.outputForm.get('output575CurrA_PF')?.value || 'P';
      result.outputCurrB_T = parseFloat(this.outputForm.get('output575CurrB')?.value || '0');
      result.outputCurrB_PF = this.outputForm.get('output575CurrB_PF')?.value || 'P';
      result.outputCurrC_T = parseFloat(this.outputForm.get('output575CurrC')?.value || '0');
      result.outputCurrC_PF = this.outputForm.get('output575CurrC_PF')?.value || 'P';
      result.outputLoadA = parseFloat(this.outputForm.get('output575LoadA')?.value || '0');
      result.outputLoadA_PF = this.outputForm.get('output575LoadA_PF')?.value || 'P';
      result.outputLoadB = parseFloat(this.outputForm.get('output575LoadB')?.value || '0');
      result.outputLoadB_PF = this.outputForm.get('output575LoadB_PF')?.value || 'P';
      result.outputLoadC = parseFloat(this.outputForm.get('output575LoadC')?.value || '0');
      result.outputLoadC_PF = this.outputForm.get('output575LoadC_PF')?.value || 'P';
      result.totalLoad = parseFloat(this.outputForm.get('output575TotalLoad')?.value || '0');
      result.outputFreq_T = parseFloat(this.outputForm.get('output575Freq')?.value || '60');
      result.outputFreq_PF = this.outputForm.get('output575Freq_PF')?.value || 'P';
    }

    return result;
  }
}
