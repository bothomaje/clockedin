import { Experience } from '../../models/user/career/experience.model';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user-service';
import { Info } from '../../models/user/info.model';
import { Education } from '../../models/user/career/education.model';
import { Project } from '../../models/user/career/project.model';
import { Skill } from '../../models/user/career/skill.model';
import { CareerProfile } from '../../models/user/career/career-profile.model';
import { Evidence } from '../../models/user/career/evidence.model';

@Component({
  imports: [FormsModule],
  selector: 'app-profile',
  // styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  errorMessage = '';
  skillError = '';

  info: Info = { email: '' };
  experience: Experience[] = [];
  education: Education[] = [];
  projects: Project[] = [];
  skills: Skill[] = [];
  careerProfiles: CareerProfile[] = [];

  editedExperience?: Experience;
  editedEducation?: Education;
  editedProject?: Project;
  editedSkill?: Skill;
  editedCareerProfile?: CareerProfile;

  expandedExperienceId?: string;
  editedExperienceEvidence?: Evidence;

  expandedProjectId?: string;
  editedProjectEvidence?: Evidence;

  async ngOnInit() {
    try {
      const user = await this.userService.getUser();
      this.info = user?.info ?? { email: '' };
      this.experience = user?.career.experience ?? [];
      this.education = user?.career?.education ?? [];
      this.projects = user?.career?.projects ?? [];
      this.skills = user?.career?.skills ?? [];
      this.careerProfiles = user?.career?.careerProfiles ?? [];
    } catch {
      this.errorMessage = 'Could not load your career data.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
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

  async saveInfo() {
    await this.userService.updateInfo(this.info);
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

    if (this.editedExperience.id) {
      this.experience = this.experience.map((e) =>
        e.id === this.editedExperience!.id ? this.editedExperience! : e,
      );
    } else {
      this.experience = [...this.experience, { ...this.editedExperience, id: crypto.randomUUID() }];
    }

    await this.userService.updateExperience(this.experience);
    this.editedExperience = undefined;
  }

  async deleteExperience(experience: Experience) {
    this.experience = this.experience.filter((e) => e.id !== experience.id);
    await this.userService.updateExperience(this.experience);
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
    const updated = this.editedExperienceEvidence.id
      ? existing.map((ev) =>
          ev.id === this.editedExperienceEvidence!.id ? this.editedExperienceEvidence! : ev,
        )
      : [...existing, { ...this.editedExperienceEvidence, id: crypto.randomUUID() }];

    this.experience = this.experience.map((e) =>
      e.id === experience.id ? { ...e, evidence: updated } : e,
    );

    await this.userService.updateExperience(this.experience);
    this.editedExperienceEvidence = undefined;
  }

  async deleteExperienceEvidence(experience: Experience, evidence: Evidence) {
    const updated = (experience.evidence ?? []).filter((ev) => ev.id !== evidence.id);

    this.experience = this.experience.map((e) =>
      e.id === experience.id ? { ...e, evidence: updated } : e,
    );

    await this.userService.updateExperience(this.experience);
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

    if (this.editedEducation.id) {
      this.education = this.education.map((e) =>
        e.id === this.editedEducation!.id ? this.editedEducation! : e,
      );
    } else {
      this.education = [...this.education, { ...this.editedEducation, id: crypto.randomUUID() }];
    }

    await this.userService.updateEducation(this.education);
    this.editedEducation = undefined;
  }

  async deleteEducation(education: Education) {
    this.education = this.education.filter((e) => e.id !== education.id);
    await this.userService.updateEducation(this.education);
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

    if (this.editedProject.id) {
      this.projects = this.projects.map((p) =>
        p.id === this.editedProject!.id ? this.editedProject! : p,
      );
    } else {
      this.projects = [...this.projects, { ...this.editedProject, id: crypto.randomUUID() }];
    }

    await this.userService.updateProjects(this.projects);
    this.editedProject = undefined;
  }

  async deleteProject(project: Project) {
    this.projects = this.projects.filter((p) => p.id !== project.id);
    await this.userService.updateProjects(this.projects);
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
    const updated = this.editedProjectEvidence.id
      ? existing.map((ev) =>
          ev.id === this.editedProjectEvidence!.id ? this.editedProjectEvidence! : ev,
        )
      : [...existing, { ...this.editedProjectEvidence, id: crypto.randomUUID() }];

    this.projects = this.projects.map((p) =>
      p.id === project.id ? { ...p, evidence: updated } : p,
    );

    await this.userService.updateProjects(this.projects);
    this.editedProjectEvidence = undefined;
  }

  async deleteProjectEvidence(project: Project, evidence: Evidence) {
    const updated = (project.evidence ?? []).filter((ev) => ev.id !== evidence.id);

    this.projects = this.projects.map((p) =>
      p.id === project.id ? { ...p, evidence: updated } : p,
    );

    await this.userService.updateProjects(this.projects);
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

    if (this.editedSkill.id) {
      this.skills = this.skills.map((s) => (s.id === this.editedSkill!.id ? this.editedSkill! : s));
    } else {
      this.skills = [...this.skills, { ...this.editedSkill, id: crypto.randomUUID() }];
    }

    await this.userService.updateSkills(this.skills);
    this.editedSkill = undefined;
  }

  async deleteSkill(skill: Skill) {
    this.skills = this.skills.filter((s) => s.id !== skill.id);
    await this.userService.updateSkills(this.skills);
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

    if (this.editedCareerProfile.id) {
      this.careerProfiles = this.careerProfiles.map((c) =>
        c.id === this.editedCareerProfile!.id ? this.editedCareerProfile! : c,
      );
    } else {
      this.careerProfiles = [
        ...this.careerProfiles,
        { ...this.editedCareerProfile, id: crypto.randomUUID() },
      ];
    }

    await this.userService.updateCareerProfiles(this.careerProfiles);
    this.editedCareerProfile = undefined;
  }

  async deleteCareerProfile(careerProfile: CareerProfile) {
    this.careerProfiles = this.careerProfiles.filter((c) => c.id !== careerProfile.id);
    await this.userService.updateCareerProfiles(this.careerProfiles);
  }
}
