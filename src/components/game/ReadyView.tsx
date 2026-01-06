import { useState, useEffect, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { type Session } from "@supabase/auth-helpers-react";

interface ReadyViewProps {
  gameData: {
    id: string;
    player_1_id: string;
    player_2_id: string;
    p1_ready: boolean;
    p2_ready: boolean;
    ready_at: string | null;
    state: string;
    match_started: boolean;
  };
  supabase: SupabaseClient;
  session: Session | null;
}

const ReadyView = ({ gameData, supabase, session }: ReadyViewProps) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [usernames, setUsernames] = useState<{ p1: string; p2: string }>({
    p1: "Loading...",
    p2: "Loading...",
  });

  const isP1 = session?.user?.id === gameData.player_1_id;
  const myReady = isP1 ? gameData.p1_ready : gameData.p2_ready;
  const opponentReady = isP1 ? gameData.p2_ready : gameData.p1_ready;
  const isCountdownActive = !!(
    gameData.p1_ready &&
    gameData.p2_ready &&
    gameData.ready_at
  );

  // Fetch usernames din tabelul 'profiles'
  useEffect(() => {
    const fetchUsernames = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", [gameData.player_1_id, gameData.player_2_id]);

      if (data && !error) {
        const p1Name =
          data.find((u) => u.id === gameData.player_1_id)?.username ||
          "Player 1";
        const p2Name =
          data.find((u) => u.id === gameData.player_2_id)?.username ||
          "Player 2";
        setUsernames({ p1: p1Name, p2: p2Name });
      }
    };
    fetchUsernames();
  }, [gameData.player_1_id, gameData.player_2_id, supabase]);

  const startGame = useCallback(async () => {
    // Verificăm match_started din gameData
    if (isP1 && !gameData.match_started) {
      await supabase
        .from("games")
        .update({
          match_started: true,
          placement_started_at: new Date().toISOString(),
        })
        .eq("id", gameData.id);
    }
  }, [isP1, gameData.id, gameData.match_started, supabase]);

  useEffect(() => {
    if (!isCountdownActive) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const readyTime = new Date(gameData.ready_at!).getTime();
      const diff = Math.max(0, 5 - Math.floor((now - readyTime) / 1000));
      setCountdown(diff);
      if (diff === 0) {
        clearInterval(timer);
        startGame();
      }
    }, 1000);
    return () => {
      clearInterval(timer);
      setCountdown(null);
    };
  }, [isCountdownActive, gameData.ready_at, startGame]);

  if (!session)
    return <div className="text-white text-center">Loading session...</div>;

  const toggleReady = async () => {
    const nextReady = !myReady;
    const update = isP1 ? { p1_ready: nextReady } : { p2_ready: nextReady };
    const finalUpdate: any = {
      ...update,
      ready_at: nextReady && opponentReady ? new Date().toISOString() : null,
    };
    await supabase.from("games").update(finalUpdate).eq("id", gameData.id);
  };

  const displayTime = isCountdownActive ? countdown ?? 5 : null;

  return (
    <div className="max-w-lg w-full mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl text-center min-h-[420px] flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">
          Game Preparation
        </h2>

        <div className="flex justify-between items-stretch mb-8 gap-4">
          {/* Player 1 Card */}
          <div
            className={`flex-1 p-4 rounded-lg border transition-all duration-300 flex flex-col justify-center min-h-[100px] ${
              gameData.p1_ready
                ? "bg-green-500/10 border-green-500"
                : "bg-gray-900/40 border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-400 mb-1 truncate font-medium">
              {usernames.p1}
            </p>
            <div className="h-6 flex items-center justify-center">
              <p
                className={`text-xs font-bold tracking-widest ${
                  gameData.p1_ready ? "text-green-400" : "text-gray-500"
                }`}
              >
                {gameData.p1_ready ? "READY" : "WAITING"}
              </p>
            </div>
          </div>

          <div className="flex items-center text-gray-600 font-bold px-2">
            VS
          </div>

          {/* Player 2 Card */}
          <div
            className={`flex-1 p-4 rounded-lg border transition-all duration-300 flex flex-col justify-center min-h-[100px] ${
              gameData.p2_ready
                ? "bg-green-500/10 border-green-500"
                : "bg-gray-900/40 border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-400 mb-1 truncate font-medium">
              {usernames.p2}
            </p>
            <div className="h-6 flex items-center justify-center">
              <p
                className={`text-xs font-bold tracking-widest ${
                  gameData.p2_ready ? "text-green-400" : "text-gray-500"
                }`}
              >
                {gameData.p2_ready ? "READY" : "WAITING"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed center zone for countdown/messages */}
      <div className="h-24 flex flex-col justify-center mb-4">
        {displayTime !== null ? (
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1 font-semibold tracking-wider">
              Game starts in
            </p>
            <p className="text-6xl font-bold text-white leading-none">
              {displayTime}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Waiting for both players to confirm...
          </p>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={toggleReady}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all active:scale-[0.98] ${
          myReady
            ? "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30"
            : "bg-teal-500 text-gray-900 hover:bg-teal-400 shadow-lg shadow-teal-500/10"
        }`}
      >
        {myReady ? "CANCEL" : "READY"}
      </button>
    </div>
  );
};

export default ReadyView;
