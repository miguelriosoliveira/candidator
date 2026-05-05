import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ApiResponse, Candidate, CreateCandidateInput } from '../types';
import {
	createCandidateFormSchema,
	editCandidateFormSchema,
	parseSkillsInput,
} from '../validation/candidateForm';

export type CandidateFormInitialValues = Partial<
	Pick<
		Candidate,
		| 'first_name'
		| 'last_name'
		| 'email'
		| 'phone'
		| 'skills'
		| 'picture'
	>
> & {
	skills_raw?: string;
};

function defaultSkillsRaw(iv?: CandidateFormInitialValues | null): string {
	if (!iv) {
		return '';
	}
	return iv.skills_raw ?? (Array.isArray(iv.skills) ? iv.skills.join(', ') : '');
}

function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

type FieldErrors = Partial<
	Record<'first_name' | 'last_name' | 'email' | 'phone' | 'skills_raw' | 'pictureFile', string>
>;

export interface CandidateFormProps {
	mode: 'create' | 'edit';
	title: string;
	backLink: { to: string; label: string };
	submitLabel: string;
	submittingLabel: string;
	initialValues?: CandidateFormInitialValues | null;
	onSubmitPayload: (payload: CreateCandidateInput) => Promise<ApiResponse<Candidate>>;
	onSuccess: (response: ApiResponse<Candidate>) => void;
}

/** Shared create/edit form — picture on edit may stay as existing URI unless a replacement file is chosen. */
export function CandidateForm({
	mode,
	title,
	backLink,
	submitLabel,
	submittingLabel,
	initialValues,
	onSubmitPayload,
	onSuccess,
}: CandidateFormProps) {
	const [first_name, setFirstName] = useState(() => initialValues?.first_name ?? '');
	const [last_name, setLastName] = useState(() => initialValues?.last_name ?? '');
	const [email, setEmail] = useState(() => initialValues?.email ?? '');
	const [phone, setPhone] = useState(() => initialValues?.phone ?? '');
	const [skills_raw, setSkillsRaw] = useState(() => defaultSkillsRaw(initialValues));
	const [pictureFile, setPictureFile] = useState<File | null>(null);

	const existingPictureUri = initialValues?.picture ?? '';

	const replacementPicturePreviewSrc = useMemo(() => {
		if (!pictureFile) {
			return null;
		}
		return URL.createObjectURL(pictureFile);
	}, [pictureFile]);

	useEffect(() => {
		return () => {
			if (replacementPicturePreviewSrc) {
				URL.revokeObjectURL(replacementPicturePreviewSrc);
			}
		};
	}, [replacementPicturePreviewSrc]);

	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const displayPictureSrc =
		replacementPicturePreviewSrc ?? (mode === 'edit' ? existingPictureUri : null);

	const mapFieldErrors = (flat: Record<string, string[] | undefined> | undefined) => ({
		first_name: flat?.first_name?.[0],
		last_name: flat?.last_name?.[0],
		email: flat?.email?.[0],
		phone: flat?.phone?.[0],
		pictureFile: flat?.pictureFile?.[0],
	});

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitError(null);

		if (mode === 'create') {
			const parsed = createCandidateFormSchema.safeParse({
				first_name,
				last_name,
				email,
				phone,
				skills_raw,
				pictureFile,
			});
			if (!parsed.success) {
				setFieldErrors(mapFieldErrors(parsed.error.flatten().fieldErrors));
				return;
			}

			const data = parsed.data;

			setFieldErrors({});
			setIsSubmitting(true);
			try {
				if (!(data.pictureFile instanceof File)) {
					return;
				}
				const pictureUri = await readFileAsDataURL(data.pictureFile);
				const skills = parseSkillsInput(data.skills_raw);
				const response = await onSubmitPayload({
					first_name: data.first_name,
					last_name: data.last_name,
					email: data.email,
					phone: data.phone,
					picture: pictureUri,
					skills,
				});
				onSuccess(response);
			} catch (err: unknown) {
				setSubmitError(err instanceof Error ? err.message : String(err));
			} finally {
				setIsSubmitting(false);
			}
			return;
		}

		const parsed = editCandidateFormSchema.safeParse({
			first_name,
			last_name,
			email,
			phone,
			skills_raw,
			pictureFile,
			existingPictureUri,
		});
		if (!parsed.success) {
			setFieldErrors(mapFieldErrors(parsed.error.flatten().fieldErrors));
			return;
		}

		const data = parsed.data;

		setFieldErrors({});
		setIsSubmitting(true);
		try {
			const pictureUri =
				data.pictureFile instanceof File && data.pictureFile.size > 0
					? await readFileAsDataURL(data.pictureFile)
					: data.existingPictureUri;
			const skills = parseSkillsInput(data.skills_raw);
			const response = await onSubmitPayload({
				first_name: data.first_name,
				last_name: data.last_name,
				email: data.email,
				phone: data.phone,
				picture: pictureUri,
				skills,
			});
			onSuccess(response);
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
					to={backLink.to}
					className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-2 mb-4 text-sm font-medium"
				>
					{backLink.label}
				</Link>
				<h2 className="text-2xl font-semibold m-0 text-slate-800 dark:text-slate-100">{title}</h2>
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
					{displayPictureSrc ? (
						<img
							src={displayPictureSrc}
							alt="Current picture"
							className="w-28 h-28 rounded-lg object-cover border border-slate-200 dark:border-slate-600"
						/>
					) : null}
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
					{isSubmitting ? submittingLabel : submitLabel}
				</button>
			</form>
		</div>
	);
}
