import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap/datepicker';

/** Bootstrap input group + ng-bootstrap datepicker. Replaces <input type="date">. */
@Component({
  selector: 'app-date-field',
  imports: [FormsModule, NgbInputDatepicker],
  templateUrl: './date-field.html',
})
export class DateField {
  value = model<Date | null | undefined>(null);
  inputId = input<string>();
  ariaLabel = input<string>();
  disabled = input(false);

  protected onModelChange(next: unknown): void {
    if (next === null || next instanceof Date) this.value.set(next);
  }
}
