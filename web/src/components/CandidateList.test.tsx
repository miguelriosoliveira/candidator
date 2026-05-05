import { render, screen, waitFor } from '@testing-library/react';
import { CandidateList } from './CandidateList';
import { candidateRepository } from '../api/candidateRepository';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repository so we don't make real network calls
vi.mock('../api/candidateRepository', () => ({
	candidateRepository: {
		getCandidates: vi.fn(),
	},
}));

describe('CandidateList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading state initially', () => {
		// Return a never-resolving promise to keep it in a loading state
		vi.mocked(candidateRepository.getCandidates).mockReturnValue(new Promise(() => {}));

		render(<CandidateList />);
		expect(screen.getByText('Loading candidates...')).toBeInTheDocument();
	});

	it('renders error state when the API fails', async () => {
		vi.mocked(candidateRepository.getCandidates).mockRejectedValue(new Error('Network Error'));

		render(<CandidateList />);

		await waitFor(() => {
			expect(screen.getByText('Error: Network Error')).toBeInTheDocument();
		});
	});

	it('renders candidates successfully', async () => {
		const mockResponse = {
			status: 200,
			data: {
				total: 10,
				candidates: [
					{
						id: 1,
						first_name: 'Alice',
						last_name: 'Smith',
						email: 'alice@example.com',
						phone: '000-0000',
						picture: 'https://example.com/alice.jpg',
						skills: ['Go', 'React'],
					},
				],
				pagination: {
					per_page: 25,
					page: 1,
					total_pages: 1,
				},
			},
		};

		vi.mocked(candidateRepository.getCandidates).mockResolvedValue(mockResponse);

		render(<CandidateList />);

		// Wait for loading to clear, and candidates to show up
		await waitFor(() => {
			expect(screen.queryByText('Loading candidates...')).not.toBeInTheDocument();
			expect(screen.getByText('Alice Smith')).toBeInTheDocument();
			expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
		});
	});
});
