import { useState, useEffect, useCallback, useMemo } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { type Session } from "@supabase/auth-helpers-react";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const SHIP_COLORS: Record<number, string> = {
  1: "bg-blue-500/50 border-blue-400",
  2: "bg-purple-500/50 border-purple-400",
  3: "bg-amber-500/50 border-amber-400",
};

interface GameViewProps {
  gameData: any;
  supabase: SupabaseClient;
  session: Session;
}

const GameView = ({ gameData, supabase, session }: GameViewProps) => {
  const [moves, setMoves] = useState<any[]>([]);
  const [myShips, setMyShips] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);

  const isMyTurn = session.user.id === gameData.current_turn_id;

  // --- FUNCTII DEFINITE INAINTE DE USEEFFECT ---

  const attack = useCallback(
    async (coord: string) => {
      if (!isMyTurn) return;

      // Verificăm folosind shooter_id și target_coords
      const alreadyAttacked = moves.some(
        (m) => m.shooter_id === session.user.id && m.target_coords === coord
      );
      if (alreadyAttacked) return;

      const { error } = await supabase.from("moves").insert({
        game_id: gameData.id,
        shooter_id: session.user.id, // Sincronizat cu tabelul tău
        target_coords: coord, // Sincronizat cu tabelul tău
      });

      if (error) {
        console.error("Attack failed:", error.message);
      }
    },
    [isMyTurn, gameData.id, session.user.id, moves, supabase]
  );

  const handleAutoAttack = useCallback(async () => {
    const allCoords: string[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 1; c <= 10; c++) {
        allCoords.push(`${LETTERS[r]}${c}`);
      }
    }

    // CORECTARE: Folosim shooter_id și target_coords
    const myPastMoves = moves
      .filter((m) => m.shooter_id === session.user.id)
      .map((m) => m.target_coords);

    const available = allCoords.filter((c) => !myPastMoves.includes(c));

    if (available.length > 0) {
      const randomCoord =
        available[Math.floor(Math.random() * available.length)];
      attack(randomCoord);
    }
  }, [moves, session.user.id, attack]);

  // --- EFECTE PENTRU LOGICA JOCULUI ---

  useEffect(() => {
    const fetchData = async () => {
      const { data: shipData } = await supabase
        .from("placements")
        .select("ships_data")
        .eq("game_id", gameData.id)
        .eq("user_id", session.user.id)
        .single();
      if (shipData) setMyShips(shipData.ships_data);

      const { data: moveData } = await supabase
        .from("moves")
        .select("*")
        .eq("game_id", gameData.id);
      if (moveData) setMoves(moveData);
    };

    fetchData();

    const channel = supabase
      .channel(`game_moves_${gameData.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "moves",
          filter: `game_id=eq.${gameData.id}`,
        },
        (payload) => {
          setMoves((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameData.id, session.user.id, supabase]);

  useEffect(() => {
    // Dacă turn_started_at nu există, înseamnă că rândul nu a fost inițializat
    if (!gameData.turn_started_at) {
      setTimeLeft(30);
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(gameData.turn_started_at).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      const remaining = Math.max(0, 30 - diff);

      setTimeLeft(remaining);

      if (remaining === 0 && isMyTurn) {
        handleAutoAttack();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData.turn_started_at, isMyTurn, handleAutoAttack]);

  // --- RENDER GRID FUNCTION ---

  const renderGrid = (type: "mine" | "enemy") => {
    return (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl relative">
        <h3 className="text-center mb-4 font-bold uppercase tracking-widest text-xs text-teal-500">
          {type === "mine" ? "My Fleet" : "Enemy Waters"}
        </h3>
        {/* ... header-ul cu cifre rămâne la fel */}
        <div className="flex">
          {/* ... coloana cu litere rămâne la fel */}
          <div className="grid grid-cols-10 border border-teal-500/30 bg-gray-950">
            {Array.from({ length: 100 }).map((_, i) => {
              const row = Math.floor(i / 10);
              const col = i % 10;
              const coord = `${LETTERS[row]}${col + 1}`;

              const myShip = myShips.find((s) => s.coords.includes(coord));

              // CORECTARE: Căutăm în moves folosind shooter_id și target_coords
              const moveAgainstMe = moves.find(
                (m) =>
                  m.shooter_id !== session.user.id && m.target_coords === coord
              );
              const myMove = moves.find(
                (m) =>
                  m.shooter_id === session.user.id && m.target_coords === coord
              );

              return (
                <div
                  key={coord}
                  onClick={() => type === "enemy" && attack(coord)}
                  className={`w-10 h-10 border border-white/5 flex items-center justify-center text-lg transition-all
                    ${
                      type === "enemy" && isMyTurn
                        ? "cursor-crosshair hover:bg-teal-500/20"
                        : ""
                    }
                    ${
                      type === "mine" && myShip
                        ? `${SHIP_COLORS[myShip.id]} opacity-80`
                        : ""
                    }
                  `}
                >
                  {/* Grid-ul Meu: Afișăm loviturile primite de la inamic */}
                  {type === "mine" && moveAgainstMe && (
                    <span
                      className={`${
                        moveAgainstMe.is_hit
                          ? "text-red-500 animate-pulse"
                          : "text-gray-600"
                      }`}
                    >
                      {moveAgainstMe.is_hit
                        ? moveAgainstMe.is_headshot
                          ? "💀"
                          : "🔥"
                        : "✕"}
                    </span>
                  )}

                  {/* Grid-ul Inamic: Afișăm atacurile mele cu rezultatele din DB */}
                  {type === "enemy" && myMove && (
                    <div className="flex items-center justify-center w-full h-full">
                      {myMove.is_headshot ? (
                        <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-bounce">
                          💀
                        </span>
                      ) : myMove.is_hit ? (
                        <span className="text-red-500 font-bold text-xl animate-pulse">
                          💥
                        </span>
                      ) : (
                        <span className="text-gray-500 font-bold text-lg">
                          ✕
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full animate-fadeIn">
      <div className="w-full max-w-4xl flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-teal-500/30 shadow-2xl">
        <div>
          <h2
            className={`text-2xl font-black italic uppercase tracking-widest ${
              isMyTurn ? "text-green-400" : "text-gray-500"
            }`}
          >
            {isMyTurn ? ">> Your Turn <<" : "Awaiting Enemy..."}
          </h2>
          <p className="text-[10px] text-gray-400 font-mono mt-1">
            PLAYER: {session.user.email}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <div
            className={`text-3xl font-mono font-bold px-4 py-1 rounded bg-black/40 border ${
              timeLeft < 10
                ? "text-red-500 border-red-900/50"
                : "text-teal-400 border-teal-900/50"
            }`}
          >
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </div>
          <span className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">
            Automatic fire in T-minus
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-10 w-full">
        {renderGrid("mine")}
        {renderGrid("enemy")}
      </div>
    </div>
  );
};

export default GameView;
