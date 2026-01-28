import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolsRoutingModule } from './tools-routing.module';
import { TechToolsComponent } from './tech-tools/tech-tools.component';
import { NotesSearchComponent } from '../notes-search/notes-search.component';
import { JobsToBeUploadedComponent } from './jobs-to-be-uploaded/jobs-to-be-uploaded.component';

@NgModule({
  declarations: [
    TechToolsComponent,
    NotesSearchComponent,
    JobsToBeUploadedComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ToolsRoutingModule
  ]
})
export class ToolsModule { }
