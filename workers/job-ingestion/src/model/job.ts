export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export interface Location {
	formatted: string;
	city?: string;
	region?: string;
	country?: string;
	countryCode?: string;
	latitude: number;
	longitude: number;
	placeId?: string;
}

export type JobStatus = 'new' | 'applied' | 'interview' | 'offer' | 'rejected' | 'accepted' | 'withdrawn' | 'archived';

export interface JobUpdate {
	status: JobStatus;
	updatedAt: Date;
	note?: string;
}

export interface Job {
	id?: string;
	company?: string;
	role?: string;
	jobDescription: string;
	url?: string;
	location?: Location | null;
	legacyLocation?: string;
	workMode?: WorkMode | null;
	employmentType?: string;
	salary?: string;
	notes?: string;
	applicationDeadline?: Date | null;
	jobUpdates: JobUpdate[];
	contact?: string;
	source?: {
		provider: string;
		externalId: string;
		url: string;
	};
	origin?: 'manual' | 'imported';
	postedAt?: Date | null;
}
