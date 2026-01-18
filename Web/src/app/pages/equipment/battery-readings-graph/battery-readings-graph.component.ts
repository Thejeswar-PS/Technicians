import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BatteryReadingsService } from '../../../core/services/battery-readings.service';

interface ChartPoint {
  batteryId: number;
  vdc: number;
  nvdc: number;
  errorVdc: number;
  warningVdc: number;
  lowErrorVdc: number;
  lowWarningVdc: number;
  errorRef: number;
  warRef: number;
  status1: string;
  status2: string;
}

@Component({
  selector: 'app-battery-readings-graph',
  templateUrl: './battery-readings-graph.component.html',
  styleUrls: ['./battery-readings-graph.component.scss']
})
export class BatteryReadingsGraphComponent implements OnInit, AfterViewInit {
  @ViewChild('vdcChartCanvas', { static: false }) vdcChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mhosChartCanvas', { static: false }) mhosChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Query Parameters from URL
  callNbr: string = '';
  equipId: number = 0;
  equipNo: string = '';
  chkEnablemVAC: boolean = false;
  readingType: string = '';

  // Chart Data
  chartDataPoints: ChartPoint[] = [];
  errorMessage: string = '';
  loading: boolean = false;

  // Active graph tab
  activeGraphTab: string = 'vdc';

  // Chart type (bar or table)
  currentChartType: string = 'bar';

  // Chart.js instances
  vdcChart: any;
  mhosChart: any;

  constructor(
    private route: ActivatedRoute,
    private batteryService: BatteryReadingsService
  ) {}

  ngOnInit(): void {
    this.initializeFromQueryParams();
  }

  ngAfterViewInit(): void {
    if (this.chartDataPoints.length > 0) {
      this.renderCharts();
    }
  }

  /**
   * Initialize component from query parameters (matching legacy)
   * URL: BatteryReadingsGraph.aspx?CallNbr={callNbr}&EquipID={callNbr}&EquipNo={equipNo}&chkEnablemVAC={bool}&ReadingType={type}
   */
  private initializeFromQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.equipId = parseInt(params['EquipID']) || 0;
      this.equipNo = decodeURIComponent(params['EquipNo'] || '');
      this.chkEnablemVAC = params['chkEnablemVAC'] === 'true' || params['chkEnablemVAC'] === '1';
      this.readingType = params['ReadingType'] || '';

      if (this.callNbr && this.equipNo) {
        this.loadGraphData();
      } else {
        this.errorMessage = 'Missing required parameters: CallNbr or EquipNo';
      }
    });
  }

  /**
   * Load graph data from backend (calls stored procedure BatteryReadingsGraph)
   * Legacy: BindVDCData() method
   */
  private loadGraphData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.batteryService.getBatteryReadingsGraphData(this.callNbr, this.equipNo).subscribe(
      (data: any) => {
        if (data && Array.isArray(data)) {
          this.chartDataPoints = data.map((row: any) => ({
            batteryId: row.batteryId || 0,
            vdc: row.vdc || 0,
            nvdc: row.nvdc || 0,
            errorVdc: row.errorVdc || 0,
            warningVdc: row.warningVdc || 0,
            lowErrorVdc: row.lowErrorVdc || 0,
            lowWarningVdc: row.lowWarningVdc || 0,
            errorRef: row.errorRef || 0,
            warRef: row.warRef || 0,
            status1: row.status1 || 'Green',
            status2: row.status2 || 'Green'
          }));

          // Render charts after data is loaded
          setTimeout(() => this.renderCharts(), 0);
        }
        this.loading = false;
      },
      (error) => {
        this.errorMessage = `Error loading graph data: ${error.message}`;
        this.loading = false;
      }
    );
  }

  /**
   * Render VDC and MHOS/VAC charts using Canvas API
   * Legacy: Chart1 (VDC) and Chart2 (MHOS/VAC) ASP.NET charts
   */
  private renderCharts(): void {
    if (this.chartDataPoints.length === 0) {
      return;
    }

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      // Render VDC Chart
      this.renderVDCChart();

      // Render MHOS/VAC Chart if enabled or ReadingType is 2
      if (this.chkEnablemVAC || this.readingType === '2') {
        this.renderMhosChart();
      }
    }, 50);
  }

  /**
   * Render VDC Voltage Chart using Canvas with modern styling
   * Legacy: Chart1 with Series for VDC, ErrorVDC, WarningVDC, LowErrorVDC, LowWarningVDC
   */
  private renderVDCChart(): void {
    if (!this.vdcChartCanvas?.nativeElement) {
      return;
    }

    const canvas = this.vdcChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = 1400;
    canvas.height = 550;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 90;
    const topPadding = 80;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - topPadding - 60;
    const barWidth = Math.min(chartWidth / (this.chartDataPoints.length * 1.8), 40);
    
    // Find max value for scaling
    const maxValue = Math.max(...this.chartDataPoints.map(d => 
      Math.max(d.vdc, d.errorVdc, d.warningVdc, d.lowErrorVdc, d.lowWarningVdc)
    ));
    const yScale = chartHeight / (maxValue * 1.15); // 15% padding

    // Draw modern gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#f8f9fa');
    bgGradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw chart area with white background and shadow
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(padding - 10, topPadding - 10, chartWidth + 20, chartHeight + 20);
    ctx.shadowBlur = 0;

    // Draw title with modern styling (matching legacy "DC Group - Battery VDC Readings")
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DC Group - Battery VDC Readings', canvas.width / 2, 35);

    // Draw modern grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = topPadding + chartHeight - (chartHeight * i / 5);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw Y-axis labels with modern font
    ctx.fillStyle = '#495057';
    ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const y = topPadding + chartHeight - (chartHeight * i / 5);
      const value = (maxValue * i / 5).toFixed(2);
      ctx.fillText(value, padding - 15, y + 4);
    }

    // Draw bars with modern styling - color based on Status1 from data (matching legacy logic)
    this.chartDataPoints.forEach((point, index) => {
      const x = padding + (index * barWidth * 1.5) + (barWidth / 2);
      const barHeight = point.vdc * yScale;
      const barY = topPadding + chartHeight - barHeight;
      const barX = x - (barWidth * 0.4);
      const barActualWidth = barWidth * 0.8;
      
      // Draw bar shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      // Get color from Status1 field (Green, Yellow, Red - matching legacy behavior)
      const barColor = this.getStatusColor(point.status1);
      
      // Create gradient for bar
      const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      gradient.addColorStop(0, this.lightenColor(barColor, 15));
      gradient.addColorStop(1, barColor);
      
      ctx.fillStyle = gradient;
      
      // Draw rounded rectangle bar
      this.drawRoundedRect(ctx, barX, barY, barActualWidth, barHeight, 8);
      
      ctx.shadowBlur = 0;
      
      // Draw value label on bar with background
      // Hide labels if > 50 rows (matching legacy behavior)
      const showLabels = this.chartDataPoints.length <= 50;
      if (barHeight > 20 && showLabels) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        const labelWidth = 45;
        const labelHeight = 18;
        const labelX = x - labelWidth / 2;
        const labelY = barY - 25;
        this.drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, 4);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.vdc.toFixed(2), x, barY - 12);
      }
      
      // Draw X-axis label (Battery ID) - adjust interval for > 50 rows
      const showXLabels = this.chartDataPoints.length <= 50;
      const labelInterval = this.chartDataPoints.length > 50 ? 20 : 1;
      if (index % labelInterval === 0 && showXLabels) {
        ctx.fillStyle = '#6c757d';
        ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.batteryId.toString(), x, topPadding + chartHeight + 25);
      }
    });

    // Draw modern threshold lines
    this.drawModernThresholdLine(ctx, padding, chartWidth, chartHeight, topPadding, this.chartDataPoints[0]?.errorVdc || 0, yScale, '#dc3545', 'High Error', 2.5);
    this.drawModernThresholdLine(ctx, padding, chartWidth, chartHeight, topPadding, this.chartDataPoints[0]?.warningVdc || 0, yScale, '#ffc107', 'High Warning', 2.5);
    this.drawModernThresholdLine(ctx, padding, chartWidth, chartHeight, topPadding, this.chartDataPoints[0]?.lowErrorVdc || 0, yScale, '#dc3545', 'Low Error', 2, [8, 4]);
    this.drawModernThresholdLine(ctx, padding, chartWidth, chartHeight, topPadding, this.chartDataPoints[0]?.lowWarningVdc || 0, yScale, '#ffc107', 'Low Warning', 2, [8, 4]);

    // Draw modern axes
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, topPadding + chartHeight);
    ctx.lineTo(canvas.width - padding, topPadding + chartHeight);
    ctx.stroke();

    // Draw axis titles with modern styling
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    
    // Y-axis title
    ctx.save();
    ctx.translate(25, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Voltage (VDC)', 0, 0);
    ctx.restore();
    
    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillText('Battery ID', canvas.width / 2, canvas.height - 15);

    // Draw legend
    this.drawLegend(ctx, canvas.width - 180, 50);
  }

  /**
   * Render MHOS/VAC Chart using Canvas with modern styling
   * Legacy: Chart2 with Series for NVDC (MHOS), ErrorRef, WarRef
   */
  private renderMhosChart(): void {
    if (!this.mhosChartCanvas?.nativeElement) {
      return;
    }

    const canvas = this.mhosChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = 1400;
    canvas.height = 550;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 90;
    const topPadding = 80;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - topPadding - 60;
    const barWidth = Math.min(chartWidth / (this.chartDataPoints.length * 1.8), 40);
    
    // Find max value for scaling
    const maxValue = Math.max(...this.chartDataPoints.map(d => 
      Math.max(d.nvdc, d.errorRef, d.warRef)
    ));
    const yScale = chartHeight / (maxValue * 1.15); // 15% padding

    // Draw modern gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#f8f9fa');
    bgGradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw chart area with white background and shadow
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(padding - 10, topPadding - 10, chartWidth + 20, chartHeight + 20);
    ctx.shadowBlur = 0;

    // Draw title with modern styling (matching legacy "DC Group - Battery MHOS/VAC Readings")
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DC Group - Battery MHOS/VAC Readings', canvas.width / 2, 35);

    // Draw modern grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = topPadding + chartHeight - (chartHeight * i / 5);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw Y-axis labels with modern font
    ctx.fillStyle = '#495057';
    ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const y = topPadding + chartHeight - (chartHeight * i / 5);
      const value = (maxValue * i / 5).toFixed(2);
      ctx.fillText(value, padding - 15, y + 4);
    }

    // Draw bars with modern styling - color based on Status2 from data (matching legacy logic)
    this.chartDataPoints.forEach((point, index) => {
      const x = padding + (index * barWidth * 1.5) + (barWidth / 2);
      const barHeight = point.nvdc * yScale;
      const barY = topPadding + chartHeight - barHeight;
      const barX = x - (barWidth * 0.4);
      const barActualWidth = barWidth * 0.8;
      
      // Draw bar shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      // Get color from Status2 field (Green, Yellow, Red - matching legacy behavior)
      const barColor = this.getStatusColor(point.status2);
      
      // Create gradient for bar
      const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      gradient.addColorStop(0, this.lightenColor(barColor, 15));
      gradient.addColorStop(1, barColor);
      
      ctx.fillStyle = gradient;
      
      // Draw rounded rectangle bar
      this.drawRoundedRect(ctx, barX, barY, barActualWidth, barHeight, 8);
      
      ctx.shadowBlur = 0;
      
      // Draw value label on bar with background
      // Hide labels if > 50 rows (matching legacy behavior)
      const showLabels2 = this.chartDataPoints.length <= 50;
      if (barHeight > 20 && showLabels2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        const labelWidth = 45;
        const labelHeight = 18;
        const labelX = x - labelWidth / 2;
        const labelY = barY - 25;
        this.drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, 4);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.nvdc.toFixed(2), x, barY - 12);
      }
      
      // Draw X-axis label (Battery ID) - adjust interval for > 50 rows
      const showXLabels2 = this.chartDataPoints.length <= 50;
      const labelInterval2 = this.chartDataPoints.length > 50 ? 20 : 1;
      if (index % labelInterval2 === 0 && showXLabels2) {
        ctx.fillStyle = '#6c757d';
        ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.batteryId.toString(), x, topPadding + chartHeight + 25);
      }
    });

    // Draw modern threshold lines
    this.drawModernThresholdLine(ctx, padding, chartWidth, chartHeight, topPadding, this.chartDataPoints[0]?.errorRef || 0, yScale, '#dc3545', 'Error Threshold', 2.5);
    this.drawModernThresholdLine(ctx, padding, chartWidth, chartHeight, topPadding, this.chartDataPoints[0]?.warRef || 0, yScale, '#ffc107', 'Warning Threshold', 2.5);

    // Draw modern axes
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, topPadding + chartHeight);
    ctx.lineTo(canvas.width - padding, topPadding + chartHeight);
    ctx.stroke();

    // Draw axis titles with modern styling
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    
    // Y-axis title
    ctx.save();
    ctx.translate(25, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Conductance (MHOS/VAC)', 0, 0);
    ctx.restore();
    
    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillText('Battery ID', canvas.width / 2, canvas.height - 15);

    // Draw legend
    this.drawLegend(ctx, canvas.width - 180, 50);
  }

  /**
   * Draw modern threshold line with label
   */
  private drawModernThresholdLine(
    ctx: CanvasRenderingContext2D,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    topPadding: number,
    value: number,
    yScale: number,
    color: string,
    label: string,
    lineWidth: number,
    dash: number[] = []
  ): void {
    if (value === 0) return;
    
    const y = topPadding + chartHeight - (value * yScale);
    
    // Draw line with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 3;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Lighten a color by a percentage
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, ((num >> 16) & 0xff) + amt);
    const G = Math.min(255, ((num >> 8) & 0xff) + amt);
    const B = Math.min(255, (num & 0xff) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  /**
   * Draw legend for status colors
   */
  private drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const items = [
      { label: 'Good', color: '#28a745' },
      { label: 'Warning', color: '#ffc107' },
      { label: 'Critical', color: '#dc3545' }
    ];

    // Draw legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    this.drawRoundedRect(ctx, x, y, 150, items.length * 28 + 20, 8);
    ctx.shadowBlur = 0;

    // Draw legend title
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Status', x + 10, y + 18);

    // Draw legend items
    items.forEach((item, index) => {
      const itemY = y + 35 + (index * 28);
      
      // Draw color box with gradient
      const gradient = ctx.createLinearGradient(x + 10, itemY - 8, x + 10, itemY + 8);
      gradient.addColorStop(0, this.lightenColor(item.color, 20));
      gradient.addColorStop(1, item.color);
      ctx.fillStyle = gradient;
      this.drawRoundedRect(ctx, x + 10, itemY - 8, 20, 16, 3);
      
      // Draw label
      ctx.fillStyle = '#495057';
      ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
      ctx.fillText(item.label, x + 38, itemY + 4);
    });
  }

  /**
   * Map status color from legacy status string (matching legacy ASPX behavior)
   * Legacy: Green, Yellow, Red (matching the actual .NET System.Drawing.Color)
   */
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'green':
        return '#28a745';  // Green
      case 'yellow':
        return '#ffc107';  // Yellow/Amber
      case 'red':
        return '#dc3545';  // Red
      default:
        return '#28a745';  // Default to Green
    }
  }

  /**
   * Set active graph tab
   */
  setActiveGraphTab(tab: string): void {
    this.activeGraphTab = tab;
    // Re-render charts after tab switch to ensure proper display
    setTimeout(() => this.renderCharts(), 100);
  }

  /**
   * Set chart type (bar or table)
   */
  setChartType(type: string): void {
    this.currentChartType = type;
    if (type === 'bar') {
      setTimeout(() => this.renderCharts(), 100);
    }
  }

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    window.history.back();
  }
}
