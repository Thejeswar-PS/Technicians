import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonService } from 'src/app/core/services/common.service';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

@Component({
  selector: 'app-filter-dropdown',
  templateUrl: './filter-dropdown.component.html',
  styleUrls: ['./filter-dropdown.component.scss']
})
export class FilterDropdownComponent implements OnInit {
  @HostBinding('class') class =
  'menu menu-sub menu-sub-dropdown w-250px w-md-300px';
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';


  @Input() showDepartments : boolean = false;
  @Input() showManagers : boolean = false;
  @Input() showDateRanges : boolean = false;

  accountManagers : any = [];
  quotefilterForm = this.fb.group({
    Department : ['A'],
    AccountManager : ['ALL'],
    DateRange : ['CY']
  });
  constructor(private dashboardService: DashboardService,
    private _commonService: CommonService,
    private fb: FormBuilder,
    private filterSharedService: DashboardFilterSharedService
    ) { }

  ngOnInit() {
    this.LoadAccountManager(false,true);
  }

  LoadAccountManager(loadDefault: boolean = false, publish: boolean = false)
  {
    let dept = this.quotefilterForm.value.Department as string;
    let userData = JSON.parse(localStorage.getItem("userData")!);
    let dashboardfilterData = JSON.parse(localStorage.getItem("DashboardFilterSelectedData")!);

    this._commonService.getAccountManagers().subscribe((data: any)  => {
      this.accountManagers = data;
      var searchIndex = data.find((item : any) => item.empName.trim() === userData.empName.trim());

      if(searchIndex === undefined || loadDefault)
      {
        this.quotefilterForm.patchValue({
          AccountManager: 'ALL'
        });
      }
      else{
        this.quotefilterForm.patchValue({
          AccountManager: userData.empName.trim(),
          DateRange: dashboardfilterData === null ? 'CY' : dashboardfilterData.dateRange
        });
      }
      localStorage.setItem("AccountManagers", JSON.stringify(this.accountManagers));
      if(publish)
      {
        this.publishFilterData();
      }
    });
  }

  subscribeFilterDataChange()
  {
    this.quotefilterForm.valueChanges.subscribe(data => {
      if (this.quotefilterForm.valid) {
        this.LoadAccountManager();
      }
    });
  }
  changeDepartment()
  {
    this.LoadAccountManager(true,true);
    // this.publishFilterData();
  }
  changeAccountManager()
  {
    this.publishFilterData();
  }
  changeDateRange()
  {

    this.publishFilterData();
  }
  publishFilterData()
  {
    var filters =
    {
      department : this.quotefilterForm.value.Department,
      accountManager: this.quotefilterForm.value.AccountManager,
      dateRange:  this.quotefilterForm.value.DateRange
    }
    localStorage.setItem("DashboardFilterSelectedData", JSON.stringify(filters));
    this.filterSharedService.setDashboardFilter(filters)
  }
}
