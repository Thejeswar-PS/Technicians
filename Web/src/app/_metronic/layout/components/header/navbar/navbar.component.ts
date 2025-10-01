import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-navbar1',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() appHeaderDefaulMenuDisplay: boolean;
  @Input() isRtl: boolean;

  user$: Observable<any>;

  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string =
    'btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px';
  userAvatarClass: string = 'symbol-35px symbol-md-40px';
  btnIconClass: string = 'svg-icon-1';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.user$ = this.auth.currentUserSubject.asObservable();

  }

  loadData()
  {

  }
}
