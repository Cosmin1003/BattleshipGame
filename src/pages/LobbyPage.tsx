// src/pages/LobbyPage.tsx
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

  // 1. Apelare RPC pentru CREARE JOC
  const handleCreateGame = async () => {
    if (!session) return;
    setLoading(true);
    setMessage("");

    try {
      // Apelăm funcția RPC 'rpc_create_game' din Supabase
      const { data: newRoomCode, error } = await supabase.rpc(
        "rpc_create_game"
      );

      if (error) {
        throw new Error(error.message);
      }

      // Navigăm la pagina de joc
      navigate(`/game/${newRoomCode}`);
    } catch (err) {
      // Verifică dacă eroarea este un obiect cu proprietatea message (comun)
      if (err && typeof err === "object" && "message" in err) {
        setMessage(`Eroare: ${err.message}`);
      } else {
        setMessage("Eroare necunoscută la server.");
      }
    }
  };

  // 2. Apelare RPC pentru ADERARE LA JOC
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || roomCode.length !== 4) return;
    setLoading(true);
    setMessage("");

    try {
      // Apelăm funcția RPC 'rpc_join_game' cu argumentul 'room_code'
      const { data: result, error } = await supabase.rpc("rpc_join_game", {
        room_code: roomCode.toUpperCase(),
      });

      if (error) {
        throw new Error(error.message);
      }

      // Funcția RPC returnează un string de stare (SUCCESS/ERROR/WARNING)
      if (result.startsWith("ERROR")) {
        setMessage(result.replace("ERROR: ", ""));
      } else {
        // Succes sau Warning (de exemplu: ești deja P1)
        navigate(`/game/${roomCode.toUpperCase()}`);
      }
    } catch (err) {
      // Verifică dacă eroarea este un obiect cu proprietatea message (comun)
      if (err && typeof err === "object" && "message" in err) {
        setMessage(`Eroare: ${err.message}`);
      } else {
        setMessage("Eroare necunoscută la server.");
      }
    }
  };

  // Functie de Logout
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
            Logat ca:{" "}
            <span className="font-semibold">{session?.user.email}</span>
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 text-sm text-red-400 hover:text-red-300 transition duration-150"
          >
            Logout
          </button>
        </div>

        {/* 1. Creare Cameră */}
        <div className="mb-8 border border-gray-700 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">1. Crează Joc Nou</h2>
          <button
            onClick={handleCreateGame}
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-600"
          >
            {loading ? "Se creează..." : "Creează Cameră Privată"}
          </button>
        </div>

        {/* 2. Aderare Cameră */}
        <div className="border border-gray-700 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">2. Alătură-te unui Joc</h2>
          <form onSubmit={handleJoinGame} className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Introdu Cod Cameră (ex: C9ZL)"
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
              {loading ? "Se alătură..." : "Alătură-te Jocului"}
            </button>
          </form>
        </div>

        {/* Mesaje de stare */}
        {message && (
          <p
            className={`mt-4 text-center font-semibold ${
              message.startsWith("Eroare") ? "text-red-400" : "text-green-400"
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
