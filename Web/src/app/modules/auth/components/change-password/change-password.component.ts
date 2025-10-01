import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { UserModel } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginResponse } from '../../models/auth.model';
import { AuthHTTPService } from '../../services/auth-http';
import { Location } from '@angular/common';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  // KeenThemes mock, change it to:
  defaultAuth: any = {
    email: '',
    password: '',
  };
  changePasswordForm: FormGroup;
  hasError: boolean = false;
  returnUrl: string;
  isLoading$: Observable<boolean>;
  errorMessage: string;

  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private authHttpService: AuthHTTPService,
    private _authService: AuthService,
    private location: Location
  ) {
    this.isLoading$ = this.authService.isLoading$;
    // redirect to home if already logged in
    // if (this.authService.currentUserValue) {
    //   this.router.navigate(['/']);
    // }
  }

  ngOnInit(): void {
    this.initForm();
    // get return url from route parameters or default to '/'
    // this.returnUrl =
    //   this.route.snapshot.queryParams['returnUrl'.toString()] || '/';
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.changePasswordForm.controls;
  }

  initForm() {
    this.changePasswordForm = this.fb.group({
      currentPassword: [
        [],
        Validators.compose([
          Validators.required
        ]),
      ],
      newPassword: [
        [],
        Validators.compose([
          Validators.required
        ]),
      ],
      confirmPassword: [
        [],
        Validators.compose([
          Validators.required
        ]),
      ],
    });
  }

  submit() {
    this.hasError = false;
    if( this.changePasswordForm.controls.newPassword.value !=  this.changePasswordForm.controls.confirmPassword.value)
    {
      this.hasError = true;
      this.errorMessage = 'Password not matched';
      alert(this.errorMessage);
      return;
    }
    const currentUser = this._authService.currentUserValue;
    const loginSubscr = this.authHttpService.updatePassword(currentUser.windowsID,this.f.currentPassword.value, this.f.newPassword.value)
    .subscribe(response => {
        if(response.status == 200)
        {
          this.router.navigate(['/auth/logout']);
          alert("Password has been updated");
        }
        else{
          this.hasError = true;
          this.errorMessage = "Password update failed";
        }

    }, error => {
          console.log(error.status);
          if(error.status == 400)
          {
          this.errorMessage = "Password not matched";
          alert("Wrong password");
          }
    });
    this.unsubscribe.push(loginSubscr);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
  goBack() {
    window.history.back(); // Go back one step in the browser history
  setTimeout(() => {
    location.reload(); // Reload the current page after a brief delay
  }, 100);
  }
}

