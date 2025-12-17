import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseClient, useSessionContext } from "@supabase/auth-helpers-react";

import WaitingView from "../components/game/WaitingView";
import GameView from "../components/game/GameView";

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const supabase = useSupabaseClient();
  // useSessionContext provides the session state and a loading boolean for refreshes
  const { session, isLoading: sessionLoading } = useSessionContext(); 
  const navigate = useNavigate();

  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent logic execution while the session is still being restored after a refresh
    if (sessionLoading) return; 
    
    // Redirect to login if no active session is found
    if (!session) { 
      navigate("/login"); 
      return; 
    }

    const fetchGame = async () => {
      // Fetch the specific game row using the ID from the URL
      const { data, error: fetchError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (fetchError || !data) {
        setError("Game not found or has been cancelled.");
      } else {
        setGameData(data);
      }
      setLoading(false);
    };

    fetchGame();

    // Subscribe to Realtime changes for all events (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel(`game_updates_${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          // If the game row is deleted from the DB, show an error
          if (payload.eventType === "DELETE") {
            setGameData(null);
            setError("The game was cancelled by the host.");
          } else {
            // Update local state with the new data (e.g., when Player 2 joins)
            setGameData(payload.new); 
          }
        }
      )
      .subscribe();

    // Cleanup: unsubscribe from the channel when the component unmounts
    return () => { supabase.removeChannel(channel); };
  }, [gameId, session, sessionLoading, supabase, navigate]);

  // Display a loading screen during the initial session and data check
  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Error screen if the game doesn't exist or was deleted
  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-400 mb-4 font-semibold">{error || "Unknown error occurred."}</p>
        <button 
          onClick={() => navigate("/")} 
          className="bg-teal-600 hover:bg-teal-700 px-6 py-2 rounded-lg transition-colors font-bold"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Conditional Rendering based on the game state from the Database */}
      {gameData.state === "Waiting" ? (
        <WaitingView gameId={gameId!} gameData={gameData} supabase={supabase} />
      ) : (
        <GameView gameData={gameData} />
      )}
    </div>
  );
};

export default GamePage;