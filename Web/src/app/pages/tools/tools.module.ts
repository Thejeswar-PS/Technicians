import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolsRoutingModule } from './tools-routing.module';
import { TechToolsComponent } from './tech-tools/tech-tools.component';

@NgModule({
  declarations: [
    TechToolsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ToolsRoutingModule
  ]
})
export class ToolsModule { }
