import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuotesRoutingModule } from './quotes-routing.module';
import { QuotesListComponent } from './quotes-list/quotes-list.component';
import { QuoteComponent } from './quote/quote.component';
import { LayoutModule } from 'src/app/_metronic/layout';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { CoreModule } from 'src/app/core/core.module';
import { EditQuoteComponent } from './edit-quote/edit-quote.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WidgetsModule } from 'src/app/_metronic/partials';
import { QuoteDetailsModalComponent } from './modal/quote-details/quote-details.component';
import { ChangeStatusModalComponent } from './modal/change-status-modal/change-status-modal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/components/shared/shared.module';


@NgModule({
  declarations: [
    QuotesListComponent,
    QuoteComponent,
    EditQuoteComponent,
    QuoteDetailsModalComponent,
    ChangeStatusModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    QuotesRoutingModule,
    WidgetsModule,
    SharedModule,
    LayoutModule,
    InlineSVGModule,
    CoreModule,
    FormsModule,
    NgbModule
  ]
})
export class QuotesModule { }
