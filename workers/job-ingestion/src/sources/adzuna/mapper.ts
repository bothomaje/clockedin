import type { Job, Location } from '../../model/job';
import type { AdzunaJob } from './types';

const EMPLOYMENT_TIME: Record<string, string> = { full_time: 'Full-time', part_time: 'Part-time' };
const EMPLOYMENT_TYPE: Record<string, string> = { permanent: 'Permanent', contract: 'Contract' };

function clean(text: string | undefined): string {
	return (text ?? '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function money(n: number): string {
	return `R${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

function formatSalary(job: AdzunaJob): string | undefined {
	if (job.salary_is_predicted === '1') return undefined;
	const min = typeof job.salary_min === 'number' && job.salary_min > 0 ? job.salary_min : undefined;
	const max = typeof job.salary_max === 'number' && job.salary_max > 0 ? job.salary_max : undefined;
	if (min && max) return min === max ? `${money(min)} p.a.` : `${money(min)} - ${money(max)} p.a.`;
	if (min) return `From ${money(min)} p.a.`;
	if (max) return `Up to ${money(max)} p.a.`;
	return undefined;
}

function mapLocation(job: AdzunaJob): Pick<Job, 'location' | 'legacyLocation'> {
	const formatted = clean(job.location?.display_name);
	if (!formatted) return {};
	const { latitude, longitude } = job;
	if (typeof latitude !== 'number' || typeof longitude !== 'number') return { legacyLocation: formatted };

	// Adzuna area order: country, province, ..., city
	const area = (job.location?.area ?? []).filter((a): a is string => typeof a === 'string');
	const location: Location = {
		formatted,
		country: 'South Africa',
		countryCode: 'ZA',
		latitude,
		longitude,
		...(area[1] ? { region: area[1] } : {}),
		...(area.length > 2 ? { city: area[area.length - 1] } : {}),
	};
	return { location };
}

function mapEmploymentType(job: AdzunaJob): string | undefined {
	const parts = [EMPLOYMENT_TIME[job.contract_time ?? ''], EMPLOYMENT_TYPE[job.contract_type ?? '']].filter(Boolean);
	return parts.length ? parts.join(', ') : undefined;
}

function parseDate(value: string | undefined): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function mapAdzunaJob(job: AdzunaJob): Job {
	const url = typeof job.redirect_url === 'string' ? job.redirect_url.trim() : '';
	return {
		company: clean(job.company?.display_name),
		role: clean(job.title),
		jobDescription: clean(job.description),
		url,
		...mapLocation(job),
		workMode: null,
		employmentType: mapEmploymentType(job),
		salary: formatSalary(job),
		jobUpdates: [],
		source: {
			provider: 'adzuna',
			externalId: job.id === undefined || job.id === null ? '' : String(job.id),
			url,
		},
		origin: 'imported',
		externalStatus: 'active',
		postedAt: parseDate(job.created),
	};
}
