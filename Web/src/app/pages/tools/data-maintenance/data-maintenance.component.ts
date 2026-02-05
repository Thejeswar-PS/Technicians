import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DataMaintenanceService, MakeOption } from './data-maintenance.service';

interface RefValue {
  equipID: number;
  make: string;
  model: string;
  refValue: number | null;
  resistance: number | null;
  lastModified: string;
}

interface NewRefValue {
  equipID: number | null;
  make: string;
  model: string;
  refValue: number | null;
  resistance: number | null;
}

@Component({
  selector: 'app-data-maintenance',
  templateUrl: './data-maintenance.component.html',
  styleUrls: ['./data-maintenance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataMaintenanceComponent implements OnInit {
  makes: MakeOption[] = [];
  selectedMake: string = '';
  refValues: RefValue[] = [];
  editingIndex: number | null = null;
  addingNew: boolean = false;
  newRefValue: NewRefValue = {
    equipID: null,
    make: '',
    model: '',
    refValue: null,
    resistance: null
  };

  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  sortBy = 'make';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private service: DataMaintenanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMakes();
  }

  loadMakes(): void {
    this.loading = true;
    this.service.getBatteryMakes().subscribe({
      next: (data) => {
        this.makes = data;
        if (data.length > 0) {
          // Skip "Please Select" option and select first actual make
          const firstMake = data.find(m => m.value !== 'PS');
          if (firstMake) {
            this.selectedMake = firstMake.value;
            this.loadRefValues(firstMake.value);
          }
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.message = 'Error loading manufacturers: ' + err.message;
        this.messageType = 'error';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onMakeChange(): void {
    this.editingIndex = null;
    this.addingNew = false;
    this.message = '';
    this.loadRefValues(this.selectedMake);
  }

  loadRefValues(make: string): void {
    if (!make) return;
    this.loading = true;
    this.service.getRefValues(make).subscribe({
      next: (data) => {
        this.refValues = data;
        this.sortRefValues();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.message = 'Error loading data: ' + err.message;
        this.messageType = 'error';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  sortRefValues(): void {
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    this.refValues.sort((a, b) => {
      let result = 0;
      if (this.sortBy === 'make') {
        result = a.make.localeCompare(b.make);
      } else if (this.sortBy === 'model') {
        result = a.model.localeCompare(b.model);
      } else if (this.sortBy === 'equipID') {
        result = a.equipID - b.equipID;
      }
      return result * direction;
    });
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.sortRefValues();
    this.cdr.markForCheck();
  }

  startEdit(index: number): void {
    this.editingIndex = index;
    this.addingNew = false;
    this.message = '';
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.addingNew = false;
    this.message = '';
    this.cdr.markForCheck();
  }

  updateRefValue(item: RefValue): void {
    if (!this.validateUpdate(item)) return;

    this.loading = true;
    this.service.updateRefValue(item).subscribe({
      next: () => {
        this.message = `Make: ${item.make} Model: ${item.model} updated successfully`;
        this.messageType = 'success';
        this.editingIndex = null;
        this.loadRefValues(this.selectedMake);
      },
      error: (err) => {
        this.message = 'Error updating data: ' + err.message;
        this.messageType = 'error';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteRefValue(item: RefValue, index: number): void {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be reversed.')) {
      return;
    }

    this.loading = true;
    this.service.deleteRefValue(item).subscribe({
      next: () => {
        this.message = `Make: ${item.make} Model: ${item.model} deleted successfully`;
        this.messageType = 'success';
        this.loadRefValues(this.selectedMake);
      },
      error: (err) => {
        this.message = 'Error deleting data: ' + err.message;
        this.messageType = 'error';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  startAddNew(): void {
    this.addingNew = true;
    this.editingIndex = null;
    this.newRefValue = {
      equipID: null,
      make: this.selectedMake,
      model: '',
      refValue: null,
      resistance: null
    };
    this.message = '';
    this.cdr.markForCheck();
  }

  cancelAddNew(): void {
    this.addingNew = false;
    this.newRefValue = {
      equipID: null,
      make: '',
      model: '',
      refValue: null,
      resistance: null
    };
    this.message = '';
    this.cdr.markForCheck();
  }

  addNew(): void {
    if (!this.validateNewEntry()) return;

    this.loading = true;
    const newItem: RefValue = {
      equipID: this.newRefValue.equipID!,
      make: this.newRefValue.make,
      model: this.newRefValue.model,
      refValue: this.newRefValue.refValue,
      resistance: this.newRefValue.resistance,
      lastModified: new Date().toISOString()
    };

    this.service.addRefValue(newItem).subscribe({
      next: () => {
        this.message = `Make: ${newItem.make} Model: ${newItem.model} added successfully`;
        this.messageType = 'success';
        this.addingNew = false;
        this.newRefValue = {
          equipID: null,
          make: '',
          model: '',
          refValue: null,
          resistance: null
        };
        this.loadRefValues(this.selectedMake);
      },
      error: (err) => {
        this.message = 'Error adding data: ' + err.message;
        this.messageType = 'error';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private validateUpdate(item: RefValue): boolean {
    if (!item.refValue && !item.resistance) {
      this.message = 'You must enter the Reference value or Resistance value.';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return false;
    }
    if ((item.refValue === null || item.refValue <= 0) && (item.resistance === null || item.resistance <= 0)) {
      this.message = 'Resistance / Reference value must be greater than zero';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return false;
    }
    return true;
  }

  private validateNewEntry(): boolean {
    if (!this.newRefValue.equipID) {
      this.message = 'You must enter the Equipment ID';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return false;
    }
    if (!this.newRefValue.make) {
      this.message = 'You must enter the Make Name';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return false;
    }
    if (!this.newRefValue.model) {
      this.message = 'You must enter the Model Name';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return false;
    }
    if (!this.newRefValue.refValue && !this.newRefValue.resistance) {
      this.message = 'You must enter the Reference value or Resistance value.';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return false;
    }
    if ((this.newRefValue.refValue === null || this.newRefValue.refValue <= 0) && 
        (this.newRefValue.resistance === null || this.newRefValue.resistance <= 0)) {
      this.message = 'Resistance / Reference value must be greater than zero';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return false;
    }
    return true;
  }
}
