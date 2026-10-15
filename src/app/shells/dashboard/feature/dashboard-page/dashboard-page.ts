import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { FormsModule } from '@angular/forms';
import {
  JobsFacade,
  FollowUpsWidget,
  ApplicationStatsWidget,
  ActiveApplicationsWidget,
} from '@domains/jobs';
import { JobSearchGoalsWidget, ProfileFacade, TodoListWidget } from '@domains/profile';
import { TopMatchesWidget } from '@domains/recommendations';

@Component({
  imports: [
    RouterLink,
    PageHeader,
    FormsModule,
    FollowUpsWidget,
    ApplicationStatsWidget,
    ActiveApplicationsWidget,
    TodoListWidget,
    JobSearchGoalsWidget,
    TopMatchesWidget,
  ],
  selector: 'app-dashboard',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class Dashboard implements OnInit {
  protected profile = inject(ProfileFacade);
  protected jobs = inject(JobsFacade);

  firstName = computed(() => (this.profile.info().name ?? '').trim().split(/\s+/)[0]);
  headline = computed(() => {
    const name = this.firstName();
    const n = this.jobs.stats().interviews;
    const greeting = name ? `Welcome back, ${name}.` : 'Welcome back.';
    return n > 0
      ? `${greeting} You have ${n} interview${n === 1 ? '' : 's'} in progress.`
      : greeting;
  });

  ngOnInit() {
    void this.profile.ensureLoaded();
    void this.jobs.ensureLoaded();
  }
}
