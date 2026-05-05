import { render, screen } from '@testing-library/react';
import { CandidateRow } from './CandidateRow';
import type { Candidate } from '../types';
import { describe, it, expect } from 'vitest';

const mockCandidate: Candidate = {
	id: 1,
	first_name: 'Jane',
	last_name: 'Doe',
	email: 'jane.doe@example.com',
	phone: '555-1234',
	picture: 'https://example.com/jane.jpg',
	skills: ['React', 'TypeScript'],
};

describe('CandidateRow', () => {
	it('renders candidate information correctly', () => {
		render(<CandidateRow candidate={mockCandidate} />);

		// Check name
		expect(screen.getByText('Jane Doe')).toBeInTheDocument();

		// Check email & phone
		expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
		expect(screen.getByText('555-1234')).toBeInTheDocument();

		// Check skills
		expect(screen.getByText('React')).toBeInTheDocument();
		expect(screen.getByText('TypeScript')).toBeInTheDocument();

		// Check image
		const img = screen.getByRole('img', {
			name: 'Jane Doe',
		}) as HTMLImageElement;
		expect(img).toBeInTheDocument();
		expect(img.src).toBe('https://example.com/jane.jpg');
	});

	it('renders correctly without skills', () => {
		const candidateWithoutSkills = { ...mockCandidate, skills: [] };
		render(<CandidateRow candidate={candidateWithoutSkills} />);

		expect(screen.getByText('Jane Doe')).toBeInTheDocument();
		expect(screen.queryByText('React')).not.toBeInTheDocument();
	});
});
