import { useEffect, useState } from "react";
import type { Candidate, PaginationData } from "../types";
import { CandidateRow } from "./CandidateRow";
import { Pagination } from "./Pagination";
import { candidateRepository } from "../api/candidateRepository";
import "./CandidateList.css";

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
						throw new Error(
							responseJson.errors?.join(", ") || "Unknown error occurred",
						);
					}
				}
			} catch (err: any) {
				if (isMounted) setError(err.message);
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
		<div className="candidate-list-container">
			<h2>Candidates</h2>

			{isLoading ? (
				<div className="loading-state">Loading candidates...</div>
			) : error ? (
				<div className="error-state">Error: {error}</div>
			) : (
				<>
					<div className="candidate-grid">
						{candidates.map((candidate) => (
							<CandidateRow key={candidate.id} candidate={candidate} />
						))}
					</div>

					{pagination && (
						<Pagination
							pagination={pagination}
							onPageChange={(newPage) => setPage(newPage)}
						/>
					)}
				</>
			)}
		</div>
	);
}
