import { Service } from '@angular/core';
import { User } from '../models/user/user.model';
import { firebaseAuth, firestore } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { Info } from '../models/user/info.model';
import { Experience } from '../models/user/career/experience.model';
import { Education } from '../models/user/career/education.model';
import { Project } from '../models/user/career/project.model';
import { Skill } from '../models/user/career/skill.model';
import { CareerProfile } from '../models/user/career/career-profile.model';

@Service()
export class UserService {
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

  async createUserDoc(uid: string, email: string): Promise<void> {
    const initialUser: Omit<User, 'id'> = {
      info: { email },
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
      info: data['info'],
      career: {
        ...data['career'],
        experience: this.normalizeDates(data['career']?.experience),
        education: this.normalizeDates(data['career']?.education),
      },
    };
  }

  async updateInfo(info: Info): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { info }, { merge: true });
  }

  async updateExperience(experience: Experience[]): Promise<void> {
    const uid = this.currentUid();
    await setDoc(this.userDoc(uid), { career: { experience } }, { merge: true });
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

  async deleteAllUserData(uid: string): Promise<void> {
    const jobsSnapshot = await getDocs(collection(this.db, 'users', uid, 'jobs'));
    const batch = writeBatch(this.db);
    jobsSnapshot.forEach((jobDoc) => batch.delete(jobDoc.ref));
    batch.delete(this.userDoc(uid));
    await batch.commit();
  }
}
