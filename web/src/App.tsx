import "./App.css";
import { CandidateList } from "./components/CandidateList";

export function App() {
	return (
		<div className="app-container">
			<header className="app-header">
				<h1>Candidator</h1>
			</header>
			<main className="app-main">
				<CandidateList />
			</main>
		</div>
	);
}
