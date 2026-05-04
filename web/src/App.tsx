import { CandidateList } from "./components/CandidateList";

export function App() {
	return (
		<div className="min-h-screen flex flex-col bg-slate-100 font-sans">
			<header className="bg-white py-4 px-8 border-b border-slate-200 shadow-sm">
				<h1 className="m-0 text-slate-900 text-2xl font-semibold">Candidator</h1>
			</header>
			<main className="p-8 max-w-6xl mx-auto w-full">
				<CandidateList />
			</main>
		</div>
	);
}
