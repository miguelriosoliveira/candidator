import { CandidateList } from "./components/CandidateList";

export function App() {
	return (
		<div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-200">
			<header className="bg-white dark:bg-slate-800 py-4 px-8 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
				<h1 className="m-0 text-slate-900 dark:text-slate-100 text-2xl font-semibold">Candidator</h1>
			</header>
			<main className="p-8 max-w-6xl mx-auto w-full">
				<CandidateList />
			</main>
		</div>
	);
}
