import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ProfileState } from '../../profile/state/profile-state';
import { FormsModule } from '@angular/forms';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { JobState } from '../../jobs/state/job-state';
import { APPLICATION_STATUSES, getLatestJobUpdate, Job, JobStatus } from '../../jobs/models/job';
import { Todo } from '../../profile/models/info';

const FOLLOW_UP_AFTER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

interface FollowUp {
  job: Job;
  urgent: boolean;
  text: string;
}

@Component({
  imports: [RouterLink, PageHeader, StatCard, StatusChip, FormsModule],
  selector: 'app-dashboard',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class Dashboard implements OnInit {
  protected profileState = inject(ProfileState);
  protected jobState = inject(JobState);

  getLatestJobUpdate = getLatestJobUpdate;

  newTodoText = '';
  targetRolesDraft = '';
  targetSalaryDraft = '';
  editingTargets = signal(false);

  firstName = computed(() => (this.profileState.info().name ?? '').trim().split(/\s+/)[0]);

  headline = computed(() => {
    const name = this.firstName();
    const n = this.interviews();
    const greeting = name ? `Welcome back, ${name}.` : 'Welcome back.';
    return n > 0
      ? `${greeting} You have ${n} interview${n === 1 ? '' : 's'} in progress.`
      : greeting;
  });

  applications = computed(() =>
    this.jobState.jobs().filter((j) => APPLICATION_STATUSES.includes(getLatestJobUpdate(j).status)),
  );

  activeRoles = computed(
    () =>
      this.applications().filter((j) =>
        [JobStatus.APPLIED, JobStatus.INTERVIEW].includes(getLatestJobUpdate(j).status),
      ).length,
  );

  interviews = computed(
    () =>
      this.applications().filter((j) => getLatestJobUpdate(j).status === JobStatus.INTERVIEW)
        .length,
  );

  offers = computed(
    () =>
      this.applications().filter((j) =>
        [JobStatus.OFFER, JobStatus.ACCEPTED].includes(getLatestJobUpdate(j).status),
      ).length,
  );

  total = computed(() => this.applications().length);

  activeApplications = computed(() =>
    this.applications()
      .filter((j) =>
        [JobStatus.APPLIED, JobStatus.INTERVIEW, JobStatus.OFFER].includes(
          getLatestJobUpdate(j).status,
        ),
      )
      .sort(
        (a, b) =>
          getLatestJobUpdate(b).updatedAt.getTime() - getLatestJobUpdate(a).updatedAt.getTime(),
      )
      .slice(0, 5),
  );

  followUps = computed<FollowUp[]>(() => {
    const cutoff = Date.now() - FOLLOW_UP_AFTER_DAYS * DAY_MS;
    return this.applications()
      .filter((j) => {
        const latest = getLatestJobUpdate(j);
        return (
          [JobStatus.APPLIED, JobStatus.INTERVIEW].includes(latest.status) &&
          latest.updatedAt.getTime() < cutoff
        );
      })
      .map((job) => {
        const latest = getLatestJobUpdate(job);
        const days = this.daysSince(latest.updatedAt);
        const urgent = latest.status === JobStatus.INTERVIEW;
        return {
          job,
          urgent,
          text: urgent
            ? `It's been ${days} days since your last update. Consider following up.`
            : `Applied ${days} days ago. It may be time to follow up.`,
        };
      })
      .sort(
        (a, b) =>
          Number(b.urgent) - Number(a.urgent) ||
          getLatestJobUpdate(a.job).updatedAt.getTime() -
            getLatestJobUpdate(b.job).updatedAt.getTime(),
      )
      .slice(0, 4);
  });

  todos = computed(() => this.profileState.info().todos ?? []);

  daysSince(date: Date): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);
  }

  async ngOnInit(): Promise<void> {
    await this.profileState.load();
    await this.jobState.loadJobs();
    this.targetRolesDraft = this.profileState.info().targetRoles ?? '';
    this.targetSalaryDraft = this.profileState.info().targetSalary ?? '';
  }

  async saveTargets(): Promise<void> {
    await this.profileState.saveInfo({
      ...this.profileState.info(),
      targetRoles: this.targetRolesDraft.trim(),
      targetSalary: this.targetSalaryDraft.trim(),
    });
    this.editingTargets.set(false);
  }

  editTargets(): void {
    this.targetRolesDraft = this.profileState.info().targetRoles ?? '';
    this.targetSalaryDraft = this.profileState.info().targetSalary ?? '';
    this.editingTargets.set(true);
  }

  async addTodo(): Promise<void> {
    const text = this.newTodoText.trim();
    if (!text) return;
    const todo: Todo = { id: crypto.randomUUID(), text, done: false };
    await this.profileState.saveInfo({
      ...this.profileState.info(),
      todos: [...this.todos(), todo],
    });
    this.newTodoText = '';
  }

  async toggleTodo(id: string): Promise<void> {
    const updated = this.todos().map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    await this.profileState.saveInfo({ ...this.profileState.info(), todos: updated });
  }

  async removeTodo(id: string): Promise<void> {
    const updated = this.todos().filter((t) => t.id !== id);
    await this.profileState.saveInfo({ ...this.profileState.info(), todos: updated });
  }
}
