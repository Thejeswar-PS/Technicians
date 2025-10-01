import { Component, Input, OnInit } from '@angular/core';
import { EquipmentDetails } from 'src/app/core/model/equipment-detail.modal';
import { JobService } from 'src/app/core/services/job.service';

@Component({
  selector: 'app-equipment-details',
  templateUrl: './equipment-details.component.html',
  styleUrls: ['./equipment-details.component.scss']
})
export class EquipmentDetailsComponent implements OnInit {
  @Input() jobId: string;
  equipmentDetailsList: EquipmentDetails[] = [];
  constructor(private jobService: JobService) { }

  ngOnInit(): void {
    this.getEquipmentDetailsList();
  }

  getEquipmentDetailsList(){
    this.jobService.getEquipmentDetails(this.jobId).subscribe(res => {
      this.equipmentDetailsList = res;
      console.log("api response =====>>>>>>", res);
    })
  }

  sortIcon(columnName: string): string{
    return ""
  }

}
