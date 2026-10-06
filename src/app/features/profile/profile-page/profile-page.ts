import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ProfileState } from '../state/profile-state';
import { Experience } from '../models/experience';
import { Education } from '../models/education';
import { Project } from '../models/project';
import { Skill } from '../models/skill';
import { CareerProfile } from '../models/career-profile';
import { Evidence } from '../models/evidence';
import { Link } from '../models/link';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Modal } from '../../../shared/ui/modal/modal';
import { Info } from '../models/info';
import { CompletenessId, getCompleteness, READY_SCORE } from '../state/profile-completeness';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { DateField } from '../../../shared/ui/date-field/date-field';
import { LocationInput } from '../../../shared/ui/location-input/location-input';
import { Select, SelectOption } from '../../../shared/ui/select/select';
import {
  placeLabel,
  WORK_MODE_LABELS,
  workLocationLabel,
  WorkMode,
} from '../../../shared/location/location.model';

@Component({
  imports: [FormsModule, DatePipe, PageHeader, Modal, ErrorState, DateField, LocationInput, Select],
  selector: 'app-profile',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class Profile implements OnInit {
  private profileState = inject(ProfileState);

  skillError = '';

  editedInfo?: Info;
  editedExperience?: Experience;
  editedEducation?: Education;
  editedProject?: Project;
  editedSkill?: Skill;
  editedCareerProfile?: CareerProfile;

  expandedExperienceId?: string;
  editedExperienceEvidence?: Evidence;

  expandedProjectId?: string;
  editedProjectEvidence?: Evidence;

  completeness = computed(() => getCompleteness(this.profileState.user()));
  isReady = computed(() => this.completeness().score >= READY_SCORE);

  sortedExperience = computed(() =>
    [...this.profileState.experience()].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    ),
  );

  headline = computed(() => {
    const title = this.profileState.info().title?.trim();
    if (title) return title;
    const list = this.sortedExperience();
    return (list.find((e) => !e.endDate) ?? list[0])?.role ?? '';
  });

  initials = computed(() => {
    const info = this.profileState.info();
    const source = (info.name || info.email || '?').trim();
    return source
      .split(/\s/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  get isLoading() {
    return this.profileState.loading();
  }

  get errorMessage() {
    return this.profileState.error();
  }

  get info() {
    return this.profileState.info();
  }

  get infoLocation(): string {
    return placeLabel(this.info.location, this.info.legacyLocation);
  }
  experienceLocation(experience: Experience): string {
    return workLocationLabel(experience);
  }
  workModeSelectOptions: SelectOption<WorkMode | ''>[] = [
    { value: '', label: 'Not specified' },
    ...(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((value) => ({
      value,
      label: WORK_MODE_LABELS[value],
    })),
  ];
  get experienceWorkMode(): WorkMode | '' {
    return this.editedExperience?.workMode ?? '';
  }
  set experienceWorkMode(value: WorkMode | '') {
    if (this.editedExperience) this.editedExperience.workMode = value || null;
  }

  get experience() {
    return this.profileState.experience();
  }

  get education() {
    return this.profileState.education();
  }

  get projects() {
    return this.profileState.projects();
  }

  get skills() {
    return this.profileState.skills();
  }

  get careerProfiles() {
    return this.profileState.careerProfiles();
  }

  ngOnInit() {
    this.profileState.load();
  }

  reload() {
    this.profileState.load();
  }

  linkLabel(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }

  toCsv(values?: string[]): string {
    return (values ?? []).join(', ');
  }

  fromCsv(value: string): string[] {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  beginInfoEdit() {
    this.editedInfo = {
      ...this.info,
      links: (this.info.links ?? []).map((l) => ({ ...l })),
    };
  }

  cancelInfoEdit() {
    this.editedInfo = undefined;
    this.openLinkTypeIndex = null;
  }

  async saveInfo() {
    if (!this.editedInfo) return;
    await this.profileState.saveInfo({
      ...this.editedInfo,
      links: (this.editedInfo.links ?? []).filter((l) => l.url.trim()),
    });
    this.cancelInfoEdit();
  }

  addLink(): void {
    if (!this.editedInfo) return;
    this.editedInfo.links = [...(this.editedInfo.links ?? []), { type: '', url: '' }];
  }

  removeLink(index: number): void {
    if (!this.editedInfo) return;
    this.editedInfo.links = (this.editedInfo.links ?? []).filter((_, i) => i !== index);
  }

  runCheckAction(id: CompletenessId): void {
    switch (id) {
      case 'basics':
      case 'summary':
      case 'links':
        return this.beginInfoEdit();
      case 'experience':
        return this.beginExperienceAdd();
      case 'evidence': {
        const target = this.experience.find((e) => !(e.evidence?.length ?? 0));
        if (target) this.expandedExperienceId = target.id;
        return;
      }
      case 'education':
        return this.beginEducationAdd();
      case 'projects':
        return this.beginProjectAdd();
      case 'skills':
        return this.beginSkillAdd();
      case 'careerProfiles':
        return this.beginCareerProfileAdd();
    }
  }

  readonly linkTypeOptions = ['GitHub', 'LinkedIn', 'Site', 'Portfolio', 'Personal'];
  openLinkTypeIndex: number | null = null;

  linkTypeSuggestions(link: Link): string[] {
    const typed = (link.type ?? '').trim().toLowerCase();
    if (!typed) return this.linkTypeOptions;
    return this.linkTypeOptions.filter((opt) => opt.includes(typed));
  }

  showAddLinkType(link: Link): boolean {
    const typed = (link.type ?? '').trim();
    if (!typed) return false;
    return !this.linkTypeOptions.some((opt) => opt === typed.toLowerCase());
  }

  selectLinkType(link: Link, value: string): void {
    link.type = value.trim();
    this.openLinkTypeIndex = null;
  }

  closeLinkTypeDropdown(): void {
    this.openLinkTypeIndex = null;
  }

  // ---- Experience -----

  beginExperienceAdd() {
    this.editedExperience = { startDate: new Date() };
  }

  editExperience(experience: Experience) {
    this.editedExperience = { ...experience };
  }

  cancelExperienceEdit() {
    this.editedExperience = undefined;
  }

  async saveExperience() {
    if (!this.editedExperience) return;
    if (this.editedExperience.workMode === 'remote') this.editedExperience.location = null;

    const updated = this.editedExperience.id
      ? this.experience.map((e) =>
          e.id === this.editedExperience!.id ? this.editedExperience! : e,
        )
      : [...this.experience, { ...this.editedExperience, id: crypto.randomUUID() }];

    await this.profileState.saveExperience(updated);
    this.editedExperience = undefined;
  }

  async deleteExperience(experience: Experience) {
    const updated = this.experience.filter((e) => e.id !== experience.id);
    await this.profileState.saveExperience(updated);
  }

  // ---- Experience evidence ----

  toggleExperienceDetails(experience: Experience) {
    this.expandedExperienceId =
      this.expandedExperienceId === experience.id ? undefined : experience.id;
    this.editedExperienceEvidence = undefined;
  }

  beginExperienceEvidenceAdd() {
    this.editedExperienceEvidence = { id: '', text: '' };
  }

  editExperienceEvidence(evidence: Evidence) {
    this.editedExperienceEvidence = { ...evidence };
  }

  cancelExperienceEvidenceEdit() {
    this.editedExperienceEvidence = undefined;
  }

  async saveExperienceEvidence(experience: Experience) {
    if (!this.editedExperienceEvidence?.text) return;

    const existing = experience.evidence ?? [];
    const updatedEvidence = this.editedExperienceEvidence.id
      ? existing.map((ev) =>
          ev.id === this.editedExperienceEvidence!.id ? this.editedExperienceEvidence! : ev,
        )
      : [...existing, { ...this.editedExperienceEvidence, id: crypto.randomUUID() }];

    const updated = this.experience.map((e) =>
      e.id === experience.id ? { ...e, evidence: updatedEvidence } : e,
    );

    await this.profileState.saveExperience(updated);
    this.editedExperienceEvidence = undefined;
  }

  async deleteExperienceEvidence(experience: Experience, evidence: Evidence) {
    const updatedEvidence = (experience.evidence ?? []).filter((ev) => ev.id !== evidence.id);

    const updated = this.experience.map((e) =>
      e.id === experience.id ? { ...e, evidence: updatedEvidence } : e,
    );

    await this.profileState.saveExperience(updated);
  }

  // ---- Education ----
  beginEducationAdd() {
    this.editedEducation = {};
  }

  editEducation(education: Education) {
    this.editedEducation = { ...education };
  }

  cancelEducationEdit() {
    this.editedEducation = undefined;
  }

  async saveEducation() {
    if (!this.editedEducation) return;

    const updated = this.editedEducation.id
      ? this.education.map((e) => (e.id === this.editedEducation!.id ? this.editedEducation! : e))
      : [...this.education, { ...this.editedEducation, id: crypto.randomUUID() }];

    await this.profileState.saveEducation(updated);
    this.editedEducation = undefined;
  }

  async deleteEducation(education: Education) {
    const updated = this.education.filter((e) => e.id !== education.id);
    await this.profileState.saveEducation(updated);
  }

  // ---- Projects ----
  beginProjectAdd() {
    this.editedProject = {};
  }

  editProject(project: Project) {
    this.editedProject = { ...project };
  }

  cancelProjectEdit() {
    this.editedProject = undefined;
  }

  async saveProject() {
    if (!this.editedProject) return;

    const updated = this.editedProject.id
      ? this.projects.map((p) => (p.id === this.editedProject!.id ? this.editedProject! : p))
      : [...this.projects, { ...this.editedProject, id: crypto.randomUUID() }];

    await this.profileState.saveProjects(updated);
    this.editedProject = undefined;
  }

  async deleteProject(project: Project) {
    const updated = this.projects.filter((p) => p.id !== project.id);
    await this.profileState.saveProjects(updated);
  }

  // ---- Project evidence ----

  toggleProjectDetails(project: Project) {
    this.expandedProjectId = this.expandedProjectId === project.id ? undefined : project.id;
    this.editedProjectEvidence = undefined;
  }

  beginProjectEvidenceAdd() {
    this.editedProjectEvidence = { id: '', text: '' };
  }

  editProjectEvidence(evidence: Evidence) {
    this.editedProjectEvidence = { ...evidence };
  }

  cancelProjectEvidenceEdit() {
    this.editedProjectEvidence = undefined;
  }

  async saveProjectEvidence(project: Project) {
    if (!this.editedProjectEvidence?.text) return;

    const existing = project.evidence ?? [];
    const updatedEvidence = this.editedProjectEvidence.id
      ? existing.map((ev) =>
          ev.id === this.editedProjectEvidence!.id ? this.editedProjectEvidence! : ev,
        )
      : [...existing, { ...this.editedProjectEvidence, id: crypto.randomUUID() }];

    const updated = this.projects.map((p) =>
      p.id === project.id ? { ...p, evidence: updatedEvidence } : p,
    );

    await this.profileState.saveProjects(updated);
    this.editedProjectEvidence = undefined;
  }

  async deleteProjectEvidence(project: Project, evidence: Evidence) {
    const updatedEvidence = (project.evidence ?? []).filter((ev) => ev.id !== evidence.id);

    const updated = this.projects.map((p) =>
      p.id === project.id ? { ...p, evidence: updatedEvidence } : p,
    );

    await this.profileState.saveProjects(updated);
  }

  // ---- Skills ----
  beginSkillAdd() {
    this.editedSkill = {};
    this.skillError = '';
  }

  editSkill(skill: Skill) {
    this.editedSkill = { ...skill };
    this.skillError = '';
  }

  cancelSkillEdit() {
    this.editedSkill = undefined;
    this.skillError = '';
  }

  async saveSkill() {
    if (!this.editedSkill?.name) return;

    const duplicate = this.skills.some(
      (s) =>
        s.id !== this.editedSkill!.id &&
        s.name?.trim().toLowerCase() === this.editedSkill!.name?.trim().toLowerCase(),
    );

    if (duplicate) {
      this.skillError = `"${this.editedSkill.name}" already exists — pick a different name or edit the existing skill.`;
      return;
    }

    this.skillError = '';

    const updated = this.editedSkill.id
      ? this.skills.map((s) => (s.id === this.editedSkill!.id ? this.editedSkill! : s))
      : [...this.skills, { ...this.editedSkill, id: crypto.randomUUID() }];

    await this.profileState.saveSkills(updated);
    this.editedSkill = undefined;
  }

  async deleteSkill(skill: Skill) {
    const updated = this.skills.filter((s) => s.id !== skill.id);
    await this.profileState.saveSkills(updated);
  }

  // ---- Career Profiles ----
  beginCareerProfileAdd() {
    this.editedCareerProfile = {};
  }

  editCareerProfile(careerProfile: CareerProfile) {
    this.editedCareerProfile = { ...careerProfile };
  }

  cancelCareerProfileEdit() {
    this.editedCareerProfile = undefined;
  }

  async saveCareerProfile() {
    if (!this.editedCareerProfile) return;

    const updated = this.editedCareerProfile.id
      ? this.careerProfiles.map((c) =>
          c.id === this.editedCareerProfile!.id ? this.editedCareerProfile! : c,
        )
      : [...this.careerProfiles, { ...this.editedCareerProfile, id: crypto.randomUUID() }];

    await this.profileState.saveCareerProfiles(updated);
    this.editedCareerProfile = undefined;
  }

  async deleteCareerProfile(careerProfile: CareerProfile) {
    const updated = this.careerProfiles.filter((c) => c.id !== careerProfile.id);
    await this.profileState.saveCareerProfiles(updated);
  }
}
