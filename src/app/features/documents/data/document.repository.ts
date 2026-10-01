import { Service } from '@angular/core';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  DocumentData,
  updateDoc,
  doc,
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
      options: input.options ?? null,
      editedAt: null,
    };

    const docRef = await addDoc(this.generatedDocumentsCollection(jobId), payload);
    return { ...payload, id: docRef.id };
  }

  async updateGeneratedDocument(
    jobId: string,
    documentId: string,
    changes: Pick<GeneratedDocument, 'content' | 'structured' | 'validation'>,
  ): Promise<Date> {
    const editedAt = new Date();

    await updateDoc(doc(this.generatedDocumentsCollection(jobId), documentId), {
      content: changes.content,
      structured: changes.structured ?? null,
      validation: changes.validation ?? null,
      editedAt,
    });

    return editedAt;
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    return value instanceof Timestamp ? value.toDate() : (value as Date);
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
      generatedAt: this.toDate(data['generatedAt']) ?? new Date(),
      options: data['options'] ?? null,
      editedAt: this.toDate(data['editedAt']),
    };
  }
}
