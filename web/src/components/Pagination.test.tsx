import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./Pagination";
import { describe, it, expect, vi } from "vitest";

describe("Pagination", () => {
	it("renders correctly", () => {
		const paginationData = { page: 2, total_pages: 5, per_page: 25 };
		render(<Pagination pagination={paginationData} onPageChange={() => {}} />);

		// Check basic rendering
		expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Previous" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
	});

	it("disables Previous button on the first page", () => {
		const paginationData = { page: 1, total_pages: 5, per_page: 25 };
		render(<Pagination pagination={paginationData} onPageChange={() => {}} />);

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
	});

	it("disables Next button on the last page", () => {
		const paginationData = { page: 5, total_pages: 5, per_page: 25 };
		render(<Pagination pagination={paginationData} onPageChange={() => {}} />);

		expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("calls onPageChange with correct values when buttons are clicked", () => {
		const mockOnPageChange = vi.fn();
		const paginationData = { page: 2, total_pages: 5, per_page: 25 };

		render(
			<Pagination
				pagination={paginationData}
				onPageChange={mockOnPageChange}
			/>,
		);

		// Click Previous
		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		expect(mockOnPageChange).toHaveBeenCalledWith(1);

		// Click Next
		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(mockOnPageChange).toHaveBeenCalledWith(3);
	});
});
