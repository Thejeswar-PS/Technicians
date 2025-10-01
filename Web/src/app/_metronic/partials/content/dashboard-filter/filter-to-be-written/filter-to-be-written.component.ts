import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

@Component({
  selector: 'app-filter-to-be-written',
  templateUrl: './filter-to-be-written.component.html',
  styleUrls: ['./filter-to-be-written.component.scss']
})
export class FilterToBeWrittenComponent implements OnInit {

  @HostBinding('class') class =
  'menu menu-sub menu-sub-dropdown w-250px w-md-300px';
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';


  @Input() showDepartments : boolean = false;
  @Input() showManagers : boolean = false;
  @Input() showDateRanges : boolean = false;

  accountManagers : any = [
    {
        "text": " DC Group as Subcntr",
        "value": "77"
    },
    {
        "text": "Account House",
        "value": "76"
    },
    {
        "text": "Alaina Price",
        "value": "51"
    },
  ]
;
  quotefilterForm = this.fb.group({
    Department : ['A'],
    AccountManager : ['A'],
    DateRange : ['CY']
  });
  constructor(private dashboardService: DashboardService,
    private fb: FormBuilder,
    private filterSharedService: DashboardFilterSharedService
    ) { }

  ngOnInit() {
    this.LoadAccountManager();
    this.subscribeFilterDataChange();
  }

  LoadAccountManager()
  {
    let dept = this.quotefilterForm.value.Department as string;

    this.dashboardService.getAccountManagers(dept).subscribe(data  => {
      this.accountManagers = data;
      this.OnFilterDataChange();
    });
      //this.OnFilterDataChange();//need to be removed before final push
  }


  subscribeFilterDataChange()
  {
    this.quotefilterForm.valueChanges.subscribe(data => {
      if (this.quotefilterForm.valid) {
          this.OnFilterDataChange();
      }
    });
  }

  OnFilterDataChange()
  {
    var filters =
    {
      accountManager: this.quotefilterForm.value.AccountManager
    }
    this.filterSharedService.setToBeWrittenTableData(filters)
  }
}
