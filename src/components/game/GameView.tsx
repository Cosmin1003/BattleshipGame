interface GameViewProps {
  gameData: any;
}

const GameView = ({ gameData }: GameViewProps) => {
  return (
    <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-2xl border border-teal-500/30 text-center">
      <h2 className="text-2xl font-bold text-green-400 mb-2">The Battle Has Begun!</h2>
      <p className="text-gray-300 italic">Both fleets are battle-ready.</p>
      <div className="mt-4 text-sm text-gray-500 font-mono">
        Server Status: {gameData?.state}
      </div>
    </div>
  );
};

export default GameView;