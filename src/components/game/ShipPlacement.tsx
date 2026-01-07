import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { type Session } from "@supabase/auth-helpers-react";

const GRID_SIZE = 10;
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const SHIP_COLORS: Record<number, string> = {
  1: "bg-blue-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)] border-blue-400",
  2: "bg-purple-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)] border-purple-400",
  3: "bg-amber-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)] border-amber-400",
};

const COMPLEX_SHAPE = [
  [0, 0, 2, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
];

interface Ship {
  id: number;
  coords: string[];
  head_coord: string;
}

interface ShipPlacementProps {
  gameData: any;
  supabase: SupabaseClient;
  session: Session | null;
}

const ShipPlacement = ({ gameData, supabase, session }: ShipPlacementProps) => {
  const [placedShips, setPlacedShips] = useState<Ship[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [currentShape, setCurrentShape] = useState<number[][]>(COMPLEX_SHAPE);
  const [cursorPos, setCursorPos] = useState<{ r: number; c: number } | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const hasSubmitted = useRef(false);

  const isP1 = session?.user.id === gameData.player_1_id;
  const myReady = isP1 ? gameData.p1_placed_ready : gameData.p2_placed_ready;
  const opponentReady = isP1
    ? gameData.p2_placed_ready
    : gameData.p1_placed_ready;

  const handleFinalUpload = useCallback(
    async (shipsToUpload: Ship[]) => {
      if (hasSubmitted.current || shipsToUpload.length !== 3) return;

      hasSubmitted.current = true;
      const { error } = await supabase.from("placements").insert({
        game_id: gameData.id,
        user_id: session?.user.id,
        ships_data: shipsToUpload,
        is_ready: true,
      });

      if (error) {
        console.error("Upload failed:", error.message);
        hasSubmitted.current = false;
      }
    },
    [gameData.id, session, supabase]
  );

  const toggleReadySignal = async () => {
    if (placedShips.length !== 3) return;

    const field = isP1 ? "p1_placed_ready" : "p2_placed_ready";
    const nextReadyStatus = !myReady;

    // 1. Dacă jucătorul dă CONFIRM (devine ready)
    if (nextReadyStatus) {
      // Încărcăm navele PRIMA DATĂ
      const { error: uploadError } = await supabase.from("placements").upsert(
        {
          game_id: gameData.id,
          user_id: session?.user.id,
          ships_data: placedShips,
          is_ready: true,
        },
        { onConflict: "game_id,user_id" }
      ); // Folosește upsert pentru a evita duplicatele

      if (uploadError) {
        console.error("Eroare la salvarea navelor:", uploadError);
        return;
      }
    }

    // 2. Abia după ce navele sunt în DB, actualizăm starea de "Ready" în tabelul games
    const opponentField = isP1 ? "p2_placed_ready" : "p1_placed_ready";
    const isOpponentReady = gameData[opponentField];

    await supabase
      .from("games")
      .update({
        [field]: nextReadyStatus,
        // Dacă și oponentul e gata, marcăm jocul ca început
        all_placed: nextReadyStatus && isOpponentReady,
      })
      .eq("id", gameData.id);
  };

  const rotateShape = useCallback(() => {
    setCurrentShape((prev) => {
      const rows = prev.length;
      const cols = prev[0].length;
      const newGrid = Array.from({ length: cols }, () => Array(rows).fill(0));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          newGrid[c][rows - 1 - r] = prev[r][c];
        }
      }
      return newGrid;
    });
  }, []);

  const getCenteredCoords = useCallback(
    (row: number, col: number, shape: number[][]) => {
      const coords: string[] = [];
      const height = shape.length;
      const width = shape[0].length;

      let rowOffset = 0;
      let colOffset = 0;

      if (height > width) {
        rowOffset = Math.floor(height / 2);
        colOffset = Math.floor(width / 2);
      } else {
        rowOffset = Math.floor(height / 2) - 1;
        colOffset = Math.floor(width / 2);
      }

      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (shape[r][c] > 0) {
            const targetRow = row - rowOffset + r;
            const targetCol = col - colOffset + c;
            if (
              targetRow < 0 ||
              targetRow >= GRID_SIZE ||
              targetCol < 0 ||
              targetCol >= GRID_SIZE
            )
              return null;
            const coordString = `${LETTERS[targetRow]}${targetCol + 1}`;

            if (shape[r][c] === 2) {
              coords.unshift(coordString);
            } else {
              coords.push(coordString);
            }
          }
        }
      }
      return coords;
    },
    []
  );

  // Calcularea coordonatelor de hover direct în timpul randării
  const hoveredCoords = useMemo(() => {
    if (isPlacing && cursorPos) {
      return getCenteredCoords(cursorPos.r, cursorPos.c, currentShape) || [];
    }
    return [];
  }, [isPlacing, cursorPos, currentShape, getCenteredCoords]);

  const handleAutoPlace = useCallback(async () => {
    if (hasSubmitted.current) return;
    const tempPlaced: Ship[] = [...placedShips];
    let attempts = 0;
    while (tempPlaced.length < 3 && attempts < 500) {
      const rRow = Math.floor(Math.random() * GRID_SIZE);
      const rCol = Math.floor(Math.random() * GRID_SIZE);
      let rShape = COMPLEX_SHAPE;
      const rotations = Math.floor(Math.random() * 4);
      for (let i = 0; i < rotations; i++) {
        const r = rShape.length;
        const c = rShape[0].length;
        const next = Array.from({ length: c }, () => Array(r).fill(0));
        for (let j = 0; j < r; j++)
          for (let k = 0; k < c; k++) next[k][r - 1 - j] = rShape[j][k];
        rShape = next;
      }
      const coords: string[] = [];
      let possible = true;
      for (let r = 0; r < rShape.length; r++) {
        for (let c = 0; c < rShape[r].length; c++) {
          if (rShape[r][c] > 0) {
            if (rRow + r >= GRID_SIZE || rCol + c >= GRID_SIZE) {
              possible = false;
              break;
            }
            const coordString = `${LETTERS[rRow + r]}${rCol + c + 1}`;

            // LOGICA PENTRU VÂRF
            if (rShape[r][c] === 2) {
              coords.unshift(coordString);
            } else {
              coords.push(coordString);
            }
          }
        }
        if (!possible) break;
      }

      if (possible && coords.length > 0) {
        const overlap = coords.some((c) =>
          tempPlaced.flatMap((s) => s.coords).includes(c)
        );
        if (!overlap) {
          tempPlaced.push({
            id: tempPlaced.length + 1,
            coords,
            head_coord: coords[0],
          });
        }
      }
      attempts++;
    }
    setPlacedShips(tempPlaced);
    handleFinalUpload(tempPlaced);
    const field = isP1 ? "p1_placed_ready" : "p2_placed_ready";
    const opponentField = isP1 ? "p2_placed_ready" : "p1_placed_ready";
    const isOpponentReady = gameData[opponentField];

    await supabase
      .from("games")
      .update({
        [field]: true,
        all_placed: isOpponentReady ? true : false,
      })
      .eq("id", gameData.id);
  }, [placedShips, handleFinalUpload, isP1, gameData, supabase]);

  useEffect(() => {
    if (!gameData.placement_started_at) return;
    const startTime = new Date(gameData.placement_started_at).getTime();
    let interval: ReturnType<typeof setInterval>;
    const updateTimer = () => {
      const now = new Date().getTime();
      const secondsPassed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, 60 - secondsPassed);
      setTimeLeft(remaining);
      if (remaining === 0 && !hasSubmitted.current) {
        handleAutoPlace();
        if (interval) clearInterval(interval);
      }
    };
    updateTimer();
    interval = setInterval(updateTimer, 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameData.placement_started_at, handleAutoPlace]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && isPlacing) rotateShape();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlacing, rotateShape]);

  if (!session) return null;

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">
      <div className="w-full max-w-4xl flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-teal-500/20 shadow-lg">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white italic tracking-tight uppercase">
            Strategy Phase
          </h2>
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${
              opponentReady ? "text-green-400" : "text-amber-500 animate-pulse"
            }`}
          >
            {opponentReady
              ? "● Target Confirmed (Opponent Ready)"
              : "○ (Opponent Choosing...)"}
          </p>
        </div>
        <div className="text-2xl font-mono text-red-500 font-bold bg-black/40 px-4 py-1 rounded border border-red-900/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-10">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl relative">
          <div className="flex ml-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-10 h-8 flex items-center justify-center text-gray-500 text-xs font-bold"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="flex flex-col">
              {LETTERS.map((l) => (
                <div
                  key={l}
                  className="w-8 h-10 flex items-center justify-center text-gray-500 text-xs font-bold"
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-10 border border-teal-500/30 bg-gray-950">
              {Array.from({ length: 100 }).map((_, i) => {
                const row = Math.floor(i / 10);
                const col = i % 10;
                const coord = `${LETTERS[row]}${col + 1}`;
                const shipFound = placedShips.find((s) =>
                  s.coords.includes(coord)
                );
                const isHovered = hoveredCoords.includes(coord);

                return (
                  <div
                    key={coord}
                    onMouseEnter={() => {
                      if (isPlacing) setCursorPos({ r: row, c: col });
                    }}
                    onClick={() => {
                      if (!isPlacing && shipFound && !myReady) {
                        setPlacedShips((prev) =>
                          prev.filter((s) => s.id !== shipFound.id)
                        );
                        setIsPlacing(true);
                        return;
                      }

                      if (isPlacing && hoveredCoords.length && !myReady) {
                        const overlap = hoveredCoords.some((c) =>
                          placedShips.flatMap((s) => s.coords).includes(c)
                        );
                        if (!overlap) {
                          const nextId =
                            [1, 2, 3].find(
                              (id) => !placedShips.some((s) => s.id === id)
                            ) || placedShips.length + 1;

                          setPlacedShips([
                            ...placedShips,
                            {
                              id: nextId,
                              coords: hoveredCoords,
                              head_coord: hoveredCoords[0],
                            },
                          ]);
                          setIsPlacing(false);
                          setCursorPos(null);
                        }
                      }
                    }}
                    className={`w-10 h-10 border border-white/5 transition-all duration-150
  ${isHovered ? "bg-white/20" : ""}
  ${
    shipFound
      ? `${SHIP_COLORS[shipFound.id]} cursor-grab active:cursor-grabbing`
      : "cursor-pointer hover:bg-white/5"
  }
`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-64 flex flex-col gap-4">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
            <button
              disabled={isPlacing || placedShips.length >= 3 || myReady}
              onClick={() => setIsPlacing(true)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-20 text-gray-900 font-bold rounded-lg transition shadow-lg"
            >
              {isPlacing ? "POSITIONING UNIT..." : "DEPLOY NEW UNIT"}
            </button>
            <p className="text-[9px] text-gray-500 mt-3 text-center uppercase tracking-tighter italic">
              Tap [R] to rotate formation
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex-1">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => {
                const isDeployed = placedShips.some((s) => s.id === i);
                return (
                  <div
                    key={i}
                    className={`text-[11px] p-3 rounded-lg border flex justify-between items-center transition-all ${
                      isDeployed
                        ? "bg-gray-900 border-white/20 text-white"
                        : "bg-gray-900/50 border-gray-800 text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isDeployed
                            ? SHIP_COLORS[i].split(" ")[0]
                            : "bg-gray-700"
                        }`}
                      ></div>
                      <span className="font-bold tracking-widest">
                        UNIT 0{i}
                      </span>
                    </div>
                    {isDeployed && (
                      <span className="text-[9px] text-teal-500 font-black">
                        LOCKED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={toggleReadySignal}
            disabled={placedShips.length !== 3 || gameData.all_placed}
            className={`w-full py-4 font-black text-sm tracking-widest rounded-lg transition-all shadow-xl ${
              myReady
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
                : "bg-green-600 hover:bg-green-500 text-white shadow-green-900/20"
            }`}
          >
            {myReady ? "REVOKE READINESS" : "CONFIRM DEPLOYMENT"}
          </button>

          {myReady && !gameData.all_placed && (
            <p className="text-[10px] text-amber-500 text-center animate-pulse font-bold uppercase tracking-tighter">
              Awaiting enemy confirmation...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipPlacement;
