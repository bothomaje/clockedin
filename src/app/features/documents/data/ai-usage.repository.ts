import { firebaseAuth, firestore } from '../../../core/firebase/firebase';
import { Service } from '@angular/core';
import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

@Service()
export class AiUsageRepository {
  private db = firestore;

  private usageDoc() {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error('No user is signed in.');
    return doc(this.db, 'users', uid, 'meta', 'aiUsage');
  }

  async checkAndRecord(): Promise<void> {
    const ref = this.usageDoc();

    await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const data = snap.exists() ? snap.data() : null;
      const windowStart = (data?.['windowStart'] as Timestamp | undefined)?.toMillis() ?? 0;

      const withinWindow = now - windowStart < WINDOW_MS;
      const count = withinWindow ? (data?.['count'] ?? 0) : 0;

      if (withinWindow && count >= MAX_PER_WINDOW) {
        throw new Error(
          `AI generation limit reached (${MAX_PER_WINDOW} per hour). Try again later.`,
        );
      }

      tx.set(ref, {
        windowStart: withinWindow ? (data?.['windowStart'] ?? Timestamp.now()) : Timestamp.now(),
        count: count + 1,
      });
    });
  }

  async getStatus(): Promise<{ remaining: number; resetAt: Date | null }> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return { remaining: MAX_PER_WINDOW, resetAt: null };

    const snap = await getDoc(this.usageDoc());
    const data = snap.exists() ? snap.data() : null;
    const windowStart = (data?.['windowStart'] as Timestamp | undefined)?.toMillis() ?? 0;
    const withinWindow = Date.now() - windowStart < WINDOW_MS;
    const count = withinWindow ? (data?.['count'] ?? 0) : 0;

    return {
      remaining: Math.max(0, MAX_PER_WINDOW - count),
      resetAt: withinWindow ? new Date(windowStart + WINDOW_MS) : null,
    };
  }
}
