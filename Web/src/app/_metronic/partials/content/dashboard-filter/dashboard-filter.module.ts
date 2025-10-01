import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterDropdownComponent } from './filter-dropdown/filter-dropdown.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FilterToBeWrittenComponent } from './filter-to-be-written/filter-to-be-written.component';
import { FilterToBeSentComponent } from './filter-to-be-sent/filter-to-be-sent.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports:[
    FilterDropdownComponent,
    FilterToBeWrittenComponent,
    FilterToBeSentComponent
  ],

  declarations: [
    FilterDropdownComponent,
    FilterToBeWrittenComponent,
    FilterToBeSentComponent
  ]
})
export class DashboardFilterModule { }
