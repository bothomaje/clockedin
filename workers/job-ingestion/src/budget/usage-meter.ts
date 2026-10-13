export type Resource = 'requests' | 'reads' | 'writes' | 'deletes';
export type Caps = Record<Resource, number>;

export class BudgetExceededError extends Error {
	constructor(
		readonly resource: Resource,
		readonly cap: number,
	) {
		super(`Run budget exceeded: ${resource} cap ${cap}`);
	}
}

export class UsageMeter {
	private readonly used: Caps = { requests: 0, reads: 0, writes: 0, deletes: 0 };

	constructor(readonly caps: Caps) {}

	remaining(resource: Resource): number {
		return Math.max(0, this.caps[resource] - this.used[resource]);
	}

	guard(resource: Resource): void {
		if (this.used[resource] >= this.caps[resource]) throw new BudgetExceededError(resource, this.caps[resource]);
	}

	reserve(resource: Resource, count: number): void {
		if (this.used[resource] + count > this.caps[resource]) throw new BudgetExceededError(resource, this.caps[resource]);
		this.used[resource] += count;
	}

	charge(resource: Resource, count = 1): void {
		this.used[resource] += count;
	}

	snapshot(): { used: Caps; caps: Caps } {
		return { used: { ...this.used }, caps: { ...this.caps } };
	}
}
