import { Service } from '@angular/core';
import { Job, JobStatus, JobUpdate } from '../models/job.model';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { firestore, firebaseAuth } from '../firebase';

@Service()
export class JobService {
  private db = firestore;

  private jobsCollection() {
    const uid = firebaseAuth.currentUser?.uid;

    if (!uid) {
      throw new Error('Cannot access jobs: No user is signed in.');
    }

    return collection(this.db, 'users', uid, 'jobs');
  }

  async getJobs(): Promise<Job[]> {
    const snapshot = await getDocs(this.jobsCollection());

    return snapshot.docs.map((d) => this.toJob(d.id, d.data()));
  }

  async addJob(job: Job): Promise<Job> {
    const docRef = await addDoc(this.jobsCollection(), {
      company: job.company ?? '',
      role: job.role ?? '',
      jobDescription: job.jobDescription ?? '',
      url: job.url ?? '',
      location: job.location ?? '',
      employmentType: job.employmentType ?? '',
      salary: job.salary ?? '',
      notes: job.notes ?? '',
      applicationDeadline: job.applicationDeadline ?? null,
      jobUpdates: job.jobUpdates.map((u) => ({
        status: u.status,
        updatedAt: u.updatedAt,
      })),
    });

    return { ...job, id: docRef.id };
  }

  async updateJobStatus(jobId: string, newStatus: JobStatus): Promise<Job | undefined> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return undefined;

    const jobRef = doc(this.db, 'users', uid, 'jobs', jobId);
    await updateDoc(jobRef, {
      jobUpdates: arrayUnion({ status: newStatus, updatedAt: new Date() }),
    });
    return undefined;
  }

  private toJob(id: string, data: DocumentData): Job {
    const jobUpdates: JobUpdate[] = (data['jobUpdates'] ?? []).map((u: any) => ({
      status: u.status,
      updatedAt: u.updatedAt instanceof Timestamp ? u.updatedAt.toDate() : u.updatedAt,
    }));

    return {
      id,
      company: data['company'],
      role: data['role'],
      jobDescription: data['jobDescription'] ?? '',
      url: data['url'],
      location: data['location'],
      employmentType: data['employmentType'],
      salary: data['salary'],
      notes: data['notes'],
      applicationDeadline:
        data['applicationDeadline'] instanceof Timestamp
          ? data['applicationDeadline'].toDate()
          : data['applicationDeadline'],
      jobUpdates,
    };
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error('Cannot update job: No user is signed in.');

    const jobRef = doc(this.db, 'users', uid, 'jobs', jobId);
    await updateDoc(jobRef, updates as DocumentData);
  }
}
