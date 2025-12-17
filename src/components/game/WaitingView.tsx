import { useNavigate } from "react-router-dom";
import { SupabaseClient } from "@supabase/supabase-js";

interface WaitingViewProps {
  gameId: string;
  gameData: any;
  supabase: SupabaseClient;
}

const WaitingView = ({ gameId, gameData, supabase }: WaitingViewProps) => {
  const navigate = useNavigate();

  // Manual cancellation function - ensures database is cleaned up if host leaves
  const handleLeaveGame = async () => {
    // Check if the game is still waiting for a second player
    if (gameData?.state === "Waiting" && !gameData?.player_2_id) {
      // Remove the game entry from the 'games' table
      const { error } = await supabase.from("games").delete().eq("id", gameId);
      
      if (error) {
        console.error("Error deleting game:", error.message);
      }
    }
    // Return to the Lobby
    navigate("/");
  };

  return (
    /* Changed min-h-[60vh] to min-h-screen to cover the full viewport height */
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-extrabold mb-6 text-center text-teal-400">
          Battleship Room
        </h1>

        <div className="text-center mb-8">
          <p className="text-gray-400 mb-2 uppercase tracking-widest text-sm font-semibold">
            Room Code
          </p>
          <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg inline-block">
            <span className="text-5xl font-mono font-black tracking-[0.5em] text-white ml-4">
              {gameId}
            </span>
          </div>
        </div>

        <div className="border border-teal-500/20 bg-teal-500/5 p-6 rounded-lg mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin h-6 w-6 border-2 border-teal-400 border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-xl font-bold text-teal-300 mb-2">
            Waiting for Opponent...
          </h2>
          <p className="text-gray-400 text-sm">
            Share the code above with a friend. The game will start automatically once they join.
          </p>
        </div>

        <button
          onClick={handleLeaveGame}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-lg shadow-red-900/20"
        >
          CANCEL & LEAVE ROOM
        </button>
      </div>
    </div>
  );
};

export default WaitingView;