import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { HeaderMenuComponent } from './header-menu/header-menu.component';
import { PaginationComponent } from './pagination/pagination.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatSnackBarModule} from '@angular/material/snack-bar';



@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    NavBarComponent,
    HeaderMenuComponent,
    PaginationComponent,
  ],
  imports: [
    CommonModule,
    NgbModule,
    MatSnackBarModule
  ],
  exports : [
    HeaderComponent,
    HeaderMenuComponent,
    NavBarComponent,
    PaginationComponent,
    MatSnackBarModule
  ]
})
export class SharedModule { }
