import { Service } from '@angular/core';
import { Job, JobStatus, JobUpdate } from '../models/job';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  DocumentData,
  deleteDoc,
} from 'firebase/firestore';
import { firestore, firebaseAuth } from '../../../core/firebase/firebase';
import { JobAnalysis } from '../models/job-analysis';

@Service()
export class JobRepository {
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
      department: job.department ?? '',
      source: job.source ?? '',
      keyContact: job.keyContact ?? '',
      nextAction: job.nextAction ?? '',
      dateApplied: job.dateApplied ?? null,
      jobUpdates: job.jobUpdates.map((u) => ({
        status: u.status,
        updatedAt: u.updatedAt,
        ...(u.note ? { note: u.note } : {}),
      })),
    });

    return { ...job, id: docRef.id };
  }

  async updateJobStatus(jobId: string, newStatus: JobStatus, note?: string): Promise<void> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    const jobRef = doc(this.db, 'users', uid, 'jobs', jobId);
    const update: { status: JobStatus; updatedAt: Date; note?: string } = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (note) update.note = note;

    await updateDoc(jobRef, { jobUpdates: arrayUnion(update) });
  }

  async deleteJob(jobId: string): Promise<void> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error('Cannot delete job: No user is signed in.');
    await deleteDoc(doc(this.db, 'users', uid, 'jobs', jobId));
  }

  private toDateOrNull(value: unknown): Date | null {
    if (!value) return null;
    return value instanceof Timestamp ? value.toDate() : (value as Date);
  }

  private toJob(id: string, data: DocumentData): Job {
    const jobUpdates: JobUpdate[] = (data['jobUpdates'] ?? []).map((u: any) => ({
      status: u.status,
      updatedAt: u.updatedAt instanceof Timestamp ? u.updatedAt.toDate() : u.updatedAt,
      note: u.note,
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
      applicationDeadline: this.toDateOrNull(data['applicationDeadline']),
      jobUpdates,
      generatedCv: data['generatedCv'],
      generatedCoverLetter: data['generatedCoverLetter'],
      jobAnalysis: data['jobAnalysis'] ?? null,
      jobAnalysedAt: this.toDateOrNull(data['jobAnalysedAt']),
      department: data['department'],
      dateApplied: this.toDateOrNull(data['dateApplied']),
      source: data['source'],
      keyContact: data['keyContact'],
      nextAction: data['nextAction'],
    };
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error('Cannot update job: No user is signed in.');

    const jobRef = doc(this.db, 'users', uid, 'jobs', jobId);
    await updateDoc(jobRef, updates as DocumentData);
  }

  async saveJobAnalysis(jobId: string, analysis: JobAnalysis): Promise<void> {
    await this.updateJob(jobId, { jobAnalysis: analysis, jobAnalysedAt: new Date() });
  }
}
