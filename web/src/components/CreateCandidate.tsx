import { useNavigate } from 'react-router-dom';
import { candidateRepository } from '../api/candidateRepository';
import { CandidateForm } from './CandidateForm';

export function CreateCandidate() {
	const navigate = useNavigate();

	return (
		<CandidateForm
			mode="create"
			title="Create candidate"
			backLink={{ to: '/', label: '← Back to candidates' }}
			submitLabel="Create"
			submittingLabel="Creating…"
			onSubmitPayload={(payload) => candidateRepository.createCandidate(payload)}
			onSuccess={(response) => navigate(`/candidates/${response.data.id}`)}
		/>
	);
}
