import type { ApiResponse, CandidatesResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
};
