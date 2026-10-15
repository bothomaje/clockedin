import { ProfileState } from './../../data/state/profile-state';
import { Component, inject, linkedSignal, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

@Component({
  imports: [FormField],
  selector: 'app-job-search-goals-widget',
  styleUrl: './job-search-goals-widget.scss',
  templateUrl: './job-search-goals-widget.html',
})
export class JobSearchGoalsWidget {
  private state = inject(ProfileState);
  readonly info = this.state.info;

  goalsModel = linkedSignal(() => ({
    targetRoles: this.info().targetRoles ?? '',
    targetSalary: this.info().targetSalary ?? '',
  }));

  goals = form(this.goalsModel);
  editingTargets = signal(false);

  async saveTargets() {
    await this.state.saveTargets(
      this.goals.targetRoles().value(),
      this.goals.targetSalary().value(),
    );
    this.editingTargets.set(false);
  }

  editTargets(): void {
    this.editingTargets.set(true);
  }
}
