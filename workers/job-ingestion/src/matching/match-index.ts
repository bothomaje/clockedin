import type { MatchingProfile } from './profile';

export class MatchIndex {
	private readonly byToken = new Map<string, Set<number>>();

	constructor(private readonly profiles: MatchingProfile[]) {
		profiles.forEach((p, i) => {
			for (const phrase of [...p.roles, ...p.skills]) {
				for (const t of phrase) {
					const set = this.byToken.get(t) ?? new Set<number>();
					set.add(i);
					this.byToken.set(t, set);
				}
			}
		});
	}

	candidates(jobTokens: string[]): MatchingProfile[] {
		const hits = new Set<number>();
		for (const t of new Set(jobTokens)) this.byToken.get(t)?.forEach((i) => hits.add(i));
		return [...hits].map((i) => this.profiles[i]);
	}

	withoutSignals(): MatchingProfile[] {
		return this.profiles.filter((p) => !p.roles.length && !p.skills.length);
	}
}
