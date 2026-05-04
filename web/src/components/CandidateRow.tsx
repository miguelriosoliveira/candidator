import type { Candidate } from "../types";

interface CandidateRowProps {
	candidate: Candidate;
}

export function CandidateRow({ candidate }: CandidateRowProps) {
	return (
		<div className="flex items-start p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm gap-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-slate-900/50">
			<img
				src={candidate.picture}
				alt={`${candidate.first_name} ${candidate.last_name}`}
				className="w-20 h-20 rounded-md object-cover bg-slate-100 dark:bg-slate-700"
			/>
			<div className="flex flex-col gap-1 text-left">
				<h3 className="m-0 text-xl font-semibold text-slate-800 dark:text-slate-100">
					{candidate.first_name} {candidate.last_name}
				</h3>
				<p className="m-0 text-sm text-slate-500 dark:text-slate-400">{candidate.email}</p>
				<p className="m-0 text-sm text-slate-500 dark:text-slate-400">{candidate.phone}</p>
				{candidate.skills && candidate.skills.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-2">
						{candidate.skills.map((skill) => (
							<span
								key={skill}
								className="bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
							>
								{skill}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
