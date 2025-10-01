import { AdminService } from 'src/app/core/services/admin.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

@Component({
  selector: 'app-customer-feedback-survey',
  templateUrl: './customer-feedback-survey.component.html',
  styleUrls: ['./customer-feedback-survey.component.scss']
})
export class CustomerFeedbackSurveyComponent implements OnInit {

  token: any;
  customerFeedback: any = {};
  overallService: any;
  amKnowledge: any;
  techPromptness: any;

  constructor(
    private route: ActivatedRoute,
    private filterDashboardService: DashboardFilterSharedService,
    private _adminService: AdminService) { }

  ngOnInit(): void {
    this.filterDashboardService.setHomePage(false);
    this.route.queryParamMap.subscribe((params) => {
      if(params.has('token'))
      {
        this.token = params.get('token');
        this.initalLoad();
      }
    })
  }

  initalLoad()
  {
    this._adminService.GetCustFeedbackByToken(this.token).subscribe((data:any)=>{
      this.customerFeedback = data[0];

      if(this.customerFeedback.overallService.includes("Extremely"))
      {
        this.customerFeedback.overallService = "Extremely";
      }
      else if(this.customerFeedback.overallService.includes("Very"))
      {
        this.customerFeedback.overallService = "Very";
      }
      else if(this.customerFeedback.overallService.includes("Somewhat"))
      {
        this.customerFeedback.overallService = "Somewhat";
      }
      else if(this.customerFeedback.overallService.includes("Not so"))
      {
        this.customerFeedback.overallService = "NotSo";
      }
      else if(this.customerFeedback.overallService.includes("Not at all"))
      {
        this.customerFeedback.overallService = "NotAtAll";
      }



      if(this.customerFeedback.amKnowledge.includes("Extremely"))
      {
        this.customerFeedback.amKnowledge = "Extremely";
      }
      else if(this.customerFeedback.amKnowledge.includes("Very"))
      {
        this.customerFeedback.amKnowledge = "Very";
      }
      else if(this.customerFeedback.amKnowledge.includes("Somewhat"))
      {
        this.customerFeedback.amKnowledge = "Somewhat";
      }
      else if(this.customerFeedback.amKnowledge.includes("Not so"))
      {
        this.customerFeedback.amKnowledge = "NotSo";
      }
      else if(this.customerFeedback.amKnowledge.includes("Not at all"))
      {
        this.customerFeedback.amKnowledge = "NotAtAll";
      }


      if(this.customerFeedback.techPromptness.includes("Yes"))
      {
        this.customerFeedback.techPromptness = "TechYes";
      }
      else if(this.customerFeedback.techPromptness.includes("No"))
      {
        this.customerFeedback.techPromptness = "TechNo";
      }
    })
  }
}
