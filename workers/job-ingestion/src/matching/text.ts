const STOP = new Set(['the', 'and', 'for', 'with', 'of', 'an', 'in', 'to', 'at', 'on', 'or', 'is', 'are', 'we', 'you', 'our', 'your']);

export function tokens(text: string | undefined): string[] {
	return (text ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9+#]+/g, ' ')
		.split(' ')
		.filter((t) => t.length >= 2 && !STOP.has(t));
}

export function splitList(text: string | undefined): string[] {
	return (text ?? '')
		.split(/[,;/|\n]+/)
		.map((s) => s.trim())
		.filter(Boolean);
}

export function containsPhrase(haystack: string[], phrase: string[]): boolean {
	if (!phrase.length) return false;
	return ` ${haystack.join(' ')} `.includes(` ${phrase.join(' ')} `);
}
