import { z } from 'zod';

/** Comma-separated skills; empty tokens are stripped before POST. */
export function parseSkillsInput(raw: string): string[] {
	return raw
		.split(',')
		.map((segment) => segment.trim())
		.filter(Boolean);
}

export const candidateFormTextsSchema = z.object({
	first_name: z.string().trim().min(1, 'First name is required'),
	last_name: z.string().trim().min(1, 'Last name is required'),
	email: z.string().trim().min(1, 'Enter a valid email').email('Enter a valid email'),
	phone: z.string().trim().min(1, 'Phone is required'),
	skills_raw: z.string(),
});

export type CandidateFormTextsValues = z.infer<typeof candidateFormTextsSchema>;

const createPictureSchema = z.object({
	pictureFile: z
		.custom<File | null>((val) => val === null || val instanceof File, {
			message: 'Picture is required',
		})
		.refine((file) => file !== null && file.size > 0, { message: 'Picture is required' }),
});

export type CreateCandidateFormValues = CandidateFormTextsValues & z.infer<typeof createPictureSchema>;

export const createCandidateFormSchema = candidateFormTextsSchema.and(createPictureSchema);

export const editCandidateFormSchema = candidateFormTextsSchema
	.extend({
		pictureFile: z.custom<File | null>((val) => val === null || val instanceof File),
		existingPictureUri: z.string(),
	})
	.superRefine((data, ctx) => {
		const hasNewFile = data.pictureFile instanceof File && data.pictureFile.size > 0;
		const hasExisting = data.existingPictureUri.trim().length > 0;
		if (!hasNewFile && !hasExisting) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Picture is required',
				path: ['pictureFile'],
			});
		}
	});

export type EditCandidateFormValues = z.infer<typeof editCandidateFormSchema>;
