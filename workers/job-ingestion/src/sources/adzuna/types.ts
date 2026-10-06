export interface AdzunaJob {
	id?: string | number;
	title?: string;
	description?: string;
	created?: string;
	redirect_url?: string;
	company?: { display_name?: string };
	location?: { display_name?: string; area?: string[] };
	category?: { label?: string; tag?: string };
	contract_type?: string;
	contract_time?: string;
	salary_min?: number;
	salary_max?: number;
	salary_is_predicted?: string;
	latitude?: number;
	longitude?: number;
}

export interface AdzunaSearchResponse {
	count?: number;
	results?: AdzunaJob[];
}
