import assert from 'node:assert';
import { Board } from './board.js';

/**
 * Execute a simulation of Memory Scramble with automated players.
 * This demonstrates the game mechanics with players making random moves.
 * 
 * @throws Error if the board file cannot be loaded or parsed
 */
async function simulationMain(): Promise<void> {
    const filename = 'boards/ab.txt';
    const board: Board = await Board.parseFromFile(filename);
    const size = 5;
    const players = 1;
    const tries = 10;
    const maxDelayMilliseconds = 100;

    assert(size > 0 && Number.isInteger(size));

    // start up one or more players as concurrent asynchronous function calls
    const playerPromises: Array<Promise<void>> = [];
    for (let ii = 0; ii < players; ++ii) {
        playerPromises.push(player(ii));
    }
    // wait for all the players to finish (unless one throws an exception)
    await Promise.all(playerPromises);

    /**
     * Simulate one automated player attempting to find card matches.
     * 
     * @param playerNumber numeric identifier for this simulated player
     */
    async function player(playerNumber: number): Promise<void> {
        const playerId = `p${playerNumber}`;
        board.registerPlayer(playerId, `Player ${playerNumber}`);

        for (let jj = 0; jj < tries; ++jj) {
            try {
                await timeout(Math.random() * maxDelayMilliseconds);
                const r1 = randomInt(size);
                const c1 = randomInt(size);

                // guard: must be on-board, non-empty, face-down
                if (r1 >= board.numRows() || c1 >= board.numCols()) {
                    // out of bounds relative to actual board; skip this attempt
                    continue;
                }
                if (board.pictureAt(r1, c1) === null || board.isFaceUp(r1, c1)) {
                    // empty or already face-up; skip this attempt
                    continue;
                }

                board.flipUp(playerId, r1, c1);
                console.log(`player ${playerId}: flipped first at (${r1},${c1}) = ${board.pictureAt(r1, c1)}`);

                await timeout(Math.random() * maxDelayMilliseconds);

                let flippedSecond = false;
                const r2 = randomInt(size);
                const c2 = randomInt(size);

                if (r2 < board.numRows() && c2 < board.numCols()
                    && board.pictureAt(r2, c2) !== null
                    && !board.isFaceUp(r2, c2)) {

                    board.flipUp(playerId, r2, c2);
                    flippedSecond = true;
                    console.log(`player ${playerId}: flipped second at (${r2},${c2}) = ${board.pictureAt(r2, c2)}`);

                    // log whether they match, then flip both back down.
                    const p1 = board.pictureAt(r1, c1);
                    const p2 = board.pictureAt(r2, c2);
                    if (p1 !== null && p2 !== null) {
                        console.log(`player ${playerId}: ${p1 === p2 ? 'MATCH' : 'no match'}`);
                    }
                }

                // flip back down to keep exploring in P1
                if (flippedSecond && board.isFaceUp(r2, c2)) {
                    board.flipDown(r2, c2);
                }
                if (board.isFaceUp(r1, c1)) {
                    board.flipDown(r1, c1);
                }

            } catch (err) {
                console.error('attempt to flip a card failed:', err);
            }
        }
    }
}

/**
 * Generate a random integer from 0 (inclusive) to max (exclusive).
 * 
 * @param max the upper bound (exclusive), must be positive
 * @returns a random integer in the range [0, max)
 */
function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

/**
 * Asynchronously pause execution for the specified duration.
 * 
 * @param milliseconds how long to wait in milliseconds
 * @returns a promise that fulfills after the wait period
 */
async function timeout(milliseconds: number): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, milliseconds);
    return promise;
}

void simulationMain();
