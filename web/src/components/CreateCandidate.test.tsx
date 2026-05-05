import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCandidate } from './CreateCandidate';
import { candidateRepository } from '../api/candidateRepository';

vi.mock('../api/candidateRepository', () => ({
	candidateRepository: {
		createCandidate: vi.fn(),
	},
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react-router-dom')>();
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

describe('CreateCandidate', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.FileReader = class MockFileReader {
			result: string | null = 'data:image/png;base64,ZnJvbXRlc3RieXRlcw';
			onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

			readAsDataURL(blob: Blob) {
				void blob;
				queueMicrotask(() => {
					this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
				});
			}

			readonly EMPTY = 0;
			readonly LOADING = 1;
			readonly DONE = 2;
			readonly error: DOMException | null = null;
			readonly readyState = 2;
			abort(): void {}
			readAsArrayBuffer(): void {}
			readAsBinaryString(): void {}
			readAsText(): void {}
			addEventListener(): void {}
			removeEventListener(): void {}
			dispatchEvent(): boolean {
				return false;
			}
		} as unknown as typeof FileReader;
	});

	const renderPage = () =>
		render(
			<MemoryRouter initialEntries={['/candidates/new']}>
				<Routes>
					<Route path="/candidates/new" element={<CreateCandidate />} />
				</Routes>
			</MemoryRouter>,
		);

	it('renders required fields', () => {
		renderPage();
		expect(screen.getByRole('heading', { name: /create candidate/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/^first name$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^last name$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^picture$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^skills$/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /create$/i })).toBeInTheDocument();
	});

	it('shows Zod validation when required fields are empty', async () => {
		renderPage();

		fireEvent.click(screen.getByRole('button', { name: /create$/i }));

		await waitFor(() => {
			expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
			expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
			expect(screen.getByText(/phone is required/i)).toBeInTheDocument();
			expect(screen.getByText(/picture is required/i)).toBeInTheDocument();
		});

		expect(candidateRepository.createCandidate).not.toHaveBeenCalled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it('rejects invalid email', async () => {
		renderPage();

		fireEvent.change(screen.getByLabelText(/^first name$/i), { target: { value: 'Jane' } });
		fireEvent.change(screen.getByLabelText(/^last name$/i), { target: { value: 'Doe' } });
		fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'not-email' } });
		fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: '555-0000' } });

		const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });
		fireEvent.change(screen.getByLabelText(/^picture$/i), { target: { files: [file] } });

		fireEvent.click(screen.getByRole('button', { name: /create$/i }));

		await waitFor(() => {
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
		});
		expect(candidateRepository.createCandidate).not.toHaveBeenCalled();
	});

	it('calls API with data URI and comma-separated skills, then navigates to detail', async () => {
		vi.mocked(candidateRepository.createCandidate).mockResolvedValue({
			status: 201,
			data: {
				id: 42,
				first_name: 'Jane',
				last_name: 'Doe',
				picture: 'data:image/png;base64,ZnJvbXRlc3RieXRlcw',
				phone: '555-0000',
				email: 'jane@example.com',
				skills: ['Go', 'React'],
			},
		});

		renderPage();

		fireEvent.change(screen.getByLabelText(/^first name$/i), { target: { value: 'Jane' } });
		fireEvent.change(screen.getByLabelText(/^last name$/i), { target: { value: 'Doe' } });
		fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'jane@example.com' } });
		fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: '555-0000' } });
		fireEvent.change(screen.getByLabelText(/^skills$/i), { target: { value: ' Go , React ' } });

		const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });
		fireEvent.change(screen.getByLabelText(/^picture$/i), { target: { files: [file] } });

		fireEvent.click(screen.getByRole('button', { name: /create$/i }));

		await waitFor(() => {
			expect(candidateRepository.createCandidate).toHaveBeenCalledWith({
				first_name: 'Jane',
				last_name: 'Doe',
				email: 'jane@example.com',
				phone: '555-0000',
				picture: 'data:image/png;base64,ZnJvbXRlc3RieXRlcw',
				skills: ['Go', 'React'],
			});
			expect(mockNavigate).toHaveBeenCalledWith('/candidates/42');
		});
	});

	it('shows API errors without navigating', async () => {
		vi.mocked(candidateRepository.createCandidate).mockRejectedValue(new Error('email already exists'));

		renderPage();

		fireEvent.change(screen.getByLabelText(/^first name$/i), { target: { value: 'Jane' } });
		fireEvent.change(screen.getByLabelText(/^last name$/i), { target: { value: 'Doe' } });
		fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'exist@example.com' } });
		fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: '555-0000' } });

		const file = new File([new Uint8Array([1])], 'photo.png', { type: 'image/png' });
		fireEvent.change(screen.getByLabelText(/^picture$/i), { target: { files: [file] } });

		fireEvent.click(screen.getByRole('button', { name: /create$/i }));

		await waitFor(() => {
			expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});
