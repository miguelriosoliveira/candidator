import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { candidateRepository } from '../api/candidateRepository';
import {
	createCandidateFormSchema,
	parseSkillsInput,
	type CreateCandidateFormValues,
} from '../validation/createCandidate';

function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

type FieldErrors = Partial<Record<keyof CreateCandidateFormValues, string>>;

export function CreateCandidate() {
	const navigate = useNavigate();
	const [first_name, setFirstName] = useState('');
	const [last_name, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [skills_raw, setSkillsRaw] = useState('');
	const [pictureFile, setPictureFile] = useState<File | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitError(null);

		const parsed = createCandidateFormSchema.safeParse({
			first_name,
			last_name,
			email,
			phone,
			skills_raw,
			pictureFile,
		});

		if (!parsed.success) {
			const flat = parsed.error.flatten().fieldErrors;
			setFieldErrors({
				first_name: flat.first_name?.[0],
				last_name: flat.last_name?.[0],
				email: flat.email?.[0],
				phone: flat.phone?.[0],
				pictureFile: flat.pictureFile?.[0],
			});
			return;
		}

		setFieldErrors({});
		setIsSubmitting(true);
		try {
			const validated = parsed.data;
			if (!(validated.pictureFile instanceof File)) {
				return;
			}
			const picture = await readFileAsDataURL(validated.pictureFile);
			const skills = parseSkillsInput(validated.skills_raw);
			const response = await candidateRepository.createCandidate({
				first_name: validated.first_name,
				last_name: validated.last_name,
				email: validated.email,
				phone: validated.phone,
				picture,
				skills,
			});
			navigate(`/candidates/${response.data.id}`);
		} catch (err: unknown) {
			setSubmitError(err instanceof Error ? err.message : String(err));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 max-w-lg w-full mx-auto">
			<div>
				<Link
					to="/"
					className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-2 mb-4 text-sm font-medium"
				>
					&larr; Back to candidates
				</Link>
				<h2 className="text-2xl font-semibold m-0 text-slate-800 dark:text-slate-100">
					Create candidate
				</h2>
			</div>

			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700"
				noValidate
			>
				<div className="flex flex-col gap-1">
					<label htmlFor="first_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
						First name
					</label>
					<input
						id="first_name"
						name="first_name"
						type="text"
						autoComplete="given-name"
						value={first_name}
						onChange={(evt) => setFirstName(evt.target.value)}
						className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
					/>
					{fieldErrors.first_name ? (
						<p className="text-sm text-red-600 dark:text-red-400 m-0">{fieldErrors.first_name}</p>
					) : null}
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="last_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
						Last name
					</label>
					<input
						id="last_name"
						name="last_name"
						type="text"
						autoComplete="family-name"
						value={last_name}
						onChange={(evt) => setLastName(evt.target.value)}
						className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
					/>
					{fieldErrors.last_name ? (
						<p className="text-sm text-red-600 dark:text-red-400 m-0">{fieldErrors.last_name}</p>
					) : null}
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						value={email}
						onChange={(evt) => setEmail(evt.target.value)}
						className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
					/>
					{fieldErrors.email ? (
						<p className="text-sm text-red-600 dark:text-red-400 m-0">{fieldErrors.email}</p>
					) : null}
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
						Phone
					</label>
					<input
						id="phone"
						name="phone"
						type="tel"
						autoComplete="tel"
						value={phone}
						onChange={(evt) => setPhone(evt.target.value)}
						className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
					/>
					{fieldErrors.phone ? (
						<p className="text-sm text-red-600 dark:text-red-400 m-0">{fieldErrors.phone}</p>
					) : null}
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="picture" className="text-sm font-medium text-slate-700 dark:text-slate-300">
						Picture
					</label>
					<input
						id="picture"
						name="picture"
						type="file"
						accept="image/*"
						onChange={(evt) => {
							const next = evt.target.files?.[0];
							setPictureFile(next ?? null);
						}}
						className="text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
					/>
					{fieldErrors.pictureFile ? (
						<p className="text-sm text-red-600 dark:text-red-400 m-0">{fieldErrors.pictureFile}</p>
					) : null}
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="skills" className="text-sm font-medium text-slate-700 dark:text-slate-300">
						Skills
					</label>
					<input
						id="skills"
						name="skills"
						type="text"
						placeholder="e.g. Go, React, TypeScript"
						value={skills_raw}
						onChange={(evt) => setSkillsRaw(evt.target.value)}
						className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
					/>
					<p className="text-xs text-slate-500 dark:text-slate-400 m-0">Comma-separated list (optional)</p>
				</div>

				{submitError ? (
					<p className="text-sm text-red-600 dark:text-red-400 m-0" role="alert">
						{submitError}
					</p>
				) : null}

				<button
					type="submit"
					disabled={isSubmitting}
					className="mt-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60 disabled:pointer-events-none"
				>
					{isSubmitting ? 'Creating…' : 'Create'}
				</button>
			</form>
		</div>
	);
}
