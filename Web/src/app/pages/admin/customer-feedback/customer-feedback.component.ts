import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { EMPTY, Subject, catchError, takeUntil } from 'rxjs';
import { ICustomerFeedback, ISatisfication, IStat } from 'src/app/core/model/customer-feedback.model';
import { AdminService } from 'src/app/core/services/admin.service';
import { CommonService } from 'src/app/core/services/common.service';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ChartComponent,
  ApexPlotOptions,
  ApexLegend
} from "ng-apexcharts";
import { Router } from '@angular/router';
import { trigger, transition, animate, style } from '@angular/animations';
import { reduce } from 'lodash';
export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive?: any;
  labels: any;
  stroke?: any;
  fill?: any;
  colors: any[];
  plotOptions?: any,
  grid?: any,
  legend?: any
};
@Component({
  selector: 'app-customer-feedback',
  templateUrl: './customer-feedback.component.html',
  styleUrls: ['./customer-feedback.component.scss'],
  animations: [
    trigger('dataChange', [
      transition(':increment', [
        style({ opacity: 0, transform: 'translateY(-20px)' }), // Start with opacity 0 and above
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })) // Fade in and slide down
      ]),
      transition(':decrement', [
        animate('0.3s ease-out', style({ opacity: 0, transform: 'translateY(-20px)' })) // Fade out and slide up
      ])
    ])
  ]
})
export class CustomerFeedbackComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  FilterForm: FormGroup;
  chartLabels = ["Extreme satisfy", "Very satisfy", "Some satisfy", "Not so satisfy", "Not all satisfy"];
  feedbackDetails: ICustomerFeedback;
  posFeed: number;
  NeuFeed: number;
  NegFeed: number;
  lnkSentNbr: number;
  stat: IStat = {
    totalResponded : 0,
    totalSent :      0,
    totalViewed :    0,

  };
  score: number;
  managers: any[] = [];
  years = years;
  @ViewChild("chart") chart: ChartComponent;
  chartOptions: ChartOptions = {
    series: [],
    colors: [],
    chart: { width: 0, type: "pie" },
    labels: [],
    responsive:[]
  }
  guageOptions: ChartOptions = {
    series: [],
    chart: {width: 0, type: "radialBar"},
    labels: [],
    responsive:[],
    plotOptions:{},
    colors: [],
    grid: {}
  }

  constructor(private adminService: AdminService, private fb: FormBuilder,
              private commonServices: CommonService, private cdr: ChangeDetectorRef, private router: Router,) { }
  ngOnInit(): void {
    this.initForm();
    this.getManager();
    this.initChart();
    this.getFeedback();
  }

  onSelectionChange(){
    this.getFeedback();
  }

  initChart(){
    this.chartOptions = {
      series: [],
      chart: {
        height: 350,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      colors:[],
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          hollow: {
            margin: 0,
            size: "70%",
            background: "#fff",
            image: undefined,
            position: "front",
            dropShadow: {
              enabled: true,
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },
          track: {
            background: "#fff",
            strokeWidth: "67%",
            margin: 0, // margin is in pixels
            dropShadow: {
              enabled: true,
              top: -3,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },

          dataLabels: {
            show: true,
            name: {
              offsetY: -10,
              show: false,
              color: "#888",
              fontSize: "17px"
            },
            value: {
              // formatter: function(val) {
              //   return parseInt(val.toString(), 10).toString();
              // },
              color: "#111",
              fontSize: "36px",
              show: true
            }
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "dark",
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: ["#ABE5A1"],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      stroke: {
        lineCap: "round"
      },
      labels: []
    };


    this.guageOptions = {
      series: [],
      chart: {
        height: 380,
        type: "radialBar"
      },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: 0,
          endAngle: 270,
          hollow: {
            margin: 5,
            size: "35%",
            background: "transparent",
            image: undefined
          },
          dataLabels: {
            name: {
              show: true
            },
            value: {
              show: true,
              formatter: function (val: string) {
                return val; // Display the value without %
              }
            }
          }
        }
      },
      colors: ["#595ada", "#24e5a4", "#249efa", "#fcba39", "#e21040"],
      labels: [],
      legend: {
        show: true,
        floating: true,
        fontSize: "16px",
        position: "right",
        offsetX: 122,
        offsetY: 10,
        labels: {
          useSeriesColors: true
        },
        //formatter: function(seriesName: string, opts: any) {
        //   return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex];
        //},
        itemMargin: {
          horizontal: 0
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              show: false
            }
          }
        }
      ]
    };

  }
  getManager(){

    let userData = JSON.parse(localStorage.getItem("userData")!);
    if(this.managers.length <= 0)
    {
      this.managers = JSON.parse(localStorage.getItem("AccountManagers")!);
    }

    var searchIndex = this.managers.find((item : any) => item.empName.trim() === userData.empName.trim());
    if(searchIndex === undefined)
    {
      this.FilterForm.patchValue({
        manager: 'All'
      });
    }
    else{
      this.FilterForm.patchValue({
        manager: userData.empName.trim(),
      });
    }
  }
  getFeedback(){
    this.adminService.getCustomerFeedback(this.FilterForm.value).pipe(takeUntil(this.destroy$), catchError((err: any) =>{
      return EMPTY
    }))
    .subscribe(feedback=> {
      this.chartOptions.series = [];
      this.guageOptions.series = [];
      this.guageOptions.labels = [];
      this.feedbackDetails = feedback;
      let details = this.feedbackDetails.satisfication;
      this.stat = feedback.stat;
      this.calculateFeedback()
      this.chartOptions.series.push(this.feedbackDetails.score)
      // this.score = this.feedbackDetails.score;
      //this.guageOptions.series = [this.score];
      //this.guageOptions.labels = ["Score"]
      for (const key in details) {
        const validKey = key as keyof ISatisfication;
        if(details.hasOwnProperty(validKey)){
              this.guageOptions.series.push(details[validKey])
              // if(details[validKey] > 0)
              this.guageOptions.labels = this.chartLabels
        }
      }
      console.log(this.chartOptions.series)
    });
  }


  calculateFeedback(){
    this.posFeed = this.feedbackDetails.satisfication.extSatisfy + this.feedbackDetails.satisfication.verySatisfy
      this.NeuFeed = this.feedbackDetails.satisfication.someSatisfy
      this.NegFeed = this.feedbackDetails.satisfication.notSoSatisfy + this.feedbackDetails.satisfication.notatAllSatisfy
      this.lnkSentNbr = this.feedbackDetails.stat.totalSent
  }
  initForm(){
    this.FilterForm = this.fb.group({
      manager: new FormControl('All'),
      type: new FormControl('CY')
    })
  }
  goToDetails(status: any)
  {
    this.router.navigate(['admin/customer-feedback-details'], { queryParams: { status: status,year: this.FilterForm.controls['type'].value,ownerId: this.FilterForm.controls['manager'].value} });

    // this.router.navigate(['/customer-feedback-details', { status: status,year: this.FilterForm.controls['type'].value}]);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}


const years  = [
  {
    year: "Current Year",
    value: 'CY'
  },
  {
    year: "Previous Year",
    value: 'PY'
  }
]
