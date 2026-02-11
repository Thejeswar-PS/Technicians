import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../core/services/common.service';
import { JobsToBeUploadedService } from '../../../core/services/jobs-to-be-uploaded.service';
import { EmployeeStatusDto } from '../../../core/model/employee-status.model';

interface JobRecord {
  callNbr: string;
  techName: string;
  accMgr: string;
  status: string;
  strtDate: string;
  custName: string;
  changeAge: string;
}

interface Technician {
  techID: string;
  techName: string;
}

interface AccountManager {
  empID: string;
  empName: string;
}

@Component({
  selector: 'app-jobs-to-be-uploaded',
  templateUrl: './jobs-to-be-uploaded.component.html',
  styleUrls: ['./jobs-to-be-uploaded.component.scss']
})
export class JobsToBeUploadedComponent implements OnInit {
  // Filters
  selectedTechnician: string = 'All';
  selectedAccountManager: string = '';

  // Data
  technicians: Technician[] = [];
  accountManagers: AccountManager[] = [];
  jobs: JobRecord[] = [];

  // State
  isLoading: boolean = false;
  statusMessage: string = '';
  isError: boolean = false;
  currentWindowsID: string = '';
  currentEmpID: string = '';
  userRole: string = '';

  // Flags
  technicianDisabled: boolean = false;
  accountManagerDisabled: boolean = false;

  constructor(
    private router: Router,
    private commonService: CommonService,
    private jobsService: JobsToBeUploadedService
  ) {}

  ngOnInit(): void {
    this.initializeFilters();
  }

  private initializeFilters(): void {
    this.isLoading = true;
    this.statusMessage = '';

    // Get current user's Windows ID from localStorage
    try {
      const userDataRaw = localStorage.getItem('userData');
      if (!userDataRaw) {
        this.showError('Unable to determine user information. Please log in again.');
        this.isLoading = false;
        return;
      }
      
      const userData = JSON.parse(userDataRaw);
      this.currentWindowsID = userData?.windowsID || userData?.WindowsID || '';
      
      if (!this.currentWindowsID) {
        this.showError('Unable to determine user Windows ID.');
        this.isLoading = false;
        return;
      }
    } catch (error) {
      console.error('Error reading user data:', error);
      this.showError('Error loading user information.');
      this.isLoading = false;
      return;
    }

    // Get current user info and load dropdowns
    this.commonService.getEmployeeStatusForJobList(this.currentWindowsID).subscribe(
      (statusData: any) => {
        // API returns an array with employee status
        if (statusData && Array.isArray(statusData) && statusData.length > 0) {
          this.currentEmpID = statusData[0].EmpID || statusData[0].empId || '';
          this.userRole = statusData[0].Status || statusData[0].status || '';
        } else {
          this.showError('Unable to determine employee status.');
          this.isLoading = false;
          return;
        }

        // Load technicians and account managers
        this.loadTechnicians();
        this.loadAccountManagers();
      },
      (error: any) => {
        console.error('Error loading employee status:', error);
        this.isLoading = false;
        this.showError('Error loading filters. Please try again.');
      }
    );
  }

  private loadTechnicians(): void {
    this.commonService.getTechnicians().subscribe(
      (data: any) => {
        const techArray = Array.isArray(data) ? data : [];
        this.technicians = techArray.map(t => ({
          techID: t.techID,
          techName: t.techname
        }));

        // Set selected technician based on role
        if (this.userRole === 'Technician' || this.userRole === 'TechManager') {
          this.selectedTechnician = this.currentEmpID;
        } else {
          this.selectedTechnician = 'All';
        }
      },
      (error: any) => {
        console.error('Error loading technicians:', error);
        this.showError('Error loading technicians');
      }
    );
  }

  private loadAccountManagers(): void {
    this.commonService.getAccountManagers().subscribe(
      (data: any) => {
        const amArray = Array.isArray(data) ? data : [];
        this.accountManagers = amArray.map(am => ({
          empID: am.offid,
          empName: am.offname
        }));

        // Set Account Manager based on role
        if (this.userRole === 'Technician' || this.userRole === 'TechManager') {
          this.accountManagerDisabled = true;
          this.selectedAccountManager = 'All';
        } else if (this.userRole === 'Manager' || this.userRole === 'Other') {
          // Check if currentEmpID exists in the account managers list
          const empExists = this.accountManagers.some(am => am.empID === this.currentEmpID);
          
          if (empExists) {
            this.selectedAccountManager = this.currentEmpID;
          } else {
            this.selectedAccountManager = 'All';
          }
          this.accountManagerDisabled = false;
        } else {
          this.selectedAccountManager = 'All';
        }
        
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error loading account managers:', error);
        this.showError('Error loading account managers');
        this.isLoading = false;
      }
    );
  }

  getJobs(): void {
    if (!this.selectedTechnician || !this.selectedAccountManager) {
      this.showError('Please select both Technician and Account Manager');
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.jobs = [];

    this.jobsService.getJobsToBeUploaded(
      this.selectedTechnician,
      this.selectedAccountManager,
      this.currentEmpID
    ).subscribe(
      (response: any) => {
        // Handle both array and wrapped response formats
        let data: JobRecord[] = [];
        
        if (Array.isArray(response)) {
          data = response;
        } else if (response && Array.isArray(response.data)) {
          data = response.data;
        } else if (response && response.data) {
          data = Array.isArray(response.data) ? response.data : [];
        }

        // Trim whitespace from string fields
        this.jobs = data.map(job => ({
          callNbr: job.callNbr?.trim() || '',
          techName: job.techName?.trim() || '',
          accMgr: job.accMgr?.trim() || '',
          status: job.status?.trim() || '',
          strtDate: job.strtDate,
          custName: job.custName?.trim() || '',
          changeAge: job.changeAge
        }));

        this.isLoading = false;

        if (this.jobs.length > 0) {
          this.showSuccess(
            `Jobs to be Uploaded by - ${this.getTechnicianName()} For Account Manager : ${this.getAccountManagerName()}`
          );
        } else {
          this.showError(
            `No Jobs to be Uploaded by - ${this.getTechnicianName()} For Account Manager : ${this.getAccountManagerName()}`
          );
        }
      },
      (error: any) => {
        console.error('Error loading jobs:', error);
        this.isLoading = false;
        this.showError(error.error?.message || 'Error loading jobs. Please try again.');
      }
    );
  }

  goToJobDetails(callNbr: string): void {
    if (callNbr && callNbr.trim()) {
      // Navigate to jobs list page with CallNbr as query parameter (similar to legacy: DTechJobsList.aspx?CallNbr={0})
      this.router.navigate(['/jobs'], { 
        queryParams: { 
          CallNbr: callNbr.trim() 
        } 
      });
    }
  }

  private getTechnicianName(): string {
    if (this.selectedTechnician === 'All') {
      return 'All';
    }
    const tech = this.technicians.find(t => t.techID === this.selectedTechnician);
    return tech ? tech.techName : this.selectedTechnician;
  }

  private getAccountManagerName(): string {
    if (this.selectedAccountManager === 'All') {
      return 'All';
    }
    const am = this.accountManagers.find(am => am.empID === this.selectedAccountManager);
    return am ? am.empName : this.selectedAccountManager;
  }

  private showSuccess(message: string): void {
    this.statusMessage = message;
    this.isError = false;
  }

  private showError(message: string): void {
    this.statusMessage = message;
    this.isError = true;
  }

  goBack(): void {
    this.router.navigate(['/tools']);
  }
}
