import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Board } from '../src/board.js';
import { Player } from '../src/player.js';

describe('Board (Problem 1)', function () {

    function tmpfile(contents: string): string {
        const f = path.join(os.tmpdir(), `board-${Math.random().toString(36).slice(2)}.txt`);
        fs.writeFileSync(f, contents);
        return f;
    }

    it('parses 1x1 board', async function () {
        const f = tmpfile('1x1\nA\n');
        const b = await Board.parseFromFile(f);
        assert.equal(b.numRows(), 1);
        assert.equal(b.numCols(), 1);
        assert.equal(b.pictureAt(0, 0), 'A');
        assert.match(b.picturesDump(), /^1x1\nA\n$/);
    });

    it('parses 2x3 with CRLF', async function () {
        const f = tmpfile('2x3\r\nX\r\nY\r\nZ\r\nX\r\nY\r\nZ\r\n');
        const b = await Board.parseFromFile(f);
        assert.equal(b.numRows(), 2);
        assert.equal(b.numCols(), 3);
        const pics = [
        b.pictureAt(0,0), b.pictureAt(0,1), b.pictureAt(0,2),
        b.pictureAt(1,0), b.pictureAt(1,1), b.pictureAt(1,2),
        ];
        assert.deepEqual(pics, ['X','Y','Z','X','Y','Z']);
    });

    it('rejects bad headers', async function () {
        for (const txt of ['foo\nA\n', '3x\nA\n', 'x3\nA\n', '0x2\nA\nA\n', '-1x2\nA\nA\n']) {
        const f = tmpfile(txt);
        await assert.rejects(Board.parseFromFile(f));
        }
    });

    it('rejects wrong number of cards', async function () {
        const few = tmpfile('2x2\nA\nB\nC\n');
        const many = tmpfile('2x2\nA\nB\nC\nD\nE\n');
        await assert.rejects(Board.parseFromFile(few));
        await assert.rejects(Board.parseFromFile(many));
    });

    it('rejects whitespace/empty card tokens', async function () {
        const withSpace = tmpfile('1x2\nhello world\nB\n');
        const empty = tmpfile('1x1\n\n');
        await assert.rejects(Board.parseFromFile(withSpace));
        await assert.rejects(Board.parseFromFile(empty));
    });

    it('basic flipUp/flipDown and controller', async function () {
        const f = tmpfile('1x2\nA\nB\n');
        const b = await Board.parseFromFile(f);

        // register player and flip
        const p = b.registerPlayer('p1', 'Alice');
        assert.equal(p.getDisplayName(), 'Alice');

        // initially face down
        assert.equal(b.isFaceUp(0,0), false);
        assert.equal(b.controllerAt(0,0), null);

        b.flipUp('p1', 0, 0);
        assert.equal(b.isFaceUp(0,0), true);
        assert.equal(b.controllerAt(0,0), 'p1');
        assert.equal(p.getFlips(), 1);

        // cannot flip up again
        assert.throws(() => b.flipUp('p1', 0, 0));

        // flip down
        b.flipDown(0, 0);
        assert.equal(b.isFaceUp(0,0), false);
        assert.equal(b.controllerAt(0,0), null);

        // cannot flip down again
        assert.throws(() => b.flipDown(0, 0));
    });

    it('rejects unknown player flip', async function () {
        const f = tmpfile('1x1\nX\n');
        const b = await Board.parseFromFile(f);
        assert.throws(() => b.flipUp('ghost', 0, 0));
    });

    it('out-of-bounds guards', async function () {
        const f = tmpfile('1x1\nX\n');
        const b = await Board.parseFromFile(f);
        assert.throws(() => b.pictureAt(-1, 0));
        assert.throws(() => b.isFaceUp(0, 1));
        assert.throws(() => b.controllerAt(1, 0));
        assert.throws(() => b.flipUp('nope', 1, 0));
    });
});
