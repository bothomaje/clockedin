import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthBrandPanel } from '../../shared/layout/auth-brand-panel/auth-brand-panel';
import { ONBOARDING_BRAND } from '../../shared/layout/auth-brand-panel/auth-brand-content';
import { ProfileState } from '../profile/state/profile-state';
import { getCompleteness } from '../profile/state/profile-completeness';
import { Skill } from '../profile/models/skill';
import { Experience } from '../profile/models/experience';

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule, AuthBrandPanel],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding implements OnInit {
  private profileState = inject(ProfileState);
  private router = inject(Router);

  stepLabels = ['Welcome', 'Profile', 'Experience', 'Education', 'Ready'];
  step = signal(0);
  saving = signal(false);

  brand = computed(() => ONBOARDING_BRAND[this.step()]);
  completeness = computed(() => getCompleteness(this.profileState.user()));
  info = this.profileState.info;
  skills = this.profileState.skills;
  latestExperience = computed(() => this.profileState.experience().at(-1));
  firstName = computed(() => (this.profileState.info().name ?? '').trim().split(' ')[0]);

  skillNames = computed(() =>
    this.profileState
      .skills()
      .map((s) => s.name)
      .join(', '),
  );

  name = '';
  jobTitle = '';
  location = '';
  summary = '';
  skillsDraft = '';
  expCompany = '';
  expRole = '';
  expStartMonth = '';
  expEndMonth = '';
  expDescription = '';
  institution = '';
  qualification = '';
  fieldOfStudy = '';
  eduStartMonth = '';
  eduEndMonth = '';
  eduDescription = '';

  get roleIncomplete(): boolean {
    const any = this.expCompany || this.expRole || this.expStartMonth;
    const all = this.expCompany && this.expRole && this.expStartMonth;
    return !!any && !all;
  }

  async ngOnInit(): Promise<void> {
    await this.profileState.load();
    const info = this.profileState.info();
    this.name = info.name ?? '';
    this.jobTitle = info.title ?? '';
    this.location = info.location ?? '';
    this.summary = info.summary ?? '';
  }

  next(): void {
    this.step.update((s) => Math.min(s + 1, this.stepLabels.length - 1));
  }

  back(): void {
    this.step.update((s) => Math.max(s - 1, 0));
  }

  async skip(): Promise<void> {
    await this.profileState.completeOnboarding();
    this.router.navigate(['/dashboard']);
  }

  async saveProfile(): Promise<void> {
    this.saving.set(true);
    try {
      const info = this.profileState.info();
      const otherLinks = (info.links ?? []).filter((l) => l.type !== 'portfolio');
      await this.profileState.saveInfo({
        ...info,
        name: this.name.trim(),
        title: this.jobTitle.trim(),
        location: this.location.trim(),
        summary: this.summary.trim(),
        links: otherLinks,
      });
      this.next();
    } finally {
      this.saving.set(false);
    }
  }

  async initialize(): Promise<void> {
    this.saving.set(true);
    try {
      const existing = this.profileState.skills();
      const known = new Set(existing.map((s) => s.name?.toLowerCase()));
      const added: Skill[] = this.skillsDraft
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n && !known.has(n.toLowerCase()))
        .map((name) => ({ name }));
      if (added.length) await this.profileState.saveSkills([...existing, ...added]);

      if (this.expCompany && this.expRole && this.expStartMonth) {
        const experience: Experience = {
          company: this.expCompany.trim(),
          role: this.expRole.trim(),
          startDate: new Date(this.expStartMonth),
          endDate: this.expEndMonth ? new Date(this.expEndMonth) : null,
          description: this.expDescription.trim() || undefined,
        };
        await this.profileState.saveExperience([...this.profileState.experience(), experience]);
      }

      if (this.institution.trim()) {
        await this.profileState.saveEducation([
          ...this.profileState.user().career.education,
          {
            institution: this.institution.trim(),
            qualification: this.qualification.trim(),
            field: this.fieldOfStudy.trim(),
            startDate: new Date(this.eduStartMonth),
            endDate: this.eduEndMonth ? new Date(this.eduEndMonth) : null,
            description: this.eduDescription.trim(),
          },
        ]);
      }

      await this.profileState.completeOnboarding();
      this.next();
    } finally {
      this.saving.set(false);
    }
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}
