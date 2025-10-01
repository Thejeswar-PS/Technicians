import { AuthService } from './../../../../auth/services/auth.service';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-sign-in-method',
  templateUrl: './sign-in-method.component.html',
})
export class SignInMethodComponent implements OnInit, OnDestroy {
  showChangeEmailForm: boolean = false;
  showChangePasswordForm: boolean = false;
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoading: boolean;
  updatePasswordForm: FormGroup;
  updateSuccess: boolean = false;
  private unsubscribe: Subscription[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private fb: FormBuilder
    ) {
    const loadingSubscr = this.isLoading$
      .asObservable()
      .subscribe((res) => (this.isLoading = res));
    this.unsubscribe.push(loadingSubscr);
  }

  ngOnInit(): void {
    this.initForm();
  }

  get f() {
    return this.updatePasswordForm.controls;
  }
  initForm() {
    this.updatePasswordForm = this.fb.group({
      currentPassword: [
        [],
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(320), // https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
        ]),
      ],
      newPassword: [
        [],
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
    });
  }


  toggleEmailForm(show: boolean) {
    this.showChangeEmailForm = show;
  }

  saveEmail() {
    this.isLoading$.next(true);
    setTimeout(() => {
      this.isLoading$.next(false);
      this.showChangeEmailForm = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  togglePasswordForm(show: boolean) {
    this.showChangePasswordForm = show;
  }

  savePassword() {
    this.isLoading$.next(true);
    this.authService.updatePassword(this.f.currentPassword.value, this.f.newPassword.value).subscribe(res => {
      if(res.status !== 200)
      {
        this.updateSuccess = false;
      }
      this.isLoading = false;
    })
    // setTimeout(() => {
    //   this.isLoading$.next(false);
    //   this.showChangePasswordForm = false;
    //   this.cdr.detectChanges();
    // }, 1500);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
