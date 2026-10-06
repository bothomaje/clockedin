import { Service } from '@angular/core';
import { User } from '../models/user';
import { firebaseAuth, firestore } from '../../../core/firebase/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { Info } from '../models/info';
import { Experience } from '../models/experience';
import { Education } from '../models/education';
import { Project } from '../models/project';
import { Skill } from '../models/skill';
import { CareerProfile } from '../models/career-profile';
import { DocTemplates } from '../models/doc-templates';
import { readStoredLocation, toStoredLocation } from '../../../shared/location/location.model';

@Service()
export class ProfileRepository {
  private db = firestore;

  private userDoc(uid: string) {
    return doc(this.db, 'users', uid);
  }

  private currentUid(): string {
    const uid = firebaseAuth.currentUser?.uid;

    if (!uid) {
      throw new Error('Cannot access user. No user is signed in.');
    }
    return uid;
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    return value instanceof Timestamp ? value.toDate() : (value as Date);
  }

  private normalizeDates<T extends { startDate?: unknown; endDate?: unknown }>(
    items: T[] = [],
  ): T[] {
    return items.map((item) => ({
      ...item,
      startDate: this.toDate(item.startDate),
      endDate: this.toDate(item.endDate),
    }));
  }

  private withLocation<T extends { location?: unknown }>(item: T) {
    const { location: raw, ...rest } = item;
    return { ...rest, ...readStoredLocation(raw) };
  }

  async createUserDoc(uid: string, email: string, name?: string): Promise<void> {
    const initialUser: Omit<User, 'id'> = {
      info: { email, ...(name?.trim() ? { name: name.trim() } : {}) },
      career: {
        experience: [],
        education: [],
        projects: [],
        skills: [],
        careerProfiles: [],
      },
    };

    await setDoc(this.userDoc(uid), initialUser);
  }

  async getUser(): Promise<User | undefined> {
    const uid = this.currentUid();
    const snapshot = await getDoc(this.userDoc(uid));

    if (!snapshot.exists()) {
      return undefined;
    }

    const data = snapshot.data();

    return {
      id: snapshot.id,
      info: this.withLocation(data['info'] ?? {}) as Info,
      templates: data['templates'] ?? {},
      onboardingComplete: data['onboardingComplete'] ?? false,
      aiConsentAt:
        data['aiConsentAt'] instanceof Timestamp
          ? data['aiConsentAt'].toDate()
          : (data['aiConsentAt'] ?? null),
      career: {
        ...data['career'],
        experience: this.normalizeDates<Experience>(data['career']?.experience).map((e) =>
          this.withLocation(e),
        ) as Experience[],
        education: this.normalizeDates(data['career']?.education),
      },
    };
  }

  async updateInfo(info: Info): Promise<void> {
    const uid = this.currentUid();
    const { legacyLocation, ...rest } = info;
    const stored = { ...rest, location: toStoredLocation({ ...info, legacyLocation }) };
    await setDoc(this.userDoc(uid), { info: stored }, { merge: true });
  }

  async updateExperience(experience: Experience[]): Promise<void> {
    const uid = this.currentUid();
    const stored = experience.map(({ legacyLocation, ...rest }) => ({
      ...rest,
      location: toStoredLocation({ ...rest, legacyLocation }),
      workMode: rest.workMode ?? null,
    }));
    await setDoc(this.userDoc(uid), { career: { experience: stored } }, { merge: true });
  }

  async updateEducation(education: Education[]): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { career: { education } }, { merge: true });
  }

  async updateProjects(projects: Project[]): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { career: { projects } }, { merge: true });
  }

  async updateSkills(skills: Skill[]): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { career: { skills } }, { merge: true });
  }

  async updateCareerProfiles(careerProfiles: CareerProfile[]): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { career: { careerProfiles } }, { merge: true });
  }

  async updateTemplates(templates: DocTemplates): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { templates }, { merge: true });
  }

  async deleteAllUserData(): Promise<void> {
    const uid = this.currentUid();
    const jobsSnapshot = await getDocs(collection(this.db, 'users', uid, 'jobs'));

    for (const jobDoc of jobsSnapshot.docs) {
      const genDocsSnapshot = await getDocs(
        collection(this.db, 'users', uid, 'jobs', jobDoc.id, 'generatedDocuments'),
      );

      const batch = writeBatch(this.db);
      genDocsSnapshot.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(jobDoc.ref);
      await batch.commit();
    }

    await deleteDoc(doc(this.db, 'users', uid));
  }

  async recordAiConsent(): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { aiConsentAt: new Date() }, { merge: true });
  }

  async revokeAiConsent(): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { aiConsentAt: null }, { merge: true });
  }

  async markOnboardingComplete(): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { onboardingComplete: true }, { merge: true });
  }
}
