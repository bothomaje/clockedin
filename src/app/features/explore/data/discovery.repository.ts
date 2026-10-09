import { Service, inject } from '@angular/core';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../../../core/firebase/firebase';
import { JobRepository } from '../../jobs/data/job.repository';
import { Job } from '../../jobs/models/job';
import { Recommendation } from '../models/recommendation';
import { recommendationToJob } from './recommendation.mapper';

@Service()
export class DiscoveryRepository {
  private jobRepository = inject(JobRepository);

  private currentUid(): string {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error('Cannot save recommendation: No user is signed in.');
    return uid;
  }

  async saveRecommendation(rec: Recommendation): Promise<Job> {
    if (!rec.id) throw new Error('Cannot save a recommendation without an id.');
    const uid = this.currentUid();

    const batch = writeBatch(firestore);
    const job = this.jobRepository.addJobInBatch(batch, recommendationToJob(rec));
    batch.set(
      doc(firestore, 'users', uid, 'discovery', 'state'),
      { saved: { [rec.id]: serverTimestamp() } },
      { merge: true },
    );
    batch.delete(doc(firestore, 'users', uid, 'recommendations', rec.id));
    await batch.commit();

    return job;
  }
}
