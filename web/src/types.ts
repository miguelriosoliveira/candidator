export interface Candidate {
	id: number;
	first_name: string;
	last_name: string;
	picture: string;
	phone: string;
	email: string;
	skills: string[];
}

export type CreateCandidateInput = Omit<Candidate, 'id'>;
export type UpdateCandidateInput = CreateCandidateInput;

export interface PaginationData {
	per_page: number;
	page: number;
	total_pages: number;
}

export interface CandidatesResponse {
	total: number;
	candidates: Candidate[];
	pagination: PaginationData;
}

export interface ApiResponse<T> {
	status: number;
	data: T;
	errors?: string[];
}
