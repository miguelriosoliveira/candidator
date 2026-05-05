import type { PaginationData } from '../types';

interface PaginationProps {
	pagination: PaginationData;
	onPageChange: (newPage: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
	const { page, total_pages } = pagination;

	return (
		<div className="flex justify-center items-center gap-4 mt-8 py-4">
			<button
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="px-4 py-2 bg-sky-500 dark:bg-sky-600 text-white rounded-md font-medium cursor-pointer transition-colors duration-200 hover:not-disabled:bg-sky-600 dark:hover:not-disabled:bg-sky-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
			>
				Previous
			</button>
			<span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
				Page {page} of {total_pages}
			</span>
			<button
				disabled={page >= total_pages}
				onClick={() => onPageChange(page + 1)}
				className="px-4 py-2 bg-sky-500 dark:bg-sky-600 text-white rounded-md font-medium cursor-pointer transition-colors duration-200 hover:not-disabled:bg-sky-600 dark:hover:not-disabled:bg-sky-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
			>
				Next
			</button>
		</div>
	);
}
