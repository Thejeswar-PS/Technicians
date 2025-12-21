import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';

import { StrippedPartsInunitComponent } from './stripped-parts-inunit.component';
import { ReportService } from 'src/app/core/services/report.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';

describe('StrippedPartsInunitComponent', () => {
  let component: StrippedPartsInunitComponent;
  let fixture: ComponentFixture<StrippedPartsInunitComponent>;
  let reportService: jasmine.SpyObj<ReportService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const reportServiceSpy = jasmine.createSpyObj('ReportService', [
      'getStrippedPartsInUnit',
      'getStripPartCodes',
      'saveStrippedPartInUnit',
      'updateStrippedPartInUnit',
      'deleteStrippedPartInUnit'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: { userName: 'testuser' }
    });

    await TestBed.configureTestingModule({
      declarations: [StrippedPartsInunitComponent],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        ToastrModule.forRoot()
      ],
      providers: [
        { provide: ReportService, useValue: reportServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        CommonService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StrippedPartsInunitComponent);
    component = fixture.componentInstance;
    reportService = TestBed.inject(ReportService) as jasmine.SpyObj<ReportService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default mock responses
    reportService.getStripPartCodes.and.returnValue(of({ success: true, data: [] }));
    reportService.getStrippedPartsInUnit.and.returnValue(of({ success: true, data: [] }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on construction', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.strippedPartsForm).toBeDefined();
  });

  it('should load strip part codes on init', () => {
    component.ngOnInit();
    expect(reportService.getStripPartCodes).toHaveBeenCalled();
  });

  it('should validate search form', () => {
    component.searchForm.patchValue({ masterRowIndex: '' });
    expect(component.searchForm.valid).toBeFalsy();

    component.searchForm.patchValue({ masterRowIndex: 123 });
    expect(component.searchForm.valid).toBeTruthy();
  });

  it('should load parts when masterRowIndex is provided', () => {
    component.masterRowIndex = 123;
    component['loadStrippedPartsForUnit']();
    expect(reportService.getStrippedPartsInUnit).toHaveBeenCalledWith(123);
  });
});