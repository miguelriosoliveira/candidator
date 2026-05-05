import type {
	ApiResponse,
	CandidatesResponse,
	Candidate,
	CreateCandidateInput,
	UpdateCandidateInput,
} from '../types';
import { env } from '../env';

const API_URL = env.VITE_API_URL;

type ErrorBody = { status?: number; errors?: string[] };

async function parseWriteResponse<T>(response: Response): Promise<ApiResponse<T>> {
	const body = (await response.json()) as ApiResponse<T> | ErrorBody;

	if (!response.ok) {
		const errs = Array.isArray((body as ErrorBody).errors)
			? (body as ErrorBody).errors!.join(', ')
			: null;
		throw new Error(errs ?? `${response.status} ${response.statusText}`);
	}

	return body as ApiResponse<T>;
}

export const candidateRepository = {
	async getCandidates(page?: number): Promise<ApiResponse<CandidatesResponse>> {
		const url = new URL(`${API_URL}/candidates`);
		if (page) {
			url.searchParams.append('page', page.toString());
		}
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Error fetching candidates: ${response.statusText}`);
		}
		return response.json();
	},

	async getCandidate(id: number): Promise<ApiResponse<Candidate>> {
		const response = await fetch(`${API_URL}/candidates/${id}`);
		if (!response.ok) {
			throw new Error(`Error fetching candidate: ${response.statusText}`);
		}
		return response.json();
	},

	async createCandidate(payload: CreateCandidateInput): Promise<ApiResponse<Candidate>> {
		const response = await fetch(`${API_URL}/candidates`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		return parseWriteResponse<Candidate>(response);
	},

	async updateCandidate(id: number, payload: UpdateCandidateInput): Promise<ApiResponse<Candidate>> {
		const response = await fetch(`${API_URL}/candidates/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		return parseWriteResponse<Candidate>(response);
	},
};
