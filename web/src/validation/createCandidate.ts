import { z } from 'zod';

/** Comma-separated skills; empty tokens are stripped before POST. */
export function parseSkillsInput(raw: string): string[] {
	return raw
		.split(',')
		.map((segment) => segment.trim())
		.filter(Boolean);
}

export type CreateCandidateFormValues = z.infer<typeof createCandidateFormSchema>;

export const createCandidateFormSchema = z.object({
	first_name: z.string().trim().min(1, 'First name is required'),
	last_name: z.string().trim().min(1, 'Last name is required'),
	email: z.email('Enter a valid email').trim(),
	phone: z.string().trim().min(1, 'Phone is required'),
	skills_raw: z.string(),
	pictureFile: z
		.custom<File | null>((val) => val === null || val instanceof File, {
			message: 'Picture is required',
		})
		.refine((file) => file !== null && file.size > 0, { message: 'Picture is required' }),
});
