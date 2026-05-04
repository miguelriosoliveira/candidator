import type { Candidate } from "../types";

interface CandidateRowProps {
	candidate: Candidate;
}

export function CandidateRow({ candidate }: CandidateRowProps) {
	return (
		<div className="flex items-start p-4 bg-white rounded-lg shadow-sm gap-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
			<img
				src={candidate.picture}
				alt={`${candidate.first_name} ${candidate.last_name}`}
				className="w-20 h-20 rounded-md object-cover bg-slate-100"
			/>
			<div className="flex flex-col gap-1 text-left">
				<h3 className="m-0 text-xl font-semibold text-slate-800">
					{candidate.first_name} {candidate.last_name}
				</h3>
				<p className="m-0 text-sm text-slate-500">{candidate.email}</p>
				<p className="m-0 text-sm text-slate-500">{candidate.phone}</p>
				{candidate.skills && candidate.skills.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-2">
						{candidate.skills.map((skill) => (
							<span
								key={skill}
								className="bg-sky-100 text-sky-600 px-2.5 py-1 rounded-full text-xs font-medium"
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
