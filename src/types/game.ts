
export const GRID_SIZE = 10;
export const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // Coordonatele Coloanelor
export const ROWS = Array.from({ length: GRID_SIZE }, (_, i) => i + 1); // Coordonatele Rândurilor

// === CONSTANTE PENTRU AVION (AIRCRAFT) ===

/**
 * Matricea de bază a Avionului (5x5). 
 * 1 = Celulă ocupată de avion. 
 * 0 = Celulă goală.
 * Punctul (0, 2) este Vârful (Cabina de pilotaj) - Punctul CRITIC.
 */
export const AIRCRAFT_SHAPE: number[][] = [
    // 0 1 2 3 4 (Delta X)
    [0, 0, 1, 0, 0], // Rândul 0 (Vârful)
    [1, 1, 1, 1, 1], // Rândul 1 (Aripa principală)
    [0, 0, 1, 0, 0], // Rândul 2 (Fuselage)
    [0, 1, 1, 1, 0], // Rândul 3 (Aripa Secundară/Coada)
    [0, 0, 0, 0, 0]  // Rândul 4 (Spațiu de buffer)
];
export const AIRCRAFT_MATRIX_SIZE = 5;

// Coordonatele relative ale punctului CRITIC (în forma 5x5)
export const CRITICAL_POINT_RELATIVE = { x: 2, y: 0 }; 

// Tipuri pentru orientarea avionului
export type AircraftOrientation = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';


// === TIPURI PENTRU STAREA JOCULUI ===

/**
 * Definește modul în care un Avion este plasat pe grila 10x10.
 */
export interface AircraftPlacement {
    // Coordonata colțului superior stânga (0,0) al matricei 5x5 pe grila 10x10.
    start: { x: number; y: number }; 
    orientation: AircraftOrientation;
    // NU salvăm vârful, deoarece el este calculat pe baza start + orientare.
}

/**
 * Starea unei celule pe grilă.
 */
export type CellState = 
  'empty' | // Celulă liberă
  'aircraft' | // Celulă ocupată de avion
  'hit' | // Lovitură normală pe avion
  'critical_hit' | // Lovitură pe punctul CRITIC (Avion distrus)
  'miss';   // Celulă lovită, dar goală

/**
 * Definește structura unei mutări (lovituri) înregistrate în baza de date.
 */
export interface Move {
    id: string;
    game_id: string;
    shooter_id: string;
    target_id: string;
    target_x: number;
    target_y: number;
    is_hit: boolean;
    is_critical_hit: boolean; // Stochează informația despre distrugerea avionului
    created_at: Date;
}

/**
 * Starea completă a unei grile pentru un jucător (pentru vizualizare)
 */
export type GridData = CellState[][];