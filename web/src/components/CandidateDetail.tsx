import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidateRepository } from '../api/candidateRepository';
import type { Candidate } from '../types';

export function CandidateDetail() {
	const { id } = useParams<{ id: string }>();
	const [candidate, setCandidate] = useState<Candidate | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchCandidate = async () => {
			if (!id) return;
			setIsLoading(true);
			setError(null);
			try {
				// Safely parse ID
				const parsedId = parseInt(id, 10);
				if (isNaN(parsedId)) {
					throw new Error('Invalid candidate ID');
				}
				const response = await candidateRepository.getCandidate(parsedId);
				setCandidate(response.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : String(err));
			} finally {
				setIsLoading(false);
			}
		};

		fetchCandidate();
	}, [id]);

	if (isLoading) {
		return (
			<div className="text-center p-8 text-slate-500 dark:text-slate-400">
				Loading candidate data...
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center p-8 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
				Error: {error}
			</div>
		);
	}

	if (!candidate) {
		return null;
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Link
					to="/"
					className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-2 mb-4"
				>
					&larr; Back to candidates
				</Link>
				<h2 className="text-2xl font-semibold m-0 text-slate-800 dark:text-slate-100">
					Candidate Profile
				</h2>
			</div>

			<div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row gap-8 items-start">
				<img
					src={candidate.picture}
					alt={`${candidate.first_name} ${candidate.last_name}`}
					className="w-40 h-40 rounded-xl object-cover bg-slate-100 dark:bg-slate-700 shadow-sm"
				/>

				<div className="flex flex-col gap-4 w-full">
					<div>
						<h3 className="m-0 text-3xl font-bold text-slate-900 dark:text-white">
							{candidate.first_name} {candidate.last_name}
						</h3>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
						<div>
							<span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
								Email
							</span>
							<p className="m-0 text-slate-700 dark:text-slate-300 font-medium">
								{candidate.email}
							</p>
						</div>
						<div>
							<span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
								Phone
							</span>
							<p className="m-0 text-slate-700 dark:text-slate-300 font-medium">
								{candidate.phone}
							</p>
						</div>
					</div>

					{candidate.skills && candidate.skills.length > 0 && (
						<div className="pt-4 border-t border-slate-100 dark:border-slate-700">
							<span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
								Skills
							</span>
							<div className="flex flex-wrap gap-2">
								{candidate.skills.map((skill) => (
									<span
										key={skill}
										className="bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-3 py-1.5 rounded-full text-sm font-medium"
									>
										{skill}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
