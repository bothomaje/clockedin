import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { JobList, APPLICATION_STATUSES, Job } from '@domains/jobs';
import { PageHeader } from '@shared/ui/page-header/page-header';

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
