import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { PduService } from 'src/app/core/services/pdu.service';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { BatteryReadingsService } from 'src/app/core/services/battery-readings.service';
import { PDUReadings, PDUReconciliationInfo, VOLTAGE_CONFIGS, OUTPUT_VOLTAGE_CONFIGS, VoltageConfiguration } from 'src/app/core/model/pdu-readings.model';
import { EquipFilterCurrents } from 'src/app/core/model/ups-readings.model';

@Component({
  selector: 'app-pdu-readings',
  templateUrl: './pdu-readings.component.html',
  styleUrls: ['./pdu-readings.component.scss']
})
export class PduReadingsComponent implements OnInit {
  // Route parameters
  callNbr: string = '';
  equipId: number = 0;
  pduId: string = '';
  techId: string = '';
  techName: string = '';
  digest: string = '';

  // Form groups
  equipmentForm!: FormGroup;
  reconciliationForm!: FormGroup;
  visualForm!: FormGroup;
  inputForm!: FormGroup;
  outputForm!: FormGroup;
  commentsForm!: FormGroup;

  // Dropdown options
  manufacturers: Array<{ value: string; label: string }> = [];
  statusOptions = [
    { value: 'Online', label: 'On-Line' },
    { value: 'CriticalDeficiency', label: 'Critical Deficiency' },
    { value: 'ReplacementRecommended', label: 'Replacement Recommended' },
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

  voltageConfigs = VOLTAGE_CONFIGS;
  outputVoltageConfigs = OUTPUT_VOLTAGE_CONFIGS;

  // UI state
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  
  // Section visibility
  showPowerVerification = true;
  
  // Filter Current and THD visibility
  showInputFilterCurrent = false;
  showInputTHD = false;
  showOutputFilterCurrent = false;
  showOutputTHD = false;
  filterCurrentsData: EquipFilterCurrents | null = null;
  
  // Current voltage selections
  selectedInputVoltage: string = '0';
  selectedOutputVoltage: string = '0';

  // Visibility flags for voltage sections
  showInput120 = false;
  showInput240 = false;
  showInput208 = false;
  showInput480 = false;
  showInput575 = false;
  showInput600 = false;

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
    private pduService: PduService,
    private equipmentService: EquipmentService,
    private batteryService: BatteryReadingsService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRouteParams();
    this.initializeForms();
    this.setupFilterCurrentCheckboxHandlers();
    this.loadManufacturers();
    this.loadData();
  }

  // Legacy-equivalent: GetEquipStatus() for PDU
  private async getEquipStatus(): Promise<string> {
    try {
      const [jobSummary, statusDesc] = await Promise.all([
        this.equipmentService.getJobSummaryReport(this.callNbr, this.equipId, 'PDU').toPromise(),
        this.equipmentService.getStatusDescription('PDU').toPromise()
      ]);

      let resultStatus = 'Online';
      const rows = jobSummary?.Tables?.[0]?.Rows?.length ? jobSummary.Tables[0].Rows : jobSummary?.data?.primaryData;
      console.log('GetEquipStatus rows:', rows);
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
            if (tempField === 'N' || tempField === 'F' || tempField === 'True' || tempField === '12' || tempField === 'W') {
              shouldCheckStatus = true;
            }
          }

          if (shouldCheckStatus) {
            console.log('GetEquipStatus match ->', { tempColumn, tempField });
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
                console.log('GetEquipStatus override ->', { tempColumn, type });
                if (type === 'CriticalDeficiency') {
                  return 'CriticalDeficiency';
                } else if (type === 'OnLine(MajorDeficiency)') {
                  resultStatus = 'OnLine(MajorDeficiency)';
                } else if (type === 'ReplacementRecommended') {
                  resultStatus = 'ReplacementRecommended';
                } else if (type === 'ProactiveReplacement') {
                  resultStatus = 'ProactiveReplacement';
                }
              }
            }
          }
        }
      }
        console.log('GetEquipStatus resultStatus ->', resultStatus);
      return resultStatus;
    } catch (e) {
        console.error('GetEquipStatus error ->', e);
      return 'Online';
    }
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.equipId = parseInt(params['EquipId'] || '0');
      this.pduId = decodeURIComponent(params['PDUId'] || '');
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
      serialNo: [''],
      location: [''],
      dateCode: [null],
      kva: [''],
      temperature: [''],
      status: ['Online'],
      statusNotes: ['']
    });

    // Reconciliation Form
    this.reconciliationForm = this.fb.group({
      recMake: [''],
      recMakeCorrect: ['YS'],
      actMake: [''],
      recModel: [''],
      recModelCorrect: ['YS'],
      actModel: [''],
      recSerialNo: [''],
      recSerialNoCorrect: ['YS'],
      actSerialNo: [''],
      kvaSize: [''],
      kvaCorrect: ['YS'],
      actKVA: [''],
      ascStringsNo: [''],
      ascStringsCorrect: ['YS'],
      actASCStringNo: [''],
      battPerString: [''],
      battPerStringCorrect: ['YS'],
      actBattPerString: [''],
      totalEquips: [''],
      totalEquipsCorrect: ['YS'],
      actTotalEquips: [''],
      newEquipment: ['NO'],
      equipmentNotes: [''],
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
      staticSwitch: ['P'],
      frontPanel: ['P'],
      internalPower: ['P'],
      localMonitoring: ['P'],
      localEPO: ['P'],
      neutralCurrent: [''],
      groundCurrent: [''],
      comments: ['']
    });

    // Input Power Form
    this.inputForm = this.fb.group({
      inputVoltage: ['0'],
      inputFilterCurrent: [false],
      inputThdPercent: [false],
      // 120V Input
      input120VoltA: ['120'],
      input120VoltA_PF: ['P'],
      input120CurrA: [''],
      input120CurrA_PF: ['P'],
      input120Freq: ['60'],
      input120Freq_PF: ['P'],
      // 240V Input
      input240VoltA: ['120'],
      input240VoltA_PF: ['P'],
      input240VoltB: ['120'],
      input240VoltB_PF: ['P'],
      input240CurrA: [''],
      input240CurrA_PF: ['P'],
      input240CurrB: [''],
      input240CurrB_PF: ['P'],
      input240Freq: ['60'],
      input240Freq_PF: ['P'],
      // 208V Input
      input208VoltAB: ['208'],
      input208VoltAB_PF: ['P'],
      input208VoltBC: ['208'],
      input208VoltBC_PF: ['P'],
      input208VoltCA: ['208'],
      input208VoltCA_PF: ['P'],
      input208CurrA: [''],
      input208CurrA_PF: ['P'],
      input208CurrB: [''],
      input208CurrB_PF: ['P'],
      input208CurrC: [''],
      input208CurrC_PF: ['P'],
      input208Freq: ['60'],
      input208Freq_PF: ['P'],
      // 480V Input
      input480VoltAB: ['480'],
      input480VoltAB_PF: ['P'],
      input480VoltBC: ['480'],
      input480VoltBC_PF: ['P'],
      input480VoltCA: ['480'],
      input480VoltCA_PF: ['P'],
      input480CurrA: [''],
      input480CurrA_PF: ['P'],
      input480CurrB: [''],
      input480CurrB_PF: ['P'],
      input480CurrC: [''],
      input480CurrC_PF: ['P'],
      input480Freq: ['60'],
      input480Freq_PF: ['P'],
      // 575V Input
      input575VoltAB: ['575'],
      input575VoltAB_PF: ['P'],
      input575VoltBC: ['575'],
      input575VoltBC_PF: ['P'],
      input575VoltCA: ['575'],
      input575VoltCA_PF: ['P'],
      input575CurrA: [''],
      input575CurrA_PF: ['P'],
      input575CurrB: [''],
      input575CurrB_PF: ['P'],
      input575CurrC: [''],
      input575CurrC_PF: ['P'],
      input575Freq: ['60'],
      input575Freq_PF: ['P'],
      // 600V Input
      input600VoltAB: ['600'],
      input600VoltAB_PF: ['P'],
      input600VoltBC: ['600'],
      input600VoltBC_PF: ['P'],
      input600VoltCA: ['600'],
      input600VoltCA_PF: ['P'],
      input600CurrA: [''],
      input600CurrA_PF: ['P'],
      input600CurrB: [''],
      input600CurrB_PF: ['P'],
      input600CurrC: [''],
      input600CurrC_PF: ['P'],
      input600Freq: ['60'],
      input600Freq_PF: ['P'],

      // Input Filter Current detail fields
      filterCurrentA: [''],
      filterCurrentA_PF: ['P'],
      filterCurrentB: [''],
      filterCurrentB_PF: ['P'],
      filterCurrentC: [''],
      filterCurrentC_PF: ['P'],

      // Input THD detail fields
      inputThdA: [''],
      inputThdA_PF: ['P'],
      inputThdB: [''],
      inputThdB_PF: ['P'],
      inputThdC: [''],
      inputThdC_PF: ['P']
    });

    // Output Power Form
    this.outputForm = this.fb.group({
      outputVoltage: ['0'],
      outputFilterCurrent: [false],
      outputThdPercent: [false],
      // 120V Output
      output120VoltA: ['120'],
      output120VoltA_PF: ['P'],
      output120CurrA: [''],
      output120CurrA_PF: ['P'],
      output120Freq: ['60'],
      output120Freq_PF: ['P'],
      load120A: [''],
      load120A_PF: ['P'],
      total120Load: [''],
      // 240V Output
      output240VoltA: ['120'],
      output240VoltA_PF: ['P'],
      output240VoltB: ['120'],
      output240VoltB_PF: ['P'],
      output240CurrA: [''],
      output240CurrA_PF: ['P'],
      output240CurrB: [''],
      output240CurrB_PF: ['P'],
      output240Freq: ['60'],
      output240Freq_PF: ['P'],
      load240A: [''],
      load240A_PF: ['P'],
      load240B: [''],
      load240B_PF: ['P'],
      total240Load: [''],
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
      output208Freq: ['60'],
      output208Freq_PF: ['P'],
      load208A: [''],
      load208A_PF: ['P'],
      load208B: [''],
      load208B_PF: ['P'],
      load208C: [''],
      load208C_PF: ['P'],
      total208Load: [''],
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
      output480Freq: ['60'],
      output480Freq_PF: ['P'],
      load480A: [''],
      load480A_PF: ['P'],
      load480B: [''],
      load480B_PF: ['P'],
      load480C: [''],
      load480C_PF: ['P'],
      total480Load: [''],
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
      output575Freq: ['60'],
      output575Freq_PF: ['P'],
      load575A: [''],
      load575A_PF: ['P'],
      load575B: [''],
      load575B_PF: ['P'],
      load575C: [''],
      load575C_PF: ['P'],
      total575Load: [''],
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
      output600Freq: ['60'],
      output600Freq_PF: ['P'],
      load600A: [''],
      load600A_PF: ['P'],
      load600B: [''],
      load600B_PF: ['P'],
      load600C: [''],
      load600C_PF: ['P'],
      total600Load: [''],

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

    // Comments Form
    this.commentsForm = this.fb.group({
      comments1: [''],
      comments5: ['']
    });

    // Setup input voltage change listener
    this.inputForm.get('inputVoltage')?.valueChanges.subscribe(value => {
      this.onInputVoltageChange(value);
    });

    // Setup output voltage change listener
    this.outputForm.get('outputVoltage')?.valueChanges.subscribe(value => {
      this.onOutputVoltageChange(value);
    });
  }

  private loadManufacturers(): void {
    this.equipmentService.getManufacturerNames().subscribe({
      next: (manufacturers) => {
        // API returns objects like { manufID: string, manufName: string }
        // Filter out empty entries, trim values, and deduplicate by manufID
        const cleaned = (manufacturers || [])
          .map((m: any) => ({
            value: (m.value ?? m.id ?? '').toString().trim(),
            label: (m.text ?? m.name ?? '').toString().trim()
          }))
          .filter((m: any) => m.value && m.label);

        // Deduplicate by value (manufID)
        const seen = new Set<string>();
        this.manufacturers = cleaned.filter(m => {
          if (seen.has(m.value)) return false;
          seen.add(m.value);
          return true;
        });
      },
      error: (error) => {
        console.error('Error loading manufacturers:', error);
        this.toastr.error('Failed to load manufacturers');
      }
    });
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    try {
      await Promise.all([
        this.loadPDUReadings(),
        this.loadReconciliationInfo(),
        this.loadFilterCurrentsData()
      ]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Failed to load PDU data';
    } finally {
      this.loading = false;
    }
  }

  // Part 2 - Add these methods to the PduReadingsComponent class

  private async loadPDUReadings(): Promise<void> {
    try {
      const data = await this.pduService.getPDUReadings(this.callNbr, this.equipId, this.pduId).toPromise();
      
      if (data) {
        this.populateFormsWithData(data);
      } else {
        // Load basic equipment info if no PDU readings exist
        await this.loadEquipmentInfo();
      }
    } catch (error) {
      console.error('Error loading PDU readings:', error);
      // Try to load basic equipment info as fallback
      await this.loadEquipmentInfo();
    }
  }

  private setupFilterCurrentCheckboxHandlers(): void {
    this.inputForm.get('inputFilterCurrent')?.valueChanges.subscribe(checked => {
      this.showInputFilterCurrent = !!checked;
    });

    this.inputForm.get('inputThdPercent')?.valueChanges.subscribe(checked => {
      this.showInputTHD = !!checked;
    });

    this.outputForm.get('outputFilterCurrent')?.valueChanges.subscribe(checked => {
      this.showOutputFilterCurrent = !!checked;
    });

    this.outputForm.get('outputThdPercent')?.valueChanges.subscribe(checked => {
      this.showOutputTHD = !!checked;
    });
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

    // Input Filter Current data
    if (data.chkIpFilter) {
      this.inputForm.patchValue({
        inputFilterCurrent: true,
        filterCurrentA: this.convertZeroToEmpty(data.ipFilterCurrA_T),
        filterCurrentA_PF: data.ipFilterCurrA_PF || 'P',
        filterCurrentB: this.convertZeroToEmpty(data.ipFilterCurrB_T),
        filterCurrentB_PF: data.ipFilterCurrB_PF || 'P',
        filterCurrentC: this.convertZeroToEmpty(data.ipFilterCurrC_T),
        filterCurrentC_PF: data.ipFilterCurrC_PF || 'P'
      });
      this.showInputFilterCurrent = true;
    }

    // Input THD data
    if (data.chkIpThd) {
      this.inputForm.patchValue({
        inputThdPercent: true,
        inputThdA: this.convertZeroToEmpty(data.ipFilterThdA_T),
        inputThdA_PF: data.ipFilterThdA_PF || 'P',
        inputThdB: this.convertZeroToEmpty(data.ipFilterThdB_T),
        inputThdB_PF: data.ipFilterThdB_PF || 'P',
        inputThdC: this.convertZeroToEmpty(data.ipFilterThdC_T),
        inputThdC_PF: data.ipFilterThdC_PF || 'P'
      });
      this.showInputTHD = true;
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
    const hasInputFilterCurrent = !!this.inputForm.get('inputFilterCurrent')?.value;
    const hasInputTHD = !!this.inputForm.get('inputThdPercent')?.value;
    const hasOutputFilterCurrent = !!this.outputForm.get('outputFilterCurrent')?.value;
    const hasOutputTHD = !!this.outputForm.get('outputThdPercent')?.value;

    if (!hasInputFilterCurrent && !hasInputTHD && !hasOutputFilterCurrent && !hasOutputTHD) {
      return;
    }

    const filterCurrentsData: EquipFilterCurrents = {
      callNbr: this.callNbr,
      equipId: this.equipId,

      chkIpFilter: hasInputFilterCurrent,
      ipFilterCurrA_T: this.convertToDouble(this.inputForm.get('filterCurrentA')?.value),
      ipFilterCurrA_PF: this.inputForm.get('filterCurrentA_PF')?.value || 'P',
      ipFilterCurrB_T: this.convertToDouble(this.inputForm.get('filterCurrentB')?.value),
      ipFilterCurrB_PF: this.inputForm.get('filterCurrentB_PF')?.value || 'P',
      ipFilterCurrC_T: this.convertToDouble(this.inputForm.get('filterCurrentC')?.value),
      ipFilterCurrC_PF: this.inputForm.get('filterCurrentC_PF')?.value || 'P',

      chkIpThd: hasInputTHD,
      ipFilterThdA_T: this.convertToDouble(this.inputForm.get('inputThdA')?.value),
      ipFilterThdA_PF: this.inputForm.get('inputThdA_PF')?.value || 'P',
      ipFilterThdB_T: this.convertToDouble(this.inputForm.get('inputThdB')?.value),
      ipFilterThdB_PF: this.inputForm.get('inputThdB_PF')?.value || 'P',
      ipFilterThdC_T: this.convertToDouble(this.inputForm.get('inputThdC')?.value),
      ipFilterThdC_PF: this.inputForm.get('inputThdC_PF')?.value || 'P',

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

    try {
      await this.equipmentService.saveUpdateEquipFilterCurrents(filterCurrentsData).toPromise();
    } catch (error) {
      console.error('Error saving filter currents data:', error);
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

  private async loadEquipmentInfo(): Promise<void> {
    try {
      const equipInfo = await this.pduService.getEquipmentInfo(this.callNbr, this.equipId, this.pduId).toPromise();
      
      if (equipInfo) {
        this.equipmentForm.patchValue({
          manufacturer: equipInfo.vendorId || '',
          modelNo: equipInfo.model || '',
          serialNo: equipInfo.serialNo || '',
          kva: equipInfo.kva || '',
          location: equipInfo.location || ''
        });

        // Calculate dateCode from year and month if available
        if (equipInfo.equipYear && equipInfo.equipMonth) {
          const monthNum = this.getMonthNumber(equipInfo.equipMonth);
          if (monthNum > 0) {
            // JavaScript Date constructor uses 0-indexed months, so subtract 1
            const dateCode = new Date(equipInfo.equipYear, monthNum - 1, 1);
            // Format as yyyy-MM-dd for date input
            const dateStr = dateCode.toISOString().split('T')[0];
            this.equipmentForm.patchValue({ dateCode: dateStr });
          }
        }
      }
    } catch (error) {
      console.error('Error loading equipment info:', error);
    }
  }

  private async loadReconciliationInfo(): Promise<void> {
    try {
      const reconInfo = await this.batteryService.getEquipReconciliationInfo(this.callNbr, this.equipId).toPromise();
      
      if (reconInfo) {
        // Handle both actKva (model) and actKVA (API response) property names
        const actKvaValue = (reconInfo as any).actKVA || reconInfo.actKva || '';
        
        this.reconciliationForm.patchValue({
          recMake: (reconInfo.make || '').trim(),
          recMakeCorrect: (reconInfo.makeCorrect || '').trim() || 'YS',
          actMake: (reconInfo.actMake || '').trim(),
          recModel: (reconInfo.model || '').trim(),
          recModelCorrect: (reconInfo.modelCorrect || '').trim() || 'YS',
          actModel: (reconInfo.actModel || '').trim(),
          recSerialNo: (reconInfo.serialNo || '').trim(),
          recSerialNoCorrect: (reconInfo.serialNoCorrect || '').trim() || 'YS',
          actSerialNo: (reconInfo.actSerialNo || '').trim(),
          kvaSize: (reconInfo.kva || '').trim(),
          kvaCorrect: (reconInfo.kvaCorrect || '').trim() || 'YS',
          actKVA: (actKvaValue || '').trim(),
          ascStringsNo: reconInfo.ascStringsNo || 0,
          ascStringsCorrect: (reconInfo.ascStringsCorrect || '').trim() || 'YS',
          actASCStringNo: reconInfo.actAscStringNo || 0,
          battPerString: reconInfo.battPerString || 0,
          battPerStringCorrect: (reconInfo.battPerStringCorrect || '').trim() || 'YS',
          actBattPerString: reconInfo.actBattPerString || 0,
          totalEquips: reconInfo.totalEquips || 0,
          totalEquipsCorrect: (reconInfo.totalEquipsCorrect || '').trim() || 'YS',
          actTotalEquips: reconInfo.actTotalEquips || 0,
          newEquipment: 'NO',
          verified: reconInfo.verified || false
        });

        // Set KVA size from equipment form if reconciliation is empty
        if (!reconInfo.kva && this.equipmentForm.value.kva) {
          this.reconciliationForm.patchValue({ kvaSize: this.equipmentForm.value.kva });
        }
      }
    } catch (error) {
      console.error('Error loading reconciliation info:', error);
    }
  }

  private populateFormsWithData(data: PDUReadings): void {
    const trim = (v: any) => (typeof v === 'string' ? v.trim() : v);
    const normalizeStatus = (v: string | undefined) => {
      const sv = (v || '').trim();
      const valid = this.statusOptions.map(s => s.value);
      // If incoming already matches one of our values after trim, use it
      if (valid.includes(sv)) return sv;
      // Map common display strings to internal values
      const map: Record<string, string> = {
        'Off-Line': 'Offline',
        'Critical Deficiency': 'CriticalDeficiency',
        'Replacement Recommended': 'ReplacementRecommended',
        'On-Line(Major Deficiency)': 'OnLine(MajorDeficiency)',
        'On-Line(Minor Deficiency)': 'OnLine(MinorDeficiency)',
        'On-Line': 'Online'
      };
      return map[sv] || 'Online';
    };

    const resolveManufacturerValue = (name: string | undefined) => {
      const nm = (name || '').trim();
      if (!nm) return '';
      // manufacturers: { value: id, label: name }
      const found = this.manufacturers.find(m => (m.label || '').trim().toLowerCase() === nm.toLowerCase());
      return found ? found.value : nm; // fallback to name so field shows something
    };
    // Equipment form
    this.equipmentForm.patchValue({
      manufacturer: resolveManufacturerValue(data.manufacturer),
      modelNo: trim(data.modelNo) || '',
      serialNo: trim(data.serialNo) || '',
      location: trim(data.location) || '',
      kva: trim(data.kva) || '',
      temperature: trim(data.temp) || '',
      status: normalizeStatus(data.status),
      statusNotes: trim(data.statusNotes) || ''
    });

    // Calculate dateCode from year and month if available
    if (data.year && data.month) {
      const monthNum = this.getMonthNumber(data.month);
      if (monthNum > 0) {
        // JavaScript Date constructor uses 0-indexed months, so subtract 1
        const dateCode = new Date(data.year, monthNum - 1, 1);
        // Format as yyyy-MM-dd for date input
        const dateStr = dateCode.toISOString().split('T')[0];
        this.equipmentForm.patchValue({ dateCode: dateStr });
      }
    }

    // Visual form
    this.visualForm.patchValue({
      busswork: (data.busswork || 'P').trim(),
      transformers: data.transformers || 'P',
      powerConn: data.powerConn || 'P',
      mainCirBreaks: data.mainCirBreaks || 'P',
      subfeedCirBreaks: data.subfeedCirBreaks || 'P',
      currentCTs: data.currentCTs || 'P',
      circuitBoards: data.circuitBoards || 'P',
      filterCapacitors: data.filterCapacitors || 'P',
      epoConn: data.epoConn || 'P',
      wiringConn: data.wiringConn || 'P',
      ribbonCables: data.ribbonCables || 'P',
      compAirClean: data.compAirClean || 'P',
      staticSwitch: data.staticSwitch || 'P',
      frontPanel: data.frontPanel || 'P',
      internalPower: data.internalPower || 'P',
      localMonitoring: data.localMonitoring || 'P',
      localEPO: (data.localEPO || 'P').trim(),
      neutralCurrent: trim(data.neutral_T) || '',
      groundCurrent: trim(data.ground_T) || '',
      comments: trim(data.comments) || ''
    });

    // Input voltage
    if (data.input) {
      this.inputForm.patchValue({ inputVoltage: data.input });
      this.selectedInputVoltage = data.input;
      this.populateInputReadings(data);
    }

    // Output voltage
    if (data.output) {
      this.outputForm.patchValue({ outputVoltage: data.output });
      this.selectedOutputVoltage = data.output;
      this.populateOutputReadings(data);
    }

    // Comments
    this.commentsForm.patchValue({
      comments1: trim(data.comments1) || '',
      comments5: trim(data.comments5) || ''
    });
  }

  private populateInputReadings(data: PDUReadings): void {
    switch (data.input) {
      case '1': // 120V
        this.inputForm.patchValue({
          input120VoltA: data.inputVoltA_T || 120,
          input120VoltA_PF: data.inputVoltA_PF || 'P',
          input120CurrA: this.removeZeros(data.inputCurrA_T),
          input120CurrA_PF: data.inputCurrA_PF || 'P',
          input120Freq: data.inputFreq_T || 60,
          input120Freq_PF: data.inputFreq_PF || 'P'
        });
        break;
      case '2': // 240V
        this.inputForm.patchValue({
          input240VoltA: data.inputVoltA_T || 120,
          input240VoltA_PF: data.inputVoltA_PF || 'P',
          input240VoltB: data.inputVoltB_T || 120,
          input240VoltB_PF: data.inputVoltB_PF || 'P',
          input240CurrA: this.removeZeros(data.inputCurrA_T),
          input240CurrA_PF: data.inputCurrA_PF || 'P',
          input240CurrB: this.removeZeros(data.inputCurrB_T),
          input240CurrB_PF: data.inputCurrB_PF || 'P',
          input240Freq: data.inputFreq_T || 60,
          input240Freq_PF: data.inputFreq_PF || 'P'
        });
        break;
      case '3': // 208V
        this.inputForm.patchValue({
          input208VoltAB: data.inputVoltA_T || 208,
          input208VoltAB_PF: data.inputVoltA_PF || 'P',
          input208VoltBC: data.inputVoltB_T || 208,
          input208VoltBC_PF: data.inputVoltB_PF || 'P',
          input208VoltCA: data.inputVoltC_T || 208,
          input208VoltCA_PF: data.inputVoltC_PF || 'P',
          input208CurrA: this.removeZeros(data.inputCurrA_T),
          input208CurrA_PF: data.inputCurrA_PF || 'P',
          input208CurrB: this.removeZeros(data.inputCurrB_T),
          input208CurrB_PF: data.inputCurrB_PF || 'P',
          input208CurrC: this.removeZeros(data.inputCurrC_T),
          input208CurrC_PF: data.inputCurrC_PF || 'P',
          input208Freq: data.inputFreq_T || 60,
          input208Freq_PF: data.inputFreq_PF || 'P'
        });
        break;
      case '4': // 480V
        this.inputForm.patchValue({
          input480VoltAB: data.inputVoltA_T || 480,
          input480VoltAB_PF: data.inputVoltA_PF || 'P',
          input480VoltBC: data.inputVoltB_T || 480,
          input480VoltBC_PF: data.inputVoltB_PF || 'P',
          input480VoltCA: data.inputVoltC_T || 480,
          input480VoltCA_PF: data.inputVoltC_PF || 'P',
          input480CurrA: this.removeZeros(data.inputCurrA_T),
          input480CurrA_PF: data.inputCurrA_PF || 'P',
          input480CurrB: this.removeZeros(data.inputCurrB_T),
          input480CurrB_PF: data.inputCurrB_PF || 'P',
          input480CurrC: this.removeZeros(data.inputCurrC_T),
          input480CurrC_PF: data.inputCurrC_PF || 'P',
          input480Freq: data.inputFreq_T || 60,
          input480Freq_PF: data.inputFreq_PF || 'P'
        });
        break;
      case '6': // 575V
        this.inputForm.patchValue({
          input575VoltAB: data.inputVoltA_T || 575,
          input575VoltAB_PF: data.inputVoltA_PF || 'P',
          input575VoltBC: data.inputVoltB_T || 575,
          input575VoltBC_PF: data.inputVoltB_PF || 'P',
          input575VoltCA: data.inputVoltC_T || 575,
          input575VoltCA_PF: data.inputVoltC_PF || 'P',
          input575CurrA: data.inputCurrA_T || '',
          input575CurrA_PF: data.inputCurrA_PF || 'P',
          input575CurrB: data.inputCurrB_T || '',
          input575CurrB_PF: data.inputCurrB_PF || 'P',
          input575CurrC: data.inputCurrC_T || '',
          input575CurrC_PF: data.inputCurrC_PF || 'P',
          input575Freq: data.inputFreq_T || 60,
          input575Freq_PF: data.inputFreq_PF || 'P'
        });
        break;
      case '5': // 600V
        this.inputForm.patchValue({
          input600VoltAB: data.inputVoltA_T || 600,
          input600VoltAB_PF: data.inputVoltA_PF || 'P',
          input600VoltBC: data.inputVoltB_T || 600,
          input600VoltBC_PF: data.inputVoltB_PF || 'P',
          input600VoltCA: data.inputVoltC_T || 600,
          input600VoltCA_PF: data.inputVoltC_PF || 'P',
          input600CurrA: data.inputCurrA_T || '',
          input600CurrA_PF: data.inputCurrA_PF || 'P',
          input600CurrB: data.inputCurrB_T || '',
          input600CurrB_PF: data.inputCurrB_PF || 'P',
          input600CurrC: data.inputCurrC_T || '',
          input600CurrC_PF: data.inputCurrC_PF || 'P',
          input600Freq: data.inputFreq_T || 60,
          input600Freq_PF: data.inputFreq_PF || 'P'
        });
        break;
    }
  }

  private populateOutputReadings(data: PDUReadings): void {
    switch (data.output) {
      case '1': // 120V
        this.outputForm.patchValue({
          output120VoltA: data.outputVoltA_T || 120,
          output120VoltA_PF: data.outputVoltA_PF || 'P',
          output120CurrA: this.removeZeros(data.outputCurrA_T),
          output120CurrA_PF: data.outputCurrA_PF || 'P',
          output120Freq: data.outputFreq_T || 60,
          output120Freq_PF: data.outputFreq_PF || 'P',
          load120A: this.removeZeros(data.outputLoadA),
          load120A_PF: data.outputLoadA_PF || 'P',
          total120Load: this.removeZeros(data.totalLoad)
        });
        break;
      case '2': // 240V
        this.outputForm.patchValue({
          output240VoltA: data.outputVoltA_T || 120,
          output240VoltA_PF: data.outputVoltA_PF || 'P',
          output240VoltB: data.outputVoltB_T || 120,
          output240VoltB_PF: data.outputVoltB_PF || 'P',
          output240CurrA: this.removeZeros(data.outputCurrA_T),
          output240CurrA_PF: data.outputCurrA_PF || 'P',
          output240CurrB: this.removeZeros(data.outputCurrB_T),
          output240CurrB_PF: data.outputCurrB_PF || 'P',
          output240Freq: data.outputFreq_T || 60,
          output240Freq_PF: data.outputFreq_PF || 'P',
          load240A: this.removeZeros(data.outputLoadA),
          load240A_PF: data.outputLoadA_PF || 'P',
          load240B: this.removeZeros(data.outputLoadB),
          load240B_PF: data.outputLoadB_PF || 'P',
          total240Load: this.removeZeros(data.totalLoad)
        });
        break;
      case '3': // 208V
        this.outputForm.patchValue({
          output208VoltAB: data.outputVoltA_T || 208,
          output208VoltAB_PF: data.outputVoltA_PF || 'P',
          output208VoltBC: data.outputVoltB_T || 208,
          output208VoltBC_PF: data.outputVoltB_PF || 'P',
          output208VoltCA: data.outputVoltC_T || 208,
          output208VoltCA_PF: data.outputVoltC_PF || 'P',
          output208CurrA: this.removeZeros(data.outputCurrA_T),
          output208CurrA_PF: data.outputCurrA_PF || 'P',
          output208CurrB: this.removeZeros(data.outputCurrB_T),
          output208CurrB_PF: data.outputCurrB_PF || 'P',
          output208CurrC: this.removeZeros(data.outputCurrC_T),
          output208CurrC_PF: data.outputCurrC_PF || 'P',
          output208Freq: data.outputFreq_T || 60,
          output208Freq_PF: data.outputFreq_PF || 'P',
          load208A: this.removeZeros(data.outputLoadA),
          load208A_PF: data.outputLoadA_PF || 'P',
          load208B: this.removeZeros(data.outputLoadB),
          load208B_PF: data.outputLoadB_PF || 'P',
          load208C: this.removeZeros(data.outputLoadC),
          load208C_PF: data.outputLoadC_PF || 'P',
          total208Load: this.removeZeros(data.totalLoad)
        });
        break;
      case '4': // 480V
        this.outputForm.patchValue({
          output480VoltAB: data.outputVoltA_T || 480,
          output480VoltAB_PF: data.outputVoltA_PF || 'P',
          output480VoltBC: data.outputVoltB_T || 480,
          output480VoltBC_PF: data.outputVoltB_PF || 'P',
          output480VoltCA: data.outputVoltC_T || 480,
          output480VoltCA_PF: data.outputVoltC_PF || 'P',
          output480CurrA: this.removeZeros(data.outputCurrA_T),
          output480CurrA_PF: data.outputCurrA_PF || 'P',
          output480CurrB: this.removeZeros(data.outputCurrB_T),
          output480CurrB_PF: data.outputCurrB_PF || 'P',
          output480CurrC: this.removeZeros(data.outputCurrC_T),
          output480CurrC_PF: data.outputCurrC_PF || 'P',
          output480Freq: data.outputFreq_T || 60,
          output480Freq_PF: data.outputFreq_PF || 'P',
          load480A: this.removeZeros(data.outputLoadA),
          load480A_PF: data.outputLoadA_PF || 'P',
          load480B: this.removeZeros(data.outputLoadB),
          load480B_PF: data.outputLoadB_PF || 'P',
          load480C: this.removeZeros(data.outputLoadC),
          load480C_PF: data.outputLoadC_PF || 'P',
          total480Load: this.removeZeros(data.totalLoad)
        });
        break;
      case '6': // 575V
        this.outputForm.patchValue({
          output575VoltAB: data.outputVoltA_T || 575,
          output575VoltAB_PF: data.outputVoltA_PF || 'P',
          output575VoltBC: data.outputVoltB_T || 575,
          output575VoltBC_PF: data.outputVoltB_PF || 'P',
          output575VoltCA: data.outputVoltC_T || 575,
          output575VoltCA_PF: data.outputVoltC_PF || 'P',
          output575CurrA: data.outputCurrA_T || '',
          output575CurrA_PF: data.outputCurrA_PF || 'P',
          output575CurrB: data.outputCurrB_T || '',
          output575CurrB_PF: data.outputCurrB_PF || 'P',
          output575CurrC: data.outputCurrC_T || '',
          output575CurrC_PF: data.outputCurrC_PF || 'P',
          output575Freq: data.outputFreq_T || 60,
          output575Freq_PF: data.outputFreq_PF || 'P',
          load575A: data.outputLoadA || '',
          load575A_PF: data.outputLoadA_PF || 'P',
          load575B: data.outputLoadB || '',
          load575B_PF: data.outputLoadB_PF || 'P',
          load575C: data.outputLoadC || '',
          load575C_PF: data.outputLoadC_PF || 'P',
          total575Load: data.totalLoad || ''
        });
        break;
      case '5': // 600V
        this.outputForm.patchValue({
          output600VoltAB: data.outputVoltA_T || 600,
          output600VoltAB_PF: data.outputVoltA_PF || 'P',
          output600VoltBC: data.outputVoltB_T || 600,
          output600VoltBC_PF: data.outputVoltB_PF || 'P',
          output600VoltCA: data.outputVoltC_T || 600,
          output600VoltCA_PF: data.outputVoltC_PF || 'P',
          output600CurrA: data.outputCurrA_T || '',
          output600CurrA_PF: data.outputCurrA_PF || 'P',
          output600CurrB: data.outputCurrB_T || '',
          output600CurrB_PF: data.outputCurrB_PF || 'P',
          output600CurrC: data.outputCurrC_T || '',
          output600CurrC_PF: data.outputCurrC_PF || 'P',
          output600Freq: data.outputFreq_T || 60,
          output600Freq_PF: data.outputFreq_PF || 'P',
          load600A: data.outputLoadA || '',
          load600A_PF: data.outputLoadA_PF || 'P',
          load600B: data.outputLoadB || '',
          load600B_PF: data.outputLoadB_PF || 'P',
          load600C: data.outputLoadC || '',
          load600C_PF: data.outputLoadC_PF || 'P',
          total600Load: data.totalLoad || ''
        });
        break;
    }
  }

  // Voltage selection handlers
  onInputVoltageChange(voltage: string): void {
    this.selectedInputVoltage = voltage;
    
    // Hide all sections first
    this.showInput120 = false;
    this.showInput240 = false;
    this.showInput208 = false;
    this.showInput480 = false;
    this.showInput575 = false;
    this.showInput600 = false;

    // Show selected section
    switch (voltage) {
      case '1': this.showInput120 = true; break;
      case '2': this.showInput240 = true; break;
      case '3': this.showInput208 = true; break;
      case '4': this.showInput480 = true; break;
      case '6': this.showInput575 = true; break;
      case '5': this.showInput600 = true; break;
    }
  }

  onOutputVoltageChange(voltage: string): void {
    this.selectedOutputVoltage = voltage;
    
    // Hide all sections first
    this.showOutput120 = false;
    this.showOutput240 = false;
    this.showOutput208 = false;
    this.showOutput480 = false;
    this.showOutput575 = false;
    this.showOutput600 = false;

    // Show selected section
    switch (voltage) {
      case '1': this.showOutput120 = true; break;
      case '2': this.showOutput240 = true; break;
      case '3': this.showOutput208 = true; break;
      case '4': this.showOutput480 = true; break;
      case '6': this.showOutput575 = true; break;
      case '5': this.showOutput600 = true; break;
    }
  }

  // Calculate phase-to-neutral voltage
  calculatePhaseToNeutral(voltage: string | number): string {
    const volt = typeof voltage === 'string' ? parseFloat(voltage) : voltage;
    if (!volt || volt === 0) return '0';
    
    const result = this.pduService.calculatePhaseToNeutralVoltage(volt);
    return result.toString();
  }

  // Get phase-to-neutral label
  getPhaseToNeutralLabel(phase: string): string {
    // For 3-phase voltage (208V, 480V, 575V, 600V), calculate P-N from line-to-line
    return 'P-N';
  }

  // Get input voltage tolerance based on selected voltage
  getInputVoltageTolerance(voltage: string): string {
    switch(voltage) {
      case '1': return '110V - 130V';  // 120V
      case '2': return '228V - 252V';  // 240V
      case '3': return '192V - 224V';  // 208V
      case '4': return '455V - 505V';  // 480V
      case '6': return '545V - 605V';  // 575V
      case '5': return '570V - 630V';  // 600V
      default: return '';
    }
  }

  // Get output voltage tolerance based on selected voltage
  getOutputVoltageTolerance(voltage: string): string {
    switch(voltage) {
      case '1': return '114V - 126V';  // 120V
      case '2': return '228V - 252V';  // 240V
      case '3': return '197V - 219V';  // 208V
      case '4': return '460V - 500V';  // 480V
      case '6': return '547V - 603V';  // 575V
      case '5': return '580V - 620V';  // 600V
      default: return '';
    }
  }

  // Calculate load percentage
  calculateLoadPercentage(voltage: string): boolean {
    const kva = parseFloat(this.equipmentForm.value.kva || '0');
    if (!kva) {
      this.toastr.warning('KVA value cannot be empty');
      return false;
    }

    const addComment = (txt: string) => {
      const existing = this.trimValue(this.commentsForm.get('comments5')?.value);
      const updated = existing ? `${existing}\n${txt}` : txt;
      this.commentsForm.patchValue({ comments5: updated });
    };

    const setPf = (control: string, value: 'P' | 'F') => {
      this.outputForm.patchValue({ [control]: value });
    };

    const confirmOrCancel = (message: string): boolean => {
      return window.confirm(message);
    };

    switch (voltage) {
      case '1': { // 120V
        const currA = this.outputForm.value.output120CurrA;
        if (currA === null || currA === undefined || currA === '') {
          this.toastr.warning('Output Current cannot be empty');
          return false;
        }
        const current = parseFloat(currA);
        const volt = parseFloat(this.outputForm.value.output120VoltA || '120');
        const eachPhaseKva = parseFloat(kva.toString());
        const actKva = (current * volt) / 1000;
        const load = actKva * 100 / eachPhaseKva;
        this.outputForm.patchValue({
          load120A: load.toFixed(2),
          total120Load: load.toFixed(2)
        });
        if (!this.evaluateLoadThreshold('A', load, 'load120A_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        break;
      }

      case '2': { // 240V (split phase)
        const currA = this.outputForm.value.output240CurrA;
        const currB = this.outputForm.value.output240CurrB;
        if (currA === '' || currB === '' || currA === null || currB === null) {
          this.toastr.warning('Output Current A or Output Current B cannot be empty');
          return false;
        }
        const currentA = parseFloat(currA);
        const currentB = parseFloat(currB);
        const voltA = parseFloat(this.outputForm.value.output240VoltA || '120');
        const voltB = parseFloat(this.outputForm.value.output240VoltB || '120');
        const eachPhaseKva = Math.round(kva / 2);
        const loadA = (currentA * voltA / 1000) * 100 / eachPhaseKva;
        const loadB = (currentB * voltB / 1000) * 100 / eachPhaseKva;
        const total = ((loadA + loadB) / 2);
        this.outputForm.patchValue({
          load240A: loadA.toFixed(2),
          load240B: loadB.toFixed(2),
          total240Load: total.toFixed(2)
        });
        if (!this.evaluateLoadThreshold('A', loadA, 'load240A_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('B', loadB, 'load240B_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        break;
      }

      case '3': { // 208V three-phase
        const currA = this.outputForm.value.output208CurrA;
        const currB = this.outputForm.value.output208CurrB;
        const currC = this.outputForm.value.output208CurrC;
        if (!currA || !currB || !currC) {
          this.toastr.warning('Output Current A, B, C cannot be empty');
          return false;
        }
        const currentA = parseFloat(currA);
        const currentB = parseFloat(currB);
        const currentC = parseFloat(currC);
        const voltAB = parseFloat(this.outputForm.value.output208VoltAB || '208');
        const voltBC = parseFloat(this.outputForm.value.output208VoltBC || '208');
        const voltCA = parseFloat(this.outputForm.value.output208VoltCA || '208');
        const eachPhaseKva = Math.round(kva / 3);
        const loadA = (voltAB * currentA / 1732) * 100 / eachPhaseKva;
        const loadB = (voltBC * currentB / 1732) * 100 / eachPhaseKva;
        const loadC = (voltCA * currentC / 1732) * 100 / eachPhaseKva;
        const total = (loadA + loadB + loadC) / 3;
        this.outputForm.patchValue({
          load208A: loadA.toFixed(2),
          load208B: loadB.toFixed(2),
          load208C: loadC.toFixed(2),
          total208Load: total.toFixed(2)
        });
        if (!this.evaluateLoadThreshold('A', loadA, 'load208A_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('B', loadB, 'load208B_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('C', loadC, 'load208C_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        break;
      }

      case '4': { // 480V three-phase
        const currA = this.outputForm.value.output480CurrA;
        const currB = this.outputForm.value.output480CurrB;
        const currC = this.outputForm.value.output480CurrC;
        if (!currA || !currB || !currC) {
          this.toastr.warning('Output Current A, B, C cannot be empty');
          return false;
        }
        const currentA = parseFloat(currA);
        const currentB = parseFloat(currB);
        const currentC = parseFloat(currC);
        const voltAB = parseFloat(this.outputForm.value.output480VoltAB || '480');
        const voltBC = parseFloat(this.outputForm.value.output480VoltBC || '480');
        const voltCA = parseFloat(this.outputForm.value.output480VoltCA || '480');
        const eachPhaseKva = Math.round(kva / 3);
        const loadA = (voltAB * currentA / 1732) * 100 / eachPhaseKva;
        const loadB = (voltBC * currentB / 1732) * 100 / eachPhaseKva;
        const loadC = (voltCA * currentC / 1732) * 100 / eachPhaseKva;
        const total = (loadA + loadB + loadC) / 3;
        this.outputForm.patchValue({
          load480A: loadA.toFixed(2),
          load480B: loadB.toFixed(2),
          load480C: loadC.toFixed(2),
          total480Load: total.toFixed(2)
        });
        if (!this.evaluateLoadThreshold('A', loadA, 'load480A_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('B', loadB, 'load480B_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('C', loadC, 'load480C_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        break;
      }

      case '5': { // 600V three-phase
        const currA = this.outputForm.value.output600CurrA;
        const currB = this.outputForm.value.output600CurrB;
        const currC = this.outputForm.value.output600CurrC;
        if (!currA || !currB || !currC) {
          this.toastr.warning('Output Current A, B, C cannot be empty');
          return false;
        }
        const currentA = parseFloat(currA);
        const currentB = parseFloat(currB);
        const currentC = parseFloat(currC);
        const voltAB = parseFloat(this.outputForm.value.output600VoltAB || '600');
        const voltBC = parseFloat(this.outputForm.value.output600VoltBC || '600');
        const voltCA = parseFloat(this.outputForm.value.output600VoltCA || '600');
        const eachPhaseKva = Math.round(kva / 3);
        const loadA = (voltAB * currentA / 1732) * 100 / eachPhaseKva;
        const loadB = (voltBC * currentB / 1732) * 100 / eachPhaseKva;
        const loadC = (voltCA * currentC / 1732) * 100 / eachPhaseKva;
        const total = (loadA + loadB + loadC) / 3;
        this.outputForm.patchValue({
          load600A: loadA.toFixed(2),
          load600B: loadB.toFixed(2),
          load600C: loadC.toFixed(2),
          total600Load: total.toFixed(2)
        });
        if (!this.evaluateLoadThreshold('A', loadA, 'load600A_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('B', loadB, 'load600B_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('C', loadC, 'load600C_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        break;
      }

      case '6': { // 575V three-phase
        const currA = this.outputForm.value.output575CurrA;
        const currB = this.outputForm.value.output575CurrB;
        const currC = this.outputForm.value.output575CurrC;
        if (!currA || !currB || !currC) {
          this.toastr.warning('Output Current A, B, C cannot be empty');
          return false;
        }
        const currentA = parseFloat(currA);
        const currentB = parseFloat(currB);
        const currentC = parseFloat(currC);
        const voltAB = parseFloat(this.outputForm.value.output575VoltAB || '575');
        const voltBC = parseFloat(this.outputForm.value.output575VoltBC || '575');
        const voltCA = parseFloat(this.outputForm.value.output575VoltCA || '575');
        const eachPhaseKva = Math.round(kva / 3);
        const loadA = (voltAB * currentA / 1732) * 100 / eachPhaseKva;
        const loadB = (voltBC * currentB / 1732) * 100 / eachPhaseKva;
        const loadC = (voltCA * currentC / 1732) * 100 / eachPhaseKva;
        const total = (loadA + loadB + loadC) / 3;
        this.outputForm.patchValue({
          load575A: loadA.toFixed(2),
          load575B: loadB.toFixed(2),
          load575C: loadC.toFixed(2),
          total575Load: total.toFixed(2)
        });
        if (!this.evaluateLoadThreshold('A', loadA, 'load575A_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('B', loadB, 'load575B_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        if (!this.evaluateLoadThreshold('C', loadC, 'load575C_PF', addComment, setPf, confirmOrCancel)) {
          return false;
        }
        break;
      }
    }
    return true;
  }

  // Legacy threshold handling for load percentages
  private evaluateLoadThreshold(phaseLabel: 'A' | 'B' | 'C', load: number, pfControl: string, addComment: (txt: string) => void, setPf: (c: string, v: 'P' | 'F') => void, confirmOrCancel: (msg: string) => boolean): boolean {
    if (load >= 90) {
      if (!confirmOrCancel(`Are you sure that Load on UPS Phase ${phaseLabel} exceeds maximum limit`)) return false;
      addComment(`Load on UPS Phase ${phaseLabel} exceeded maximum limit.`);
      setPf(pfControl, 'F');
    } else if (load >= 80) {
      if (!confirmOrCancel(`Are you sure that Load on UPS Phase ${phaseLabel} is above 80%`)) return false;
      addComment(`Load on UPS Phase ${phaseLabel} is above 80%.`);
      setPf(pfControl, 'F');
    } else {
      setPf(pfControl, 'P');
    }
    return true;
  }

  // Legacy-equivalent pre-save validation suite
  private runLegacyValidations(isDraft: boolean): boolean {
    const eq = this.equipmentForm.value;
    const recon = this.reconciliationForm.value;
    const inputVoltage = this.inputForm.value.inputVoltage;
    const outputVoltage = this.outputForm.value.outputVoltage;

    if (eq.status !== 'Online' && !this.trimValue(eq.statusNotes)) {
      window.alert('Please enter the reason for status.');
      return false;
    }

    const rawDate = eq.dateCode;
    if (!rawDate) {
      window.alert('Please enter the DateCode.');
      return false;
    }
    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      window.alert('Please enter the DateCode.');
      return false;
    }
    const normalizedDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    const minDate = new Date(1900, 0, 1);
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (normalizedDate <= minDate) {
      window.alert('Please enter the DateCode.');
      return false;
    }
    if (normalizedDate > todayNormalized) {
      window.alert("DateCode cannot be higher than today's date");
      return false;
    }

    const kvaVal = this.trimValue(eq.kva);
    if (!kvaVal || kvaVal === '0') {
      window.alert('Please enter the KVA value');
      return false;
    }
    if (!this.isIntegerOrFloat(kvaVal)) {
      window.alert('Please enter the valid KVA');
      return false;
    }
    this.equipmentForm.patchValue({ kva: kvaVal });

    const tempValStr = this.trimValue(eq.temperature);
    const tempVal = parseInt(tempValStr, 10);
    if (!(tempVal > 67 && tempVal < 78)) {
      if (!tempValStr || tempValStr === '0' || isNaN(tempVal)) {
        window.alert('Please enter the Temperature');
        return false;
      }
      this.equipmentForm.patchValue({ status: 'OnLine(MinorDeficiency)' });
    }

    if (!recon.verified) {
      window.alert('You must verify the Reconciliation section before Saving PM form');
      return false;
    }

    if (inputVoltage === '0' || outputVoltage === '0') {
      window.alert('You must enter the values for Input,Ouptput voltages.');
      return false;
    }

    if (!this.calculateLoadPercentage(outputVoltage)) {
      return false;
    }

    if (!this.validateFrequencyTolerance(inputVoltage, outputVoltage)) {
      return false;
    }

    if (!this.ensureCommentsForFails()) {
      return false;
    }

    if (this.equipmentForm.value.status !== 'Online') {
      if (!this.trimValue(this.equipmentForm.value.statusNotes)) {
        window.alert('Please enter the reason for status.');
        return false;
      }
      if (!window.confirm(`Are you sure that the Equipment Status : ${this.equipmentForm.value.status}`)) {
        return false;
      }
    }

    return true;
  }

  private validateFrequencyTolerance(inputVoltage: string, outputVoltage: string): boolean {
    const addComment = (txt: string) => {
      const existing = this.trimValue(this.commentsForm.get('comments5')?.value);
      const updated = existing ? `${existing}\n${txt}` : txt;
      this.commentsForm.patchValue({ comments5: updated });
    };

    let inputFreqVal: number | undefined;
    let inputFreqPfControl: string | undefined;
    switch (inputVoltage) {
      case '1':
        inputFreqVal = parseFloat(this.inputForm.value.input120Freq);
        inputFreqPfControl = 'input120Freq_PF';
        break;
      case '2':
        inputFreqVal = parseFloat(this.inputForm.value.input240Freq);
        inputFreqPfControl = 'input240Freq_PF';
        break;
      case '3':
        inputFreqVal = parseFloat(this.inputForm.value.input208Freq);
        inputFreqPfControl = 'input208Freq_PF';
        break;
      case '4':
        inputFreqVal = parseFloat(this.inputForm.value.input480Freq);
        inputFreqPfControl = 'input480Freq_PF';
        break;
      case '6':
        inputFreqVal = parseFloat(this.inputForm.value.input575Freq);
        inputFreqPfControl = 'input575Freq_PF';
        break;
      case '5':
        inputFreqVal = parseFloat(this.inputForm.value.input600Freq);
        inputFreqPfControl = 'input600Freq_PF';
        break;
    }

    if (inputFreqVal !== undefined && inputFreqPfControl) {
      if (inputFreqVal >= 55 && inputFreqVal <= 65) {
        this.inputForm.patchValue({ [inputFreqPfControl]: 'P' });
      } else {
        if (!window.confirm('Are you sure that Input Frequency not within specified tolerance')) {
          return false;
        }
        addComment('Input Frequency not within specified tolerance.');
        this.inputForm.patchValue({ [inputFreqPfControl]: 'F' });
      }
    }

    let outputFreqVal: number | undefined;
    let outputFreqPfControl: string | undefined;
    switch (outputVoltage) {
      case '1':
        outputFreqVal = parseFloat(this.outputForm.value.output120Freq);
        outputFreqPfControl = 'output120Freq_PF';
        break;
      case '2':
        outputFreqVal = parseFloat(this.outputForm.value.output240Freq);
        outputFreqPfControl = 'output240Freq_PF';
        break;
      case '3':
        outputFreqVal = parseFloat(this.outputForm.value.output208Freq);
        outputFreqPfControl = 'output208Freq_PF';
        break;
      case '4':
        outputFreqVal = parseFloat(this.outputForm.value.output480Freq);
        outputFreqPfControl = 'output480Freq_PF';
        break;
      case '6':
        outputFreqVal = parseFloat(this.outputForm.value.output575Freq);
        outputFreqPfControl = 'output575Freq_PF';
        break;
      case '5':
        outputFreqVal = parseFloat(this.outputForm.value.output600Freq);
        outputFreqPfControl = 'output600Freq_PF';
        break;
    }

    if (outputFreqVal !== undefined && outputFreqPfControl) {
      if (outputFreqVal >= 58 && outputFreqVal <= 62) {
        this.outputForm.patchValue({ [outputFreqPfControl]: 'P' });
      } else {
        if (!window.confirm('Are you sure that Output Frequency not within specified tolerance')) {
          return false;
        }
        addComment('Output Frequency not within specified tolerance.');
        this.outputForm.patchValue({ [outputFreqPfControl]: 'F' });
      }
    }

    return true;
  }

  private ensureCommentsForFails(): boolean {
    const comments1 = this.trimValue(this.commentsForm.value.comments1);
    const comments5 = this.trimValue(this.commentsForm.value.comments5);
    const statusNotes = this.trimValue(this.equipmentForm.value.statusNotes);

    const passFailControls = [
      // Visual and mechanical
      'busswork', 'transformers', 'powerConn', 'mainCirBreaks', 'subfeedCirBreaks', 'currentCTs',
      'circuitBoards', 'filterCapacitors', 'epoConn', 'wiringConn', 'ribbonCables', 'compAirClean',
      'staticSwitch', 'frontPanel', 'internalPower', 'localMonitoring', 'localEPO',
      // Input PF fields
      'input120VoltA_PF', 'input120CurrA_PF', 'input120Freq_PF',
      'input240VoltA_PF', 'input240VoltB_PF', 'input240CurrA_PF', 'input240CurrB_PF', 'input240Freq_PF',
      'input208VoltAB_PF', 'input208VoltBC_PF', 'input208VoltCA_PF', 'input208CurrA_PF', 'input208CurrB_PF', 'input208CurrC_PF', 'input208Freq_PF',
      'input480VoltAB_PF', 'input480VoltBC_PF', 'input480VoltCA_PF', 'input480CurrA_PF', 'input480CurrB_PF', 'input480CurrC_PF', 'input480Freq_PF',
      'input575VoltAB_PF', 'input575VoltBC_PF', 'input575VoltCA_PF', 'input575CurrA_PF', 'input575CurrB_PF', 'input575CurrC_PF', 'input575Freq_PF',
      'input600VoltAB_PF', 'input600VoltBC_PF', 'input600VoltCA_PF', 'input600CurrA_PF', 'input600CurrB_PF', 'input600CurrC_PF', 'input600Freq_PF',
      // Output PF fields
      'output120VoltA_PF', 'output120CurrA_PF', 'output120Freq_PF', 'load120A_PF',
      'output240VoltA_PF', 'output240VoltB_PF', 'output240CurrA_PF', 'output240CurrB_PF', 'output240Freq_PF', 'load240A_PF', 'load240B_PF',
      'output208VoltAB_PF', 'output208VoltBC_PF', 'output208VoltCA_PF', 'output208CurrA_PF', 'output208CurrB_PF', 'output208CurrC_PF', 'output208Freq_PF', 'load208A_PF', 'load208B_PF', 'load208C_PF',
      'output480VoltAB_PF', 'output480VoltBC_PF', 'output480VoltCA_PF', 'output480CurrA_PF', 'output480CurrB_PF', 'output480CurrC_PF', 'output480Freq_PF', 'load480A_PF', 'load480B_PF', 'load480C_PF',
      'output575VoltAB_PF', 'output575VoltBC_PF', 'output575VoltCA_PF', 'output575CurrA_PF', 'output575CurrB_PF', 'output575CurrC_PF', 'output575Freq_PF', 'load575A_PF', 'load575B_PF', 'load575C_PF',
      'output600VoltAB_PF', 'output600VoltBC_PF', 'output600VoltCA_PF', 'output600CurrA_PF', 'output600CurrB_PF', 'output600CurrC_PF', 'output600Freq_PF', 'load600A_PF', 'load600B_PF', 'load600C_PF'
    ];

    const yesNoControls = [
      'recMakeCorrect', 'recModelCorrect', 'recSerialNoCorrect', 'kvaCorrect',
      'ascStringsCorrect', 'battPerStringCorrect', 'totalEquipsCorrect', 'newEquipment'
    ];

    let hasFailOrYes = false;

    passFailControls.forEach(control => {
      const value = (this.visualForm.get(control) || this.inputForm.get(control) || this.outputForm.get(control))?.value;
      if (value && value.toString().trim().toUpperCase() === 'F') {
        hasFailOrYes = true;
      }
    });

    yesNoControls.forEach(control => {
      const value = this.reconciliationForm.get(control)?.value;
      if (value && value.toString().trim().toUpperCase() === 'YS') {
        hasFailOrYes = true;
      }
    });

    if (hasFailOrYes && !comments1 && !statusNotes && !comments5) {
      window.alert('You must enter the respected comments if anything selected as Fail or Yes');
      return false;
    }

    return true;
  }

  // Save methods
  async save(isDraft: boolean = false): Promise<void> {
    if (!this.validateForm(isDraft)) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const pduData = this.preparePDUData(isDraft);
      const reconData = this.prepareReconciliationData();

      // Legacy SaveData sequence:
      // 1. SaveUpdatePDUVerification(ButtonType)
      const pduResult = await this.pduService.savePDUReadings(pduData).toPromise();
      
      // 2. SaveUpdateReconciliationInfo()
      await this.batteryService.saveUpdateEquipReconciliationInfo(reconData).toPromise();

      // 2b. Save Filter Currents / THD (matches UPS behavior)
      await this.saveFilterCurrentsData();

      // 3. if (ddlStatus.SelectedValue != "Offline") { ddlStatus.SelectedValue = GetEquipStatus(); }
      let statusToSend = this.equipmentForm.value.status;
      if (statusToSend !== 'Offline') {
        statusToSend = (await this.getEquipStatus())?.trim() || 'Online';
      }
      console.log('UpdateEquipStatus statusToSend ->', statusToSend);
      this.equipmentForm.patchValue({ status: statusToSend });

      // 4. da.UpdateEquipStatus(UES)
      let dateCode: any = this.equipmentForm.value.dateCode;
      if (dateCode && typeof dateCode === 'string') {
        const parsed = new Date(dateCode);
        if (!isNaN(parsed.getTime())) {
          dateCode = parsed;
        }
      }
      const monthName = dateCode instanceof Date ? this.getMonthName(dateCode.getMonth()) : '';
      const year = dateCode instanceof Date ? dateCode.getFullYear() : new Date().getFullYear();

      await this.batteryService.updateEquipStatus({
        callNbr: this.callNbr,
        equipId: this.equipId,
        status: statusToSend,
        statusNotes: this.equipmentForm.value.statusNotes,
        tableName: 'PDU_Verification',
        manufacturer: this.equipmentForm.value.manufacturer,
        modelNo: this.equipmentForm.value.modelNo,
        serialNo: this.equipmentForm.value.serialNo,
        location: this.equipmentForm.value.location,
        monthName: monthName,
        year: year,
        readingType: '1',
        // Fields required by UpdateEquipStatus (legacy API expectations)
        vfSelection: this.equipmentForm.value.vfSelection || '',
        batteriesPerString: this.equipmentForm.value.batteriesPerString || 0,
        batteriesPerPack: this.equipmentForm.value.batteriesPerPack || 0,
        Notes: this.equipmentForm.value.statusNotes || '',
        MaintAuthID: (this as any).authService?.currentUserValue?.id || this.techId || ''
      }).toPromise();

      this.successMessage = isDraft ? 'Saved as draft successfully' : 'Update Successfull';
      this.toastr.success(this.successMessage);

      // Refresh data to reflect persisted values (legacy page reload behavior)
      await this.loadData();
      
    } catch (error: any) {
      console.error('Error saving PDU readings:', error);
      this.errorMessage = error.message || 'Failed to save PDU readings';
      this.toastr.error(this.errorMessage);
    } finally {
      this.saving = false;
    }
  }

  saveDraft(): void {
    this.save(true);
  }

  savePDU(): void {
    this.save(false);
  }

  private validateForm(isDraft: boolean): boolean {
    if (isDraft) {
      return true;
    }
    return this.runLegacyValidations(false);
  }

  private preparePDUData(isDraft: boolean): PDUReadings {
    const eq = this.equipmentForm.value;
    const vis = this.visualForm.value;
    const inp = this.inputForm.value;
    const out = this.outputForm.value;
    const comm = this.commentsForm.value;
    
    let month = '';
    let year = 0;
    
    let dateCode: any = eq.dateCode;
    // Normalize to Date if string and extract month/year without timezone offset
    if (dateCode && typeof dateCode === 'string') {
      // Parse yyyy-MM-dd string directly to avoid UTC timezone issues
      const parts = dateCode.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10); // 1-12
        month = this.getMonthName(monthNum);
      }
    } else if (dateCode instanceof Date) {
      // For Date objects, use local time to get correct month/year
      month = this.getMonthName(dateCode.getMonth() + 1);
      year = dateCode.getFullYear();
    }

    const data: PDUReadings = {
      pduId: this.pduId,
      callNbr: this.callNbr,
      equipId: this.equipId,
      
      // Equipment
      manufacturer: eq.manufacturer,
      modelNo: eq.modelNo,
      serialNo: eq.serialNo,
      location: eq.location,
      month: month,
      year: year,
      temp: parseFloat(eq.temperature) || 0,
      status: eq.status,
      statusNotes: eq.statusNotes,
      kva: eq.kva,
      
      // Visual
      busswork: vis.busswork,
      transformers: vis.transformers,
      powerConn: vis.powerConn,
      mainCirBreaks: vis.mainCirBreaks,
      subfeedCirBreaks: vis.subfeedCirBreaks,
      currentCTs: vis.currentCTs,
      circuitBoards: vis.circuitBoards,
      filterCapacitors: vis.filterCapacitors,
      epoConn: vis.epoConn,
      wiringConn: vis.wiringConn,
      ribbonCables: vis.ribbonCables,
      compAirClean: vis.compAirClean,
      staticSwitch: vis.staticSwitch,
      frontPanel: vis.frontPanel,
      internalPower: vis.internalPower,
      localMonitoring: vis.localMonitoring,
      localEPO: vis.localEPO,
      comments: vis.comments,
      neutral_T: parseFloat(vis.neutralCurrent) || 0,
      ground_T: parseFloat(vis.groundCurrent) || 0,
      
      // Input/Output config
      input: inp.inputVoltage,
      output: out.outputVoltage,
      
      // Initialize all input/output values
      inputVoltA_T: 0, inputVoltA_PF: '', inputVoltB_T: 0, inputVoltB_PF: '',
      inputVoltC_T: 0, inputVoltC_PF: '', inputCurrA_T: 0, inputCurrA_PF: '',
      inputCurrB_T: 0, inputCurrB_PF: '', inputCurrC_T: 0, inputCurrC_PF: '',
      inputFreq_T: 0, inputFreq_PF: '',
      outputVoltA_T: 0, outputVoltA_PF: '', outputVoltB_T: 0, outputVoltB_PF: '',
      outputVoltC_T: 0, outputVoltC_PF: '', outputCurrA_T: 0, outputCurrA_PF: '',
      outputCurrB_T: 0, outputCurrB_PF: '', outputCurrC_T: 0, outputCurrC_PF: '',
      outputFreq_T: 0, outputFreq_PF: '',
      outputLoadA: 0, outputLoadA_PF: '', outputLoadB: 0, outputLoadB_PF: '',
      outputLoadC: 0, outputLoadC_PF: '', totalLoad: 0,
      
      comments1: comm.comments1,
      comments5: comm.comments5,
      saveAsDraft: isDraft,
      maint_Auth_Id: this.authService.currentUserValue?.id || this.techId || ''
    };

    // Populate input readings based on selected voltage
    this.populateInputData(data, inp);
    
    // Populate output readings based on selected voltage
    this.populateOutputData(data, out);

    return data;
  }

  private populateInputData(data: PDUReadings, inp: any): void {
    switch (inp.inputVoltage) {
      case '1': // 120V
        data.inputVoltA_T = parseFloat(inp.input120VoltA) || 0;
        data.inputVoltA_PF = inp.input120VoltA_PF;
        data.inputCurrA_T = parseFloat(inp.input120CurrA) || 0;
        data.inputCurrA_PF = inp.input120CurrA_PF;
        data.inputFreq_T = parseFloat(inp.input120Freq) || 0;
        data.inputFreq_PF = inp.input120Freq_PF;
        break;
      case '2': // 240V
        data.inputVoltA_T = parseFloat(inp.input240VoltA) || 0;
        data.inputVoltA_PF = inp.input240VoltA_PF;
        data.inputVoltB_T = parseFloat(inp.input240VoltB) || 0;
        data.inputVoltB_PF = inp.input240VoltB_PF;
        data.inputCurrA_T = parseFloat(inp.input240CurrA) || 0;
        data.inputCurrA_PF = inp.input240CurrA_PF;
        data.inputCurrB_T = parseFloat(inp.input240CurrB) || 0;
        data.inputCurrB_PF = inp.input240CurrB_PF;
        data.inputFreq_T = parseFloat(inp.input240Freq) || 0;
        data.inputFreq_PF = inp.input240Freq_PF;
        break;
      case '3': // 208V
        data.inputVoltA_T = parseFloat(inp.input208VoltAB) || 0;
        data.inputVoltA_PF = inp.input208VoltAB_PF;
        data.inputVoltB_T = parseFloat(inp.input208VoltBC) || 0;
        data.inputVoltB_PF = inp.input208VoltBC_PF;
        data.inputVoltC_T = parseFloat(inp.input208VoltCA) || 0;
        data.inputVoltC_PF = inp.input208VoltCA_PF;
        data.inputCurrA_T = parseFloat(inp.input208CurrA) || 0;
        data.inputCurrA_PF = inp.input208CurrA_PF;
        data.inputCurrB_T = parseFloat(inp.input208CurrB) || 0;
        data.inputCurrB_PF = inp.input208CurrB_PF;
        data.inputCurrC_T = parseFloat(inp.input208CurrC) || 0;
        data.inputCurrC_PF = inp.input208CurrC_PF;
        data.inputFreq_T = parseFloat(inp.input208Freq) || 0;
        data.inputFreq_PF = inp.input208Freq_PF;
        break;
      case '4': // 480V
        data.inputVoltA_T = parseFloat(inp.input480VoltAB) || 0;
        data.inputVoltA_PF = inp.input480VoltAB_PF;
        data.inputVoltB_T = parseFloat(inp.input480VoltBC) || 0;
        data.inputVoltB_PF = inp.input480VoltBC_PF;
        data.inputVoltC_T = parseFloat(inp.input480VoltCA) || 0;
        data.inputVoltC_PF = inp.input480VoltCA_PF;
        data.inputCurrA_T = parseFloat(inp.input480CurrA) || 0;
        data.inputCurrA_PF = inp.input480CurrA_PF;
        data.inputCurrB_T = parseFloat(inp.input480CurrB) || 0;
        data.inputCurrB_PF = inp.input480CurrB_PF;
        data.inputCurrC_T = parseFloat(inp.input480CurrC) || 0;
        data.inputCurrC_PF = inp.input480CurrC_PF;
        data.inputFreq_T = parseFloat(inp.input480Freq) || 0;
        data.inputFreq_PF = inp.input480Freq_PF;
        break;
      case '6': // 575V
        data.inputVoltA_T = parseFloat(inp.input575VoltAB) || 0;
        data.inputVoltA_PF = inp.input575VoltAB_PF;
        data.inputVoltB_T = parseFloat(inp.input575VoltBC) || 0;
        data.inputVoltB_PF = inp.input575VoltBC_PF;
        data.inputVoltC_T = parseFloat(inp.input575VoltCA) || 0;
        data.inputVoltC_PF = inp.input575VoltCA_PF;
        data.inputCurrA_T = parseFloat(inp.input575CurrA) || 0;
        data.inputCurrA_PF = inp.input575CurrA_PF;
        data.inputCurrB_T = parseFloat(inp.input575CurrB) || 0;
        data.inputCurrB_PF = inp.input575CurrB_PF;
        data.inputCurrC_T = parseFloat(inp.input575CurrC) || 0;
        data.inputCurrC_PF = inp.input575CurrC_PF;
        data.inputFreq_T = parseFloat(inp.input575Freq) || 0;
        data.inputFreq_PF = inp.input575Freq_PF;
        break;
      case '5': // 600V
        data.inputVoltA_T = parseFloat(inp.input600VoltAB) || 0;
        data.inputVoltA_PF = inp.input600VoltAB_PF;
        data.inputVoltB_T = parseFloat(inp.input600VoltBC) || 0;
        data.inputVoltB_PF = inp.input600VoltBC_PF;
        data.inputVoltC_T = parseFloat(inp.input600VoltCA) || 0;
        data.inputVoltC_PF = inp.input600VoltCA_PF;
        data.inputCurrA_T = parseFloat(inp.input600CurrA) || 0;
        data.inputCurrA_PF = inp.input600CurrA_PF;
        data.inputCurrB_T = parseFloat(inp.input600CurrB) || 0;
        data.inputCurrB_PF = inp.input600CurrB_PF;
        data.inputCurrC_T = parseFloat(inp.input600CurrC) || 0;
        data.inputCurrC_PF = inp.input600CurrC_PF;
        data.inputFreq_T = parseFloat(inp.input600Freq) || 0;
        data.inputFreq_PF = inp.input600Freq_PF;
        break;
    }
  }

  private populateOutputData(data: PDUReadings, out: any): void {
    switch (out.outputVoltage) {
      case '1': // 120V
        data.outputVoltA_T = parseFloat(out.output120VoltA) || 0;
        data.outputVoltA_PF = out.output120VoltA_PF;
        data.outputCurrA_T = parseFloat(out.output120CurrA) || 0;
        data.outputCurrA_PF = out.output120CurrA_PF;
        data.outputFreq_T = parseFloat(out.output120Freq) || 0;
        data.outputFreq_PF = out.output120Freq_PF;
        data.outputLoadA = parseFloat(out.load120A) || 0;
        data.outputLoadA_PF = out.load120A_PF;
        data.totalLoad = parseFloat(out.total120Load) || 0;
        break;
      case '2': // 240V
        data.outputVoltA_T = parseFloat(out.output240VoltA) || 0;
        data.outputVoltA_PF = out.output240VoltA_PF;
        data.outputVoltB_T = parseFloat(out.output240VoltB) || 0;
        data.outputVoltB_PF = out.output240VoltB_PF;
        data.outputCurrA_T = parseFloat(out.output240CurrA) || 0;
        data.outputCurrA_PF = out.output240CurrA_PF;
        data.outputCurrB_T = parseFloat(out.output240CurrB) || 0;
        data.outputCurrB_PF = out.output240CurrB_PF;
        data.outputFreq_T = parseFloat(out.output240Freq) || 0;
        data.outputFreq_PF = out.output240Freq_PF;
        data.outputLoadA = parseFloat(out.load240A) || 0;
        data.outputLoadA_PF = out.load240A_PF;
        data.outputLoadB = parseFloat(out.load240B) || 0;
        data.outputLoadB_PF = out.load240B_PF;
        data.totalLoad = parseFloat(out.total240Load) || 0;
        break;
      case '3': // 208V
        data.outputVoltA_T = parseFloat(out.output208VoltAB) || 0;
        data.outputVoltA_PF = out.output208VoltAB_PF;
        data.outputVoltB_T = parseFloat(out.output208VoltBC) || 0;
        data.outputVoltB_PF = out.output208VoltBC_PF;
        data.outputVoltC_T = parseFloat(out.output208VoltCA) || 0;
        data.outputVoltC_PF = out.output208VoltCA_PF;
        data.outputCurrA_T = parseFloat(out.output208CurrA) || 0;
        data.outputCurrA_PF = out.output208CurrA_PF;
        data.outputCurrB_T = parseFloat(out.output208CurrB) || 0;
        data.outputCurrB_PF = out.output208CurrB_PF;
        data.outputCurrC_T = parseFloat(out.output208CurrC) || 0;
        data.outputCurrC_PF = out.output208CurrC_PF;
        data.outputFreq_T = parseFloat(out.output208Freq) || 0;
        data.outputFreq_PF = out.output208Freq_PF;
        data.outputLoadA = parseFloat(out.load208A) || 0;
        data.outputLoadA_PF = out.load208A_PF;
        data.outputLoadB = parseFloat(out.load208B) || 0;
        data.outputLoadB_PF = out.load208B_PF;
        data.outputLoadC = parseFloat(out.load208C) || 0;
        data.outputLoadC_PF = out.load208C_PF;
        data.totalLoad = parseFloat(out.total208Load) || 0;
        break;
      case '4': // 480V
        data.outputVoltA_T = parseFloat(out.output480VoltAB) || 0;
        data.outputVoltA_PF = out.output480VoltAB_PF;
        data.outputVoltB_T = parseFloat(out.output480VoltBC) || 0;
        data.outputVoltB_PF = out.output480VoltBC_PF;
        data.outputVoltC_T = parseFloat(out.output480VoltCA) || 0;
        data.outputVoltC_PF = out.output480VoltCA_PF;
        data.outputCurrA_T = parseFloat(out.output480CurrA) || 0;
        data.outputCurrA_PF = out.output480CurrA_PF;
        data.outputCurrB_T = parseFloat(out.output480CurrB) || 0;
        data.outputCurrB_PF = out.output480CurrB_PF;
        data.outputCurrC_T = parseFloat(out.output480CurrC) || 0;
        data.outputCurrC_PF = out.output480CurrC_PF;
        data.outputFreq_T = parseFloat(out.output480Freq) || 0;
        data.outputFreq_PF = out.output480Freq_PF;
        data.outputLoadA = parseFloat(out.load480A) || 0;
        data.outputLoadA_PF = out.load480A_PF;
        data.outputLoadB = parseFloat(out.load480B) || 0;
        data.outputLoadB_PF = out.load480B_PF;
        data.outputLoadC = parseFloat(out.load480C) || 0;
        data.outputLoadC_PF = out.load480C_PF;
        data.totalLoad = parseFloat(out.total480Load) || 0;
        break;
      case '6': // 575V
        data.outputVoltA_T = parseFloat(out.output575VoltAB) || 0;
        data.outputVoltA_PF = out.output575VoltAB_PF;
        data.outputVoltB_T = parseFloat(out.output575VoltBC) || 0;
        data.outputVoltB_PF = out.output575VoltBC_PF;
        data.outputVoltC_T = parseFloat(out.output575VoltCA) || 0;
        data.outputVoltC_PF = out.output575VoltCA_PF;
        data.outputCurrA_T = parseFloat(out.output575CurrA) || 0;
        data.outputCurrA_PF = out.output575CurrA_PF;
        data.outputCurrB_T = parseFloat(out.output575CurrB) || 0;
        data.outputCurrB_PF = out.output575CurrB_PF;
        data.outputCurrC_T = parseFloat(out.output575CurrC) || 0;
        data.outputCurrC_PF = out.output575CurrC_PF;
        data.outputFreq_T = parseFloat(out.output575Freq) || 0;
        data.outputFreq_PF = out.output575Freq_PF;
        data.outputLoadA = parseFloat(out.load575A) || 0;
        data.outputLoadA_PF = out.load575A_PF;
        data.outputLoadB = parseFloat(out.load575B) || 0;
        data.outputLoadB_PF = out.load575B_PF;
        data.outputLoadC = parseFloat(out.load575C) || 0;
        data.outputLoadC_PF = out.load575C_PF;
        data.totalLoad = parseFloat(out.total575Load) || 0;
        break;
      case '5': // 600V
        data.outputVoltA_T = parseFloat(out.output600VoltAB) || 0;
        data.outputVoltA_PF = out.output600VoltAB_PF;
        data.outputVoltB_T = parseFloat(out.output600VoltBC) || 0;
        data.outputVoltB_PF = out.output600VoltBC_PF;
        data.outputVoltC_T = parseFloat(out.output600VoltCA) || 0;
        data.outputVoltC_PF = out.output600VoltCA_PF;
        data.outputCurrA_T = parseFloat(out.output600CurrA) || 0;
        data.outputCurrA_PF = out.output600CurrA_PF;
        data.outputCurrB_T = parseFloat(out.output600CurrB) || 0;
        data.outputCurrB_PF = out.output600CurrB_PF;
        data.outputCurrC_T = parseFloat(out.output600CurrC) || 0;
        data.outputCurrC_PF = out.output600CurrC_PF;
        data.outputFreq_T = parseFloat(out.output600Freq) || 0;
        data.outputFreq_PF = out.output600Freq_PF;
        data.outputLoadA = parseFloat(out.load600A) || 0;
        data.outputLoadA_PF = out.load600A_PF;
        data.outputLoadB = parseFloat(out.load600B) || 0;
        data.outputLoadB_PF = out.load600B_PF;
        data.outputLoadC = parseFloat(out.load600C) || 0;
        data.outputLoadC_PF = out.load600C_PF;
        data.totalLoad = parseFloat(out.total600Load) || 0;
        break;
    }
  }

  private prepareReconciliationData(): PDUReconciliationInfo {
    const recon = this.reconciliationForm.value;
    
    const payload: any = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      make: this.equipmentForm.value.manufacturer,
      makeCorrect: recon.recMakeCorrect || '',
      actMake: recon.actMake || '',
      model: recon.recModel || '',
      modelCorrect: recon.recModelCorrect,
      actModel: recon.actModel || '',
      serialNo: recon.recSerialNo || '',
      serialNoCorrect: recon.recSerialNoCorrect,
      actSerialNo: recon.actSerialNo || '',
      kva: recon.kvaSize || '',
      kvaCorrect: recon.kvaCorrect,
      // Only send actKva if user explicitly entered it
      actKva: this.trimValue(recon.actKVA ?? recon.actKva),
      // Legacy fields from reconciliation form
      ascStringsNo: recon.ascStringsNo || 0,
      ascStringsCorrect: recon.ascStringsCorrect || '',
      actAscStringNo: recon.actASCStringNo || 0,
      battPerString: recon.battPerString || 0,
      battPerStringCorrect: recon.battPerStringCorrect || '',
      actBattPerString: recon.actBattPerString || 0,
      totalEquips: parseInt(recon.totalEquips) || 0,
      totalEquipsCorrect: recon.totalEquipsCorrect,
      actTotalEquips: parseInt(recon.actTotalEquips) || 0,
      verified: recon.verified,
      // Who modified (required by EquipReconciliationInfo)
      modifiedBy: (this as any).authService?.currentUserValue?.id || this.techId || ''
    };

    return payload;
  }

  // Utility methods
  private trimValue(value: any): string {
    return (value ?? '').toString().trim();
  }

  private isIntegerOrFloat(input: string): boolean {
    const pattern = /^[-+]?(\d+(\.\d*)?|\.\d+)$/;
    return pattern.test(input);
  }

  private removeZeros(value: any): string {
    if (value === 0 || value === '0') {
      return '';
    }
    return value?.toString() || '';
  }

  private getMonthName(monthNumber: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1] || '';
  }

  private getMonthNumber(monthName: string): number {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(monthName) + 1;
  }

  goBack(): void {
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId,
        Digest: this.digest,
        TechName: this.techName
      }
    });
  }

  get summaryText(): string {
    return `Job Id : ${this.callNbr}     PDU ID : ${this.pduId}   Equipment Id : ${this.equipId}`;
  }
}

