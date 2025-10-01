import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule  } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminService } from 'src/app/core/services/admin.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-schedult-jobs-edit',
  templateUrl: './schedult-jobs-edit.component.html',
  styleUrls: ['./schedult-jobs-edit.component.scss']
})
export class SchedultJobsEditComponent implements OnInit {

  @Input() public job : any;
  form!:FormGroup;
  technicians: any = [];
  jobForm = this.fb.group({
    jobIds: [],
    techIds : [],
    startDate : [],
    notes : [],
  });

  constructor(private fb: FormBuilder,
    private _commonService: CommonService,
    private _adminService: AdminService,
    private modalService: NgbModal,
    private router: Router,
    public activeModel: NgbActiveModal,
    private _authService: AuthService
    ) { }

  ngOnInit(): void {
    this.LoadTechnicians();
    this.jobForm.patchValue({
      jobIds : this.job.callNbr,
      techIds: this.job.techid,
      startDate: this.job.startDt,
      notes: this.job.notes
    })
  }
  public LoadTechnicians()
  {
    this._commonService.getTechnicians().subscribe((data : any)=> {
      this.technicians = data;
    })
  }
  public update()
  {
    const currentUser = this._authService.currentUserValue;
    var model = {
      jobIds : [this.job.callNbr],
      techIds: this.jobForm.controls.techIds.value,
      startDt: this.jobForm.controls.startDate.value,
      notes: this.jobForm.controls.notes.value,
      modifiedby: currentUser.windowsID
    }
    this._adminService.UpdateScheduleJobsinGP(model).subscribe((data : any)=> {
      this.activeModel.close(true);
    })
  }
  cancel()
  {
    this.activeModel.close(false);
  }
}
