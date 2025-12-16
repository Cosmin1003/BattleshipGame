// src/pages/GamePage.tsx
import { useParams } from 'react-router-dom';

const GamePage = () => {
  // Preluăm codul camerei din URL
  const { gameId } = useParams<{ gameId: string }>();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-teal-400">Joc în desfășurare: {gameId}</h1>
        <p className="text-lg mt-2">Aici vom implementa Realtime, plasarea navelor și tragerea.</p>
        {/* Aici va veni logica Realtime și Board-urile */}
      </div>
    </div>
  );
};

export default GamePage;