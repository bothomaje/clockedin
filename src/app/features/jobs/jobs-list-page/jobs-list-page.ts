import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { JobList } from '../job-list/job-list';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Job, SAVED_JOB_STATUSES } from '../models/job';

@Component({
  selector: 'app-jobs-list-page',
  imports: [JobList, PageHeader, RouterLink],
  templateUrl: './jobs-list-page.html',
})
export class JobsListPage {
  private router = inject(Router);

  onView(job: Job): void {
    this.router.navigate(['/jobs', job.id]);
  }

  onEdit(job: Job): void {
    this.router.navigate(['/jobs', job.id, 'edit']);
  }
}
