import { useState } from "react";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";

const LobbyPage = () => {
  const supabase = useSupabaseClient();
  const session = useSession();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. RPC Call to CREATE GAME
  const handleCreateGame = async () => {
    if (!session) return;
    setLoading(true);
    setMessage("");

    try {
      // Call the 'rpc_create_game' function from Supabase
      const { data: newRoomCode, error } = await supabase.rpc(
        "rpc_create_game"
      );

      if (error) {
        throw new Error(error.message);
      }

      // Navigate to the game page
      navigate(`/game/${newRoomCode}`);
    } catch (err) {
      // Check if error is an object with a message property (standard)
      if (err && typeof err === "object" && "message" in err) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage("Unknown server error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. RPC Call to JOIN GAME
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || roomCode.length !== 4) return;
    setLoading(true);
    setMessage("");

    try {
      // Call the 'rpc_join_game' function with the 'room_code' argument
      const { data: result, error } = await supabase.rpc("rpc_join_game", {
        room_code: roomCode.toUpperCase(),
      });

      if (error) {
        throw new Error(error.message);
      }

      // The RPC returns a status string (SUCCESS/ERROR/WARNING)
      if (result.startsWith("ERROR")) {
        setMessage(result.replace("ERROR: ", ""));
      } else {
        // Success or Warning (e.g., you are already Player 1)
        navigate(`/game/${roomCode.toUpperCase()}`);
      }
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage("Unknown server error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-4xl font-extrabold mb-6 text-center text-teal-400">
          Battleship Lobby
        </h1>

        {/* User Info & Logout */}
        <div className="text-center mb-6">
          <p className="text-gray-300">
            Logged in as:{" "}
            <span className="font-semibold">{session?.user.email}</span>
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 text-sm text-red-400 hover:text-red-300 transition duration-150"
          >
            Logout
          </button>
        </div>

        {/* 1. Create Room */}
        <div className="mb-8 border border-gray-700 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">1. Create New Game</h2>
          <button
            onClick={handleCreateGame}
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-600"
          >
            {loading ? "Creating..." : "Create Private Room"}
          </button>
        </div>

        {/* 2. Join Room */}
        <div className="border border-gray-700 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">2. Join a Game</h2>
          <form onSubmit={handleJoinGame} className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Enter Room Code (e.g., C9ZL)"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase().slice(0, 4))
              }
              maxLength={4}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 uppercase text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || roomCode.length !== 4}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-600"
            >
              {loading ? "Joining..." : "Join Game"}
            </button>
          </form>
        </div>

        {/* Status Messages */}
        {message && (
          <p
            className={`mt-4 text-center font-semibold ${
              message.startsWith("Error") ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;