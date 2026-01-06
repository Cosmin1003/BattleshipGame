interface GameOverProps {
  gameData: any;
  session: any;
}

const GameOverView = ({ gameData, session }: GameOverProps) => {
  const isWinner = session.user.id === gameData.winner_id;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-fadeIn">
      <div className={`p-10 rounded-2xl border-2 shadow-2xl text-center bg-gray-800 ${
        isWinner ? 'border-green-500 shadow-green-500/20' : 'border-red-500 shadow-red-500/20'
      }`}>
        <h1 className={`text-6xl font-black italic uppercase tracking-tighter mb-2 ${
          isWinner ? 'text-green-400' : 'text-red-500'
        }`}>
          {isWinner ? "Victory" : "Defeat"}
        </h1>
        
        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-8">
          Mission Terminated
        </p>

        <div className="space-y-4">
          
          
          <button 
            onClick={() => window.location.href = '/'} // Sau navigare cu router-ul tău
            className="w-full py-3 px-6 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-teal-900/20"
          >
            Return to Base
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverView;