import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-quantity',
  templateUrl: './quantity.component.html',
  styleUrls: ['./quantity.component.scss']
})
export class QuantityComponent implements OnInit {
  @Input() dcgIds : any[]
  @ViewChild('input') inputValue: ElementRef<HTMLInputElement>
  constructor(public activeModal: NgbActiveModal,
    private router : Router) { }

  ngOnInit(): void {
  }

  OnCloseModal(){
    const link =  this.router.navigate(['pricing/dcg-pricing-detail'], { queryParams: { id: this.dcgIds.toString(), quantity: this.inputValue.nativeElement.value} });
    this.activeModal.close();
  }

}
