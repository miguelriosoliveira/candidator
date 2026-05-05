import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CandidateDetail } from './CandidateDetail';
import { candidateRepository } from '../api/candidateRepository';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api/candidateRepository', () => ({
	candidateRepository: {
		getCandidate: vi.fn(),
	},
}));

describe('CandidateDetail', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const renderWithRouter = (initialEntry = '/candidates/1') => {
		return render(
			<MemoryRouter initialEntries={[initialEntry]}>
				<Routes>
					<Route path="/candidates/:id" element={<CandidateDetail />} />
				</Routes>
			</MemoryRouter>,
		);
	};

	it('renders loading state initially', () => {
		vi.mocked(candidateRepository.getCandidate).mockReturnValue(new Promise(() => {}));

		renderWithRouter('/candidates/1');
		expect(screen.getByText('Loading candidate data...')).toBeInTheDocument();
	});

	it('renders error state when the API fails', async () => {
		vi.mocked(candidateRepository.getCandidate).mockRejectedValue(new Error('Network Error'));

		renderWithRouter('/candidates/1');

		await waitFor(() => {
			expect(screen.getByText('Error: Network Error')).toBeInTheDocument();
		});
	});

	it('renders candidate correctly when API succeeds', async () => {
		const mockResponse = {
			status: 200,
			data: {
				id: 1,
				first_name: 'Alice',
				last_name: 'Smith',
				picture: 'https://example.com/alice.jpg',
				phone: '000-0000',
				email: 'alice@example.com',
				skills: ['Go', 'React'],
			},
		};
		vi.mocked(candidateRepository.getCandidate).mockResolvedValue(mockResponse);

		renderWithRouter('/candidates/1');

		await waitFor(() => {
			expect(screen.queryByText('Loading candidate data...')).not.toBeInTheDocument();
			expect(screen.getByText('Alice Smith')).toBeInTheDocument();
			expect(screen.getByText('alice@example.com')).toBeInTheDocument();
			expect(screen.getByText('000-0000')).toBeInTheDocument();
			expect(screen.getByText('Go')).toBeInTheDocument();
			expect(screen.getByText('React')).toBeInTheDocument();
			const img = screen.getByRole('img', { name: 'Alice Smith' }) as HTMLImageElement;
			expect(img.src).toBe('https://example.com/alice.jpg');
			expect(screen.getByRole('link', { name: /edit candidate/i })).toHaveAttribute(
				'href',
				'/candidates/1/edit',
			);
		});
	});
});
