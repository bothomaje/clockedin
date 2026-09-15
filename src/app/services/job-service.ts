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
  query,
  orderBy,
} from 'firebase/firestore';
import { firestore, firebaseAuth } from '../firebase';
import { JobAnalysis } from '../models/job-analysis.model';
import {
  GeneratedDocument,
  GeneratedDocumentType,
  NewGeneratedDocument,
} from '../models/ai/generated-document.model';

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
      generatedCv: data['generatedCv'],
      generatedCoverLetter: data['generatedCoverLetter'],
      jobAnalysis: data['jobAnalysis'] ?? null,
      jobAnalysedAt:
        data['jobAnalysedAt'] instanceof Timestamp
          ? data['jobAnalysedAt'].toDate()
          : (data['jobAnalysedAt'] ?? null),
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

  private generatedDocumentsCollection(jobId: string) {
    const uid = firebaseAuth.currentUser?.uid;

    if (!uid) {
      throw new Error('Cannot access generated documents: No user is signed in.');
    }

    return collection(this.db, 'users', uid, 'jobs', jobId, 'generatedDocuments');
  }

  async getGeneratedDocuments(
    jobId: string,
    type?: GeneratedDocumentType,
  ): Promise<GeneratedDocument[]> {
    const snapshot = await getDocs(
      query(this.generatedDocumentsCollection(jobId), orderBy('version', 'desc')),
    );

    return snapshot.docs
      .map((d) => this.toGeneratedDocument(d.id, d.data()))
      .filter((document) => !type || document.type === type);
  }

  async saveGeneratedDocument(
    jobId: string,
    input: NewGeneratedDocument,
  ): Promise<GeneratedDocument> {
    const existing = await this.getGeneratedDocuments(jobId, input.type);
    const version = existing.reduce((max, d) => Math.max(max, d.version), 0) + 1;

    const payload = {
      type: input.type,
      version,
      content: input.content,
      structured: input.structured ?? null,
      validation: input.validation ?? null,
      careerProfileId: input.careerProfileId ?? null,
      evidenceFactIds: input.evidenceFactIds ?? [],
      jobAnalysis: input.jobAnalysis ?? null,
      model: input.model,
      generatedAt: new Date(),
    };

    const docRef = await addDoc(this.generatedDocumentsCollection(jobId), payload);
    return { ...payload, id: docRef.id };
  }

  private toGeneratedDocument(id: string, data: DocumentData): GeneratedDocument {
    return {
      id,
      type: data['type'],
      version: data['version'] ?? 0,
      content: data['content'] ?? '',
      structured: data['structured'] ?? null,
      validation: data['validation'] ?? null,
      careerProfileId: data['careerProfileId'] ?? null,
      evidenceFactIds: data['evidenceFactIds'] ?? [],
      jobAnalysis: data['jobAnalysis'] ?? null,
      model: data['model'] ?? '',
      generatedAt:
        data['generatedAt'] instanceof Timestamp
          ? data['generatedAt'].toDate()
          : data['generatedAt'],
    };
  }
}
