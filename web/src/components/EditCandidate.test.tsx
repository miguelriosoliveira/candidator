import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditCandidate } from './EditCandidate';
import { candidateRepository } from '../api/candidateRepository';

vi.mock('../api/candidateRepository', () => ({
	candidateRepository: {
		getCandidate: vi.fn(),
		updateCandidate: vi.fn(),
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

const bob = {
	status: 200,
	data: {
		id: 7,
		first_name: 'Bob',
		last_name: 'Lee',
		email: 'bob@example.com',
		phone: '111-222',
		picture: 'https://example.com/bob.jpg',
		skills: ['Go', 'Rust'],
	},
};

describe('EditCandidate', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.FileReader = class MockFileReader {
			result: string | null = 'data:image/png;base64,ZmFrZW5ld2Jl';
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
			<MemoryRouter initialEntries={['/candidates/7/edit']}>
				<Routes>
					<Route path="/candidates/:id/edit" element={<EditCandidate />} />
				</Routes>
			</MemoryRouter>,
		);

	it('shows loading state while fetching', () => {
		vi.mocked(candidateRepository.getCandidate).mockReturnValue(new Promise(() => {}));

		renderPage();
		expect(screen.getByText('Loading candidate data...')).toBeInTheDocument();
	});

	it('shows error when fetching candidate fails', async () => {
		vi.mocked(candidateRepository.getCandidate).mockRejectedValue(new Error('Network Error'));

		renderPage();

		await waitFor(() => {
			expect(screen.getByText('Error: Network Error')).toBeInTheDocument();
		});
	});

	it('prefills fields and shows current picture', async () => {
		vi.mocked(candidateRepository.getCandidate).mockResolvedValue(bob);

		renderPage();

		await waitFor(() => {
			expect(screen.getByRole('heading', { name: /edit candidate/i })).toBeInTheDocument();
			expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Lee')).toBeInTheDocument();
			expect(screen.getByDisplayValue('bob@example.com')).toBeInTheDocument();
			expect(screen.getByDisplayValue('111-222')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Go, Rust')).toBeInTheDocument();

			const img = screen.getByRole('img', { name: 'Current picture' }) as HTMLImageElement;
			expect(img.src).toBe('https://example.com/bob.jpg');
		});
	});

	it('PATCHes with existing picture when no new file selected', async () => {
		vi.mocked(candidateRepository.getCandidate).mockResolvedValue(bob);
		vi.mocked(candidateRepository.updateCandidate).mockResolvedValue({
			status: 200,
			data: bob.data,
		});

		renderPage();

		await waitFor(() => {
			expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() => {
			expect(candidateRepository.updateCandidate).toHaveBeenCalledWith(7, {
				first_name: 'Bob',
				last_name: 'Lee',
				email: 'bob@example.com',
				phone: '111-222',
				picture: 'https://example.com/bob.jpg',
				skills: ['Go', 'Rust'],
			});
			expect(mockNavigate).toHaveBeenCalledWith('/candidates/7');
		});
	});

	it('PATCHes data URI picture when new file chosen', async () => {
		vi.mocked(candidateRepository.getCandidate).mockResolvedValue(bob);
		vi.mocked(candidateRepository.updateCandidate).mockResolvedValue({
			status: 200,
			data: { ...bob.data, picture: 'data:image/png;base64,ZmFrZW5ld2Jl' },
		});

		renderPage();

		await waitFor(() => {
			expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
		});

		const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });
		fireEvent.change(screen.getByLabelText(/^picture$/i), { target: { files: [file] } });

		fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() => {
			expect(candidateRepository.updateCandidate).toHaveBeenCalledWith(7, {
				first_name: 'Bob',
				last_name: 'Lee',
				email: 'bob@example.com',
				phone: '111-222',
				picture: 'data:image/png;base64,ZmFrZW5ld2Jl',
				skills: ['Go', 'Rust'],
			});
			expect(mockNavigate).toHaveBeenCalledWith('/candidates/7');
		});
	});

	it('shows Zod validation for empty text fields', async () => {
		vi.mocked(candidateRepository.getCandidate).mockResolvedValue(bob);

		renderPage();

		await waitFor(() => expect(screen.getByDisplayValue('Bob')).toBeInTheDocument());

		fireEvent.change(screen.getByLabelText(/^first name$/i), { target: { value: '' } });
		fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() => {
			expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
		});

		expect(candidateRepository.updateCandidate).not.toHaveBeenCalled();
	});

	it('shows Zod validation for invalid email', async () => {
		vi.mocked(candidateRepository.getCandidate).mockResolvedValue(bob);

		renderPage();

		await waitFor(() => expect(screen.getByDisplayValue('Bob')).toBeInTheDocument());

		fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'bad' } });
		fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() => {
			expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
		});

		expect(candidateRepository.updateCandidate).not.toHaveBeenCalled();
	});

	it('shows update API errors without navigating', async () => {
		vi.mocked(candidateRepository.getCandidate).mockResolvedValue(bob);
		vi.mocked(candidateRepository.updateCandidate).mockRejectedValue(new Error('email already exists'));

		renderPage();

		await waitFor(() => expect(screen.getByDisplayValue('Bob')).toBeInTheDocument());

		fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() => {
			expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});
