import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DCGBatteryPricingDetail } from 'src/app/core/model/dcg-battery-pricing-details.modal';
import { JobService } from 'src/app/core/services/job.service';

@Component({
  selector: 'app-battery-pricing-detail',
  templateUrl: './battery-pricing-detail.component.html',
  styleUrls: ['./battery-pricing-detail.component.scss']
})
export class BatteryPricingDetailComponent implements OnInit, AfterViewInit {
  dcgBatteryPricingDetails: DCGBatteryPricingDetail[] = [];
  dcgIds: string;
  quantity: any;
  name: any;

  constructor(private jobService: JobService, 
    private activateRoute: ActivatedRoute) { }


  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.activateRoute.queryParams.subscribe(params => {
      this.dcgIds = params.id;
      this.quantity = params.quantity;
      this.loadDetails(this.dcgIds, this.quantity);
    })


  }

  loadDetails(Ids: string, quantity: number){
    this.jobService.getDCGBatteryPricingDetails(Ids, quantity).subscribe(res => {
        this.dcgBatteryPricingDetails = res;
        if(res.length > 0)
        {
          this.name = res[0].make + ' ' +res[0].model;
        }
        console.log(this.dcgBatteryPricingDetails)
      })
  }

}
