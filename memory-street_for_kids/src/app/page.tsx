// app/page.tsx - BACK TO ORIGINAL
import GameBoard from '../components/GameBoard';
import Header from '../components/Header';

export default function Home() {
  return (
    <div className="game-container">
      <Header />
      <main className="main-content">
        <GameBoard />
      </main>
    </div>
  );
}