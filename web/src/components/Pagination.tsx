import type { PaginationData } from "../types";
import "./Pagination.css";

interface PaginationProps {
	pagination: PaginationData;
	onPageChange: (newPage: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
	const { page, total_pages } = pagination;

	return (
		<div className="pagination">
			<button
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="pagination-btn"
			>
				Previous
			</button>
			<span className="pagination-info">
				Page {page} of {total_pages}
			</span>
			<button
				disabled={page >= total_pages}
				onClick={() => onPageChange(page + 1)}
				className="pagination-btn"
			>
				Next
			</button>
		</div>
	);
}
