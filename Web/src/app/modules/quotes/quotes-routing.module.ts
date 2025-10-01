import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditQuoteComponent } from './edit-quote/edit-quote.component';
import { QuoteComponent } from './quote/quote.component';
import { QuotesListComponent } from './quotes-list/quotes-list.component';

const routes: Routes = [
  {
    path : '', component : QuoteComponent,
    children : [
      {
        path : 'list', component: QuotesListComponent
      },
      {
        path : 'list/:status', component: QuotesListComponent
      },
      {
        path : 'edit/:quoteId' , component : EditQuoteComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuotesRoutingModule { }
