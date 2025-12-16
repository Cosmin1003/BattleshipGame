// src/utils/aircraft.ts
import { AIRCRAFT_SHAPE, AIRCRAFT_MATRIX_SIZE, type AircraftOrientation } from '../types/game';

/**
 * Rotește matricea 5x5 cu 90 de grade în sens orar.
 */
function rotateMatrix90(matrix: number[][]): number[][] {
    const N = AIRCRAFT_MATRIX_SIZE;
    const rotated: number[][] = Array(N).fill(null).map(() => Array(N).fill(0));

    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            // Formula de rotație (matricea transpusă inversată pe rânduri)
            rotated[x][N - 1 - y] = matrix[y][x];
        }
    }
    return rotated;
}

/**
 * Returnează forma Avionului (matricea 5x5) rotită pentru o anumită orientare.
 */
export function getAircraftShapeForOrientation(orientation: AircraftOrientation): number[][] {
    let currentShape = AIRCRAFT_SHAPE;

    switch (orientation) {
        case 'NORTH':
            return AIRCRAFT_SHAPE; // Forma de bază

        case 'EAST':
            // Rotație 90 grade
            return rotateMatrix90(currentShape);

        case 'SOUTH':
            // Rotație 180 grade
            currentShape = rotateMatrix90(currentShape);
            return rotateMatrix90(currentShape);

        case 'WEST':
            // Rotație 270 grade
            currentShape = rotateMatrix90(currentShape);
            currentShape = rotateMatrix90(currentShape);
            return rotateMatrix90(currentShape);
            
        default:
            return AIRCRAFT_SHAPE;
    }
}