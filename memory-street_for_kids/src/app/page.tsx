// app/page.tsx
import GameBoard from '../components/GameBoard';
import Sidebar from '../components/Header';
// import Results from '../components/Results';


export default function Home() {
  return (
    <div className="game-container">
      <Sidebar />
      <main className="main-content">


        <GameBoard />
        {/* Results will be conditionally rendered in GameBoard */}
      </main>
    </div>
  );
}