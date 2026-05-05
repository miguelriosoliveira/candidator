import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidateRepository } from '../api/candidateRepository';
import type { Candidate } from '../types';
import { CandidateForm, type CandidateFormInitialValues } from './CandidateForm';

export function EditCandidate() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [candidate, setCandidate] = useState<Candidate | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		const fetchCandidate = async () => {
			if (!id) return;
			setIsLoading(true);
			setLoadError(null);
			try {
				const parsedId = Number.parseInt(id, 10);
				if (Number.isNaN(parsedId)) {
					throw new Error('Invalid candidate ID');
				}
				const response = await candidateRepository.getCandidate(parsedId);
				setCandidate(response.data);
			} catch (err: unknown) {
				setLoadError(err instanceof Error ? err.message : String(err));
				setCandidate(null);
			} finally {
				setIsLoading(false);
			}
		};

		void fetchCandidate();
	}, [id]);

	const formInitialValues = useMemo<CandidateFormInitialValues | null>(() => {
		if (!candidate) {
			return null;
		}
		return {
			first_name: candidate.first_name,
			last_name: candidate.last_name,
			email: candidate.email,
			phone: candidate.phone,
			picture: candidate.picture,
			skills: candidate.skills,
		};
	}, [candidate]);

	if (isLoading) {
		return (
			<div className="text-center p-8 text-slate-500 dark:text-slate-400">
				Loading candidate data...
			</div>
		);
	}

	if (loadError) {
		return (
			<div className="text-center p-8 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
				Error: {loadError}
			</div>
		);
	}

	if (!candidate) {
		return null;
	}

	return (
		<CandidateForm
			mode="edit"
			title="Edit candidate"
			backLink={{
				to: `/candidates/${candidate.id}`,
				label: '← Back to profile',
			}}
			submitLabel="Save changes"
			submittingLabel="Saving…"
			initialValues={formInitialValues}
			onSubmitPayload={(payload) => candidateRepository.updateCandidate(candidate.id, payload)}
			onSuccess={() => navigate(`/candidates/${candidate.id}`)}
		/>
	);
}
