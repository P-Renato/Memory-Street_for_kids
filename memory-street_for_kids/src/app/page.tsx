// app/page.tsx - BACK TO ORIGINAL
import GameBoard from '../components/GameBoard';
import Sidebar from '../components/Header';

export default function Home() {
  return (
    <div className="game-container">
      <Sidebar />
      <main className="main-content">
        <GameBoard />
      </main>
    </div>
  );
}