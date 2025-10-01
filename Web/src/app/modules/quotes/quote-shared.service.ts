import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuoteSharedService {

  private isFromEdit$ = new BehaviorSubject<boolean>(false);
  setIsFromEdit$ = this.isFromEdit$.asObservable();

  setIsFromEdit(isFromEdit: boolean) {
    this.isFromEdit$.next(isFromEdit);
  }
  resetIsFromEdit()
  {
    this.isFromEdit$.next(false);
  }
}
