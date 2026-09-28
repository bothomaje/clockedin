import { Service } from '@angular/core';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { firestore, firebaseAuth } from '../../../core/firebase/firebase';
import {
  GeneratedDocument,
  GeneratedDocumentType,
  NewGeneratedDocument,
} from '../models/generated-document';

@Service()
export class DocumentRepository {
  private db = firestore;

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
