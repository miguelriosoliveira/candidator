import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Candidate, PaginationData } from '../types';
import { CandidateRow } from './CandidateRow';
import { Pagination } from './Pagination';
import { candidateRepository } from '../api/candidateRepository';

export function CandidateList() {
	const [candidates, setCandidates] = useState<Candidate[]>([]);
	const [pagination, setPagination] = useState<PaginationData | null>(null);
	const [page, setPage] = useState<number>(1);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		const fetchCandidates = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const responseJson = await candidateRepository.getCandidates(page);

				if (isMounted) {
					if (responseJson.status >= 200 && responseJson.status < 300) {
						setCandidates(responseJson.data.candidates);
						setPagination(responseJson.data.pagination);
					} else {
						throw new Error(responseJson.errors?.join(', ') || 'Unknown error occurred');
					}
				}
			} catch (err) {
				if (isMounted) setError(err instanceof Error ? err.message : String(err));
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};

		fetchCandidates();

		return () => {
			isMounted = false;
		};
	}, [page]);

	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="flex flex-row flex-wrap items-center justify-between gap-3 mb-2">
				<h2 className="text-slate-800 dark:text-slate-100 m-0 transition-colors">Candidates</h2>
				<Link
					to="/candidates/new"
					className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 no-underline shrink-0"
				>
					Create candidate
				</Link>
			</div>

			{isLoading ? (
				<div className="text-center p-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
					Loading candidates...
				</div>
			) : error ? (
				<div className="text-center p-10 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 dark:text-red-400 transition-colors">
					Error: {error}
				</div>
			) : (
				<>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
						{candidates.map((candidate) => (
							<CandidateRow key={candidate.id} candidate={candidate} />
						))}
					</div>

					{pagination && (
						<Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
					)}
				</>
			)}
		</div>
	);
}
