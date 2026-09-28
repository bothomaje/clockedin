import { Component, effect, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Job } from '../models/job';

@Component({
  selector: 'app-job-form',
  imports: [FormsModule, DatePipe],
  templateUrl: './job-form.html',
})
export class JobForm {
  job = input.required<Job>();
  save = output<Job>();
  cancel = output<void>();

  editedJob!: Job;

  constructor() {
    effect(() => {
      this.editedJob = { ...this.job() };
    });
  }

  toDate(value: string): Date {
    return new Date(value);
  }
}
