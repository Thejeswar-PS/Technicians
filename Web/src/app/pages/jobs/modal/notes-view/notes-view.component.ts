import { Component, Input, OnInit } from '@angular/core';
import { GetNotes } from 'src/app/core/model/get-notes.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-notes-view',
  templateUrl: './notes-view.component.html',
  styleUrls: ['./notes-view.component.scss']
})
export class NotesViewComponent implements OnInit {
  @Input() note: GetNotes;
  @Input() jobId: any;
  @Input() siteId: any;

  test: any = "<h2>Test</h2>"
  constructor(public activeModal: NgbActiveModal) { 
  }

  ngOnInit(): void {
    // this.note.contractNotes = this.note.contractNotes //!== null ? this.note.contractNotes.replace('\r','<br/>') : null;

  }
  convertNewLines(input: any): any { 
    return input.replace(/\r?\n/g, '####'); 
  }

}
