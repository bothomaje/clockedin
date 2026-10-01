import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { JobList } from '../../jobs/job-list/job-list';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { APPLICATION_STATUSES, Job } from '../../jobs/models/job';

@Component({
  selector: 'app-applications-list-page',
  imports: [JobList, PageHeader, RouterLink],
  templateUrl: './applications-list-page.html',
})
export class ApplicationsListPage {
  private router = inject(Router);
  statuses = APPLICATION_STATUSES;

  onView(job: Job): void {
    this.router.navigate(['/applications', job.id]);
  }
}
