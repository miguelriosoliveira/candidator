import type { Candidate } from "../types";
import "./CandidateRow.css";

interface CandidateRowProps {
	candidate: Candidate;
}

export function CandidateRow({ candidate }: CandidateRowProps) {
	return (
		<div className="candidate-row">
			<img
				src={candidate.picture}
				alt={`${candidate.first_name} ${candidate.last_name}`}
				className="candidate-picture"
			/>
			<div className="candidate-info">
				<h3>
					{candidate.first_name} {candidate.last_name}
				</h3>
				<p className="candidate-email">{candidate.email}</p>
				<p className="candidate-phone">{candidate.phone}</p>
				{candidate.skills && candidate.skills.length > 0 && (
					<div className="candidate-skills">
						{candidate.skills.map((skill) => (
							<span key={skill} className="skill-pill">
								{skill}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
