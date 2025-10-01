import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styles: [
  ]
})
export class HeaderComponent implements OnInit {

  @Input() appHeaderDisplay : boolean = true;

  appHeaderDefaultClass : string = "";

  constructor() { }

  ngOnInit(): void {
  }

}
