import { Service, inject } from '@angular/core';
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../../../core/firebase/firebase';
import { JobRepository } from '../../../domains/jobs/data/repositories/job.repository';
import { Job } from '../../../domains/jobs/data/models/job';
import { Recommendation } from '../models/recommendation';
import { recommendationToJob } from './recommendation.mapper';
import { DiscoveryPreferences, resolveSources } from '../models/discovery-sources';

@Service()
export class DiscoveryRepository {
  private jobRepository = inject(JobRepository);

  private currentUid(): string {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error('Cannot access discovery: No user is signed in.');
    return uid;
  }

  private stateRef(uid: string) {
    return doc(firestore, 'users', uid, 'discovery', 'state');
  }

  async loadPreferences(): Promise<DiscoveryPreferences> {
    const data = (await getDoc(this.stateRef(this.currentUid()))).data();
    return { enabled: data?.['enabled'] === true, sources: resolveSources(data?.['sources']) };
  }

  async setSources(sources: string[]): Promise<void> {
    await setDoc(this.stateRef(this.currentUid()), { sources }, { merge: true });
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await setDoc(
      this.stateRef(this.currentUid()),
      { enabled, lastActiveAt: serverTimestamp() },
      { merge: true },
    );
  }

  async touchActive(): Promise<void> {
    await setDoc(
      this.stateRef(this.currentUid()),
      { lastActiveAt: serverTimestamp() },
      { merge: true },
    );
  }

  async saveRecommendation(rec: Recommendation): Promise<Job> {
    if (!rec.id) throw new Error('Cannot save a recommendation without an id.');
    const uid = this.currentUid();

    const batch = writeBatch(firestore);
    const job = this.jobRepository.addJobInBatch(batch, recommendationToJob(rec));
    batch.set(this.stateRef(uid), { saved: { [rec.id]: serverTimestamp() } }, { merge: true });
    batch.delete(doc(firestore, 'users', uid, 'recommendations', rec.id));
    await batch.commit();

    return job;
  }

  async dismissRecommendation(rec: Recommendation): Promise<void> {
    if (!rec.id) throw new Error('Cannot dismiss a recommendation without an id.');
    const uid = this.currentUid();

    const batch = writeBatch(firestore);
    batch.set(this.stateRef(uid), { dismissed: { [rec.id]: serverTimestamp() } }, { merge: true });
    batch.delete(doc(firestore, 'users', uid, 'recommendations', rec.id));
    await batch.commit();
  }
}
