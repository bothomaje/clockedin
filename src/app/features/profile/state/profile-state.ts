import { Service, inject, signal, computed } from '@angular/core';
import { ProfileRepository } from '../data/profile.repository';
import { User } from '../models/user';
import { Info } from '../models/info';
import { Experience } from '../models/experience';
import { Education } from '../models/education';
import { Project } from '../models/project';
import { Skill } from '../models/skill';
import { CareerProfile } from '../models/career-profile';
import { DocTemplates } from '../models/doc-templates';

@Service()
export class ProfileState {
  private profileRepository = inject(ProfileRepository);

  private infoSignal = signal<Info>({ email: '' });
  private experienceSignal = signal<Experience[]>([]);
  private educationSignal = signal<Education[]>([]);
  private projectsSignal = signal<Project[]>([]);
  private skillsSignal = signal<Skill[]>([]);
  private careerProfilesSignal = signal<CareerProfile[]>([]);
  private templatesSignal = signal<DocTemplates | undefined>(undefined);
  private aiConsentAtSignal = signal<Date | null>(null);
  private onboardingCompleteSignal = signal(false);
  private loadingSignal = signal(false);
  private errorSignal = signal('');

  info = this.infoSignal.asReadonly();
  experience = this.experienceSignal.asReadonly();
  education = this.educationSignal.asReadonly();
  projects = this.projectsSignal.asReadonly();
  skills = this.skillsSignal.asReadonly();
  careerProfiles = this.careerProfilesSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  onboardingComplete = this.onboardingCompleteSignal.asReadonly();

  user = computed<User>(() => ({
    info: this.infoSignal(),
    career: {
      experience: this.experienceSignal(),
      education: this.educationSignal(),
      projects: this.projectsSignal(),
      skills: this.skillsSignal(),
      careerProfiles: this.careerProfilesSignal(),
    },
    templates: this.templatesSignal(),
    aiConsentAt: this.aiConsentAtSignal(),
  }));

  async load(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set('');

    try {
      const user = await this.profileRepository.getUser();
      this.infoSignal.set(user?.info ?? { email: '' });
      this.experienceSignal.set(user?.career?.experience ?? []);
      this.educationSignal.set(user?.career?.education ?? []);
      this.projectsSignal.set(user?.career?.projects ?? []);
      this.skillsSignal.set(user?.career?.skills ?? []);
      this.careerProfilesSignal.set(user?.career?.careerProfiles ?? []);
      this.templatesSignal.set(user?.templates);
      this.aiConsentAtSignal.set(user?.aiConsentAt ?? null);
      this.onboardingCompleteSignal.set(user?.onboardingComplete ?? false);
    } catch {
      this.errorSignal.set('Could not load your career data.');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async completeOnboarding(): Promise<void> {
    await this.profileRepository.markOnboardingComplete();
    this.onboardingCompleteSignal.set(true);
  }

  async recordAiConsent(): Promise<void> {
    await this.profileRepository.recordAiConsent();
    this.aiConsentAtSignal.set(new Date());
  }

  async revokeAiConsent(): Promise<void> {
    await this.profileRepository.revokeAiConsent();
    this.aiConsentAtSignal.set(null);
  }

  async createProfile(uid: string, email: string, name?: string): Promise<void> {
    await this.profileRepository.createUserDoc(uid, email, name);
  }

  async deleteAllData(): Promise<void> {
    await this.profileRepository.deleteAllUserData();
  }

  async saveInfo(info: Info): Promise<void> {
    await this.profileRepository.updateInfo(info);
    this.infoSignal.set(info);
  }

  async saveExperience(experience: Experience[]): Promise<void> {
    await this.profileRepository.updateExperience(experience);
    this.experienceSignal.set(experience);
  }

  async saveEducation(education: Education[]): Promise<void> {
    await this.profileRepository.updateEducation(education);
    this.educationSignal.set(education);
  }

  async saveProjects(projects: Project[]): Promise<void> {
    await this.profileRepository.updateProjects(projects);
    this.projectsSignal.set(projects);
  }

  async saveSkills(skills: Skill[]): Promise<void> {
    await this.profileRepository.updateSkills(skills);
    this.skillsSignal.set(skills);
  }

  async saveCareerProfiles(careerProfiles: CareerProfile[]): Promise<void> {
    await this.profileRepository.updateCareerProfiles(careerProfiles);
    this.careerProfilesSignal.set(careerProfiles);
  }
}
