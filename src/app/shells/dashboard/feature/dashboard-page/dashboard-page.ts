import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { FormsModule } from '@angular/forms';
import {
  JobsFacade,
  APPLICATION_STATUSES,
  getLatestJobUpdate,
  JobStatus,
  JobLocationPipe,
  FollowUpsWidget,
  ApplicationStatsWidget,
  ActiveApplicationsWidget,
} from '@domains/jobs';
import { ProfileFacade, Todo } from '@domains/profile';
import { RecommendationsFacade } from '@domains/recommendations';
import { WORK_MODE_LABELS } from '@shared/location/location.model';

@Component({
  imports: [
    RouterLink,
    PageHeader,
    FormsModule,
    JobLocationPipe,
    FollowUpsWidget,
    ApplicationStatsWidget,
    ActiveApplicationsWidget,
  ],
  selector: 'app-dashboard',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class Dashboard implements OnInit {
  protected profile = inject(ProfileFacade);
  protected jobs = inject(JobsFacade);
  protected recommendations = inject(RecommendationsFacade);

  workModeLabels = WORK_MODE_LABELS;

  newTodoText = '';
  targetRolesDraft = '';
  targetSalaryDraft = '';
  editingTargets = signal(false);

  firstName = computed(() => (this.profile.info().name ?? '').trim().split(/\s+/)[0]);

  headline = computed(() => {
    const name = this.firstName();
    const n = this.jobs.stats().interviews;
    const greeting = name ? `Welcome back, ${name}.` : 'Welcome back.';
    return n > 0
      ? `${greeting} You have ${n} interview${n === 1 ? '' : 's'} in progress.`
      : greeting;
  });

  todos = computed(() => this.profile.info().todos ?? []);

  async ngOnInit(): Promise<void> {
    void this.recommendations.load();
    await this.profile.load();
    await this.jobs.loadJobs();
    this.targetRolesDraft = this.profile.info().targetRoles ?? '';
    this.targetSalaryDraft = this.profile.info().targetSalary ?? '';
  }

  async saveTargets(): Promise<void> {
    await this.profile.saveInfo({
      ...this.profile.info(),
      targetRoles: this.targetRolesDraft.trim(),
      targetSalary: this.targetSalaryDraft.trim(),
    });
    this.editingTargets.set(false);
  }

  editTargets(): void {
    this.targetRolesDraft = this.profile.info().targetRoles ?? '';
    this.targetSalaryDraft = this.profile.info().targetSalary ?? '';
    this.editingTargets.set(true);
  }

  async addTodo(): Promise<void> {
    const text = this.newTodoText.trim();
    if (!text) return;
    const todo: Todo = { id: crypto.randomUUID(), text, done: false };
    await this.profile.saveInfo({
      ...this.profile.info(),
      todos: [...this.todos(), todo],
    });
    this.newTodoText = '';
  }

  async toggleTodo(id: string): Promise<void> {
    const updated = this.todos().map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    await this.profile.saveInfo({ ...this.profile.info(), todos: updated });
  }

  async removeTodo(id: string): Promise<void> {
    const updated = this.todos().filter((t) => t.id !== id);
    await this.profile.saveInfo({ ...this.profile.info(), todos: updated });
  }
}
