import { Service } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
} from 'firebase/firestore';
import { firebaseAuth, firestore } from '../../../core/firebase/firebase';
import { Recommendation } from '../models/recommendation';
import { toRecommendation } from './recommendation.mapper';

export type ExploreSort = 'score' | 'postedAt';
export const EXPLORE_PAGE_SIZE = 25;

export interface RecommendationPage {
  items: Recommendation[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

@Service()
export class RecommendationRepository {
  private uid(): string {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error('Cannot read recommendations: No user is signed in.');
    return uid;
  }

  async getPage(
    sort: ExploreSort,
    after: QueryDocumentSnapshot | null,
  ): Promise<RecommendationPage> {
    const field = sort === 'score' ? 'score' : 'job.postedAt';
    const col = collection(firestore, 'users', this.uid(), 'recommendations');
    const q = after
      ? query(col, orderBy(field, 'desc'), startAfter(after), limit(EXPLORE_PAGE_SIZE))
      : query(col, orderBy(field, 'desc'), limit(EXPLORE_PAGE_SIZE));
    const snap = await getDocs(q);
    return {
      items: snap.docs.map((d) => toRecommendation(d.id, d.data())),
      cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.size === EXPLORE_PAGE_SIZE,
    };
  }

  async get(id: string): Promise<Recommendation | undefined> {
    const snap = await getDoc(doc(firestore, 'users', this.uid(), 'recommendations', id));
    return snap.exists() ? toRecommendation(snap.id, snap.data()) : undefined;
  }
}
