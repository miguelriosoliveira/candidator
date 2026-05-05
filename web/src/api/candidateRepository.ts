import type { ApiResponse, CandidatesResponse, Candidate } from '../types';
import { env } from '../env';

const API_URL = env.VITE_API_URL;

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
};
