// --- All Fall Down ---

// --- Start Screen Overlay Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    if (startScreen && startBtn) {
        startBtn.addEventListener('click', () => {
            startScreen.classList.add('fade-out');
            setTimeout(() => {
                startScreen.style.display = 'none';
                // Optionally, you could start the game here if needed
            }, 600);
        });
    }
});

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const ROWS = 20;
const COLS = 10;
let CELL_SIZE = 30;

function resizeCanvas() {
    // Use the rendered size of the canvas for pixel-perfect scaling
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    CELL_SIZE = Math.floor(Math.min(displayWidth / COLS, displayHeight / ROWS));
    canvas.width = CELL_SIZE * COLS;
    canvas.height = CELL_SIZE * ROWS;
    if (typeof board !== 'undefined' && board) {
        drawBoard();
    }
}



window.addEventListener('resize', () => {
    resizeCanvas();
    drawBoard();
});

// (Removed initial resizeCanvas call)
const COLORS = ['#00bfff', '#0047ff', '#39ff14', '#ff00cc', '#ffe600']; // More distinct neon blues and other tech colors
const SCORE_PER_CLEAR = 100;
const BORDER_COLORS = ['#ffb347', '#00bfff', '#39ff14', '#ff00cc', '#ffe600'];

function updateLevel() {
    const newLevel = Math.floor(score / 5000) + 1;
    if (newLevel !== level) {
        level = newLevel;
        document.getElementById('level').textContent = 'Level: ' + level;
        const color = BORDER_COLORS[(level - 1) % BORDER_COLORS.length];
        document.getElementById('game-board').style.border = '4px solid ' + color;
    }
}

let board, current, nextTetromino, score, level, gameOver, dropInterval, dropTimer, paused = false;

function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Tetromino shapes (each cell will have a color)
const TETROMINOES = [
    // I
    [ [1,1,1,1] ],
    // O
    [ [1,1], [1,1] ],
    // T
    [ [0,1,0], [1,1,1] ],
    // S
    [ [0,1,1], [1,1,0] ],
    // Z
    [ [1,1,0], [0,1,1] ],
    // J
    [ [1,0,0], [1,1,1] ],
    // L
    [ [0,0,1], [1,1,1] ]
];

function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(null));
}

function createTetromino() {
    const shape = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    // Find all filled cell positions
    const filledCells = [];
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) filledCells.push([r, c]);
        }
    }
    // Assign random colors, but never more than 2 of the same color per piece
    const colorCounts = {};
    const coloredShape = shape.map(row => row.map(cell => cell ? null : null));
    for (let i = 0; i < filledCells.length; i++) {
        let color;
        let tries = 0;
        do {
            color = COLORS[Math.floor(Math.random() * COLORS.length)];
            tries++;
        } while (colorCounts[color] >= 2 && tries < 20);
        colorCounts[color] = (colorCounts[color] || 0) + 1;
        const [r, c] = filledCells[i];
        coloredShape[r][c] = color;
    }
    return {
        shape: coloredShape,
        row: 0,
        col: Math.floor((COLS - coloredShape[0].length) / 2)
    };
}


function canMove(tetro, dr, dc, newShape=null) {
    if (!tetro) return false;
    const shape = newShape || tetro.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                let nr = tetro.row + r + dr;
                let nc = tetro.col + c + dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function mergeTetromino(tetro) {
    if (!tetro || !tetro.shape) return; // Prevents crash if tetro is null
    for (let r = 0; r < tetro.shape.length; r++) {
        for (let c = 0; c < tetro.shape[r].length; c++) {
            if (tetro.shape[r][c]) {
                board[tetro.row + r][tetro.col + c] = tetro.shape[r][c];
            }
        }
    }
}

function rotate(shape) {
    const rows = shape.length, cols = shape[0].length;
    let newShape = Array.from({length: cols}, () => Array(rows).fill(null));
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            newShape[c][rows - 1 - r] = shape[r][c];
    return newShape;
}

function drawCell(r, c, color) {
    let x = c * CELL_SIZE, y = r * CELL_SIZE;
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + CELL_SIZE * 0.22, y);
    ctx.arcTo(x + CELL_SIZE, y, x + CELL_SIZE, y + CELL_SIZE, CELL_SIZE * 0.32);
    ctx.arcTo(x + CELL_SIZE, y + CELL_SIZE, x, y + CELL_SIZE, CELL_SIZE * 0.32);
    ctx.arcTo(x, y + CELL_SIZE, x, y, CELL_SIZE * 0.32);
    ctx.arcTo(x, y, x + CELL_SIZE, y, CELL_SIZE * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#222e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function drawBoard(matchOverlay = null, matchColor = 'white') {
    drawNextPiecePreview();
    // Fill background with dark color
    ctx.fillStyle = '#181c20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw grid overlay
    ctx.save();
    ctx.strokeStyle = '#00bfff18'; // even more subtle
    ctx.lineWidth = 1;
    for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(canvas.width, r * CELL_SIZE);
        ctx.stroke();
    }
    for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    ctx.restore();

    // Draw board
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                // If this cell is matched, draw with highlight
                if (matchOverlay && matchOverlay[r][c]) {
                    let color = typeof matchColor === 'function' ? matchColor(r, c) : matchColor;
                    drawCell(r, c, color);
                } else {
                    drawCell(r, c, board[r][c]);
                }
            }
        }
    }
    // Draw current tetromino (hide during gravity/animation)
    if (current && !animatingDrop) {

        // Draw current piece blocks
        for (let r = 0; r < current.shape.length; r++) {
            for (let c = 0; c < current.shape[r].length; c++) {
                if (current.shape[r][c]) {
                    drawCell(current.row + r, current.col + c, current.shape[r][c]);
                }
            }
        }
    }
}

async function clearMatches() {
    // Helper to mark grounded blocks (vertical-only)
    function computeGrounded(board) {
        let grounded = Array.from({length: ROWS}, () => Array(COLS).fill(false));
        for (let c = 0; c < COLS; c++) {
            for (let r = ROWS - 1; r >= 0; r--) {
                if (board[r][c]) {
                    if (r === ROWS - 1 || grounded[r + 1][c]) {
                        grounded[r][c] = true;
                    }
                } else {
                    break;
                }
            }
        }
        return grounded;
    }
    // Save grounded map before clearing
    let groundedBefore = computeGrounded(board.map(row => row.slice()));
    // 1. Check for and clear full rows (Tetris style)
    // Find full rows before clearing for animation
    let fullRows = [];
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell)) {
            fullRows.push(r);
        }
    }
    // Animate flash for full rows
    if (fullRows.length > 0) {
        for (let flash = 0; flash < 3; flash++) {
            drawBoard(
                // Build overlay mask for full rows
                Array.from({length: ROWS}, (_, r) => Array.from({length: COLS}, (_, c) => fullRows.includes(r))),
                (r, c) => {
                    if (flash % 2 === 0) return 'white';
                    return board[r][c] || 'white';
                }
            );
            await new Promise(res => setTimeout(res, 100));
        }
    }
    // Now actually clear the rows
    for (let row of fullRows) {
        board.splice(row, 1);
        board.unshift(Array(COLS).fill(null));
    }
    let rowsCleared = fullRows.length;
    if (rowsCleared > 0) {
        score += rowsCleared * COLS * SCORE_PER_CLEAR;
        document.getElementById('score').textContent = 'Score: ' + score;
        updateLevel();
        drawBoard();
        // Compute grounded map after row clear
        let groundedAfter = computeGrounded(board.map(row => row.slice()));
        let dropMask = Array.from({length: ROWS}, () => Array(COLS).fill(false));
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (groundedBefore[r][c] && !groundedAfter[r][c] && board[r][c]) {
                    dropMask[r][c] = true;
                }
            }
        }
        await applyIndividualBlockGravity(dropMask);
        setTimeout(clearMatches, 100); // Repeat for possible combos
        return;
    }

    // 2. Now check for color-matching clusters
    let toClear = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    let visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    let directions = [ [0,1], [1,0], [0,-1], [-1,0] ];

    function bfs(sr, sc, color) {
        let queue = [[sr, sc]];
        let group = [[sr, sc]];
        visited[sr][sc] = true;
        while (queue.length > 0) {
            let [r, c] = queue.shift();
            for (let [dr, dc] of directions) {
                let nr = r + dr, nc = c + dc;
                if (
                    nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
                    !visited[nr][nc] && board[nr][nc] === color
                ) {
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                    group.push([nr, nc]);
                }
            }
        }
        return group;
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] && !visited[r][c]) {
                let group = bfs(r, c, board[r][c]);
                if (group.length >= 3) {
                    for (let [gr, gc] of group) {
                        toClear[gr][gc] = true;
                    }
                }
            }
        }
    }
    // Animate match before clearing
    let hasMatch = false;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (toClear[r][c]) hasMatch = true;
        }
    }
    if (hasMatch) {
        // Hide current tetromino during flash
        let prevCurrent = current;
        current = null;
        for (let flash = 0; flash < 3; flash++) {
            // Custom draw: alternate between white and the block's own color for each clearing cell
            drawBoard(toClear, (r, c) => {
                if (flash % 2 === 0) return 'white';
                // Use the color from the board before clearing
                return board[r][c] || 'white';
            });
            await new Promise(res => setTimeout(res, 100));
        }
        current = prevCurrent;
    }
    // Clear and drop
    let cleared = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (toClear[r][c]) {
                board[r][c] = null;
                cleared++;
            }
        }
    }
    // Compute grounded map after clearing
    let groundedAfter = computeGrounded(board.map(row => row.slice()));
    // Build a dropMask: true for blocks that are not grounded after the clear
    let dropMask = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!groundedAfter[r][c] && board[r][c]) {
                dropMask[r][c] = true;
            }
        }
    }
    if (cleared > 0) {
        score += cleared * SCORE_PER_CLEAR;
        document.getElementById('score').textContent = 'Score: ' + score;
        updateLevel();
        drawBoard();
        await applyIndividualBlockGravity(dropMask);
        setTimeout(clearMatches, 100); // Chain reactions
    }
}

let animatingDrop = false;

async function applyIndividualBlockGravity() {
    animatingDrop = true;
    let anyMoved;
    do {
        anyMoved = false;
        // 1. Mark grounded blocks: only direct vertical connection to bottom counts
        let grounded = Array.from({length: ROWS}, () => Array(COLS).fill(false));
        for (let c = 0; c < COLS; c++) {
            for (let r = ROWS - 1; r >= 0; r--) {
                if (board[r][c]) {
                    if (r === ROWS - 1 || grounded[r + 1][c]) {
                        grounded[r][c] = true;
                    }
                } else {
                    break;
                }
            }
        }
        // 2. Find all ungrounded blocks that can fall
        let toMove = [];
        for (let r = ROWS - 2; r >= 0; r--) {
            for (let c = 0; c < COLS; c++) {
                if (
                    board[r][c] &&
                    !grounded[r][c] &&
                    !board[r+1][c]
                ) {
                    toMove.push([r, c]);
                }
            }
        }
        if (toMove.length > 0) {
            for (let [r, c] of toMove) {
                board[r+1][c] = board[r][c];
                board[r][c] = null;
            }
            drawBoard();
            await new Promise(res => setTimeout(res, 80));
            anyMoved = true;
        }
    } while (anyMoved);
    animatingDrop = false;
}



async function gameLoop() {
    if (gameOver || paused) return;
    if (animatingDrop) return; // Prevent input during animation
    if (!current) return; // Prevents crash if current is null
    if (canMove(current, 1, 0)) {
        current.row++;
    } else {
        mergeTetromino(current);
        await clearMatches();
        // Check for game over
        if (current && current.row === 0) {
            gameOver = true;
            document.getElementById('score').textContent += ' - GAME OVER';
            return;
        }
        current = nextTetromino;
        nextTetromino = createTetromino();
    }
    drawBoard();
}

function startGame() {
    board = createBoard();
    nextTetromino = createTetromino();
    current = nextTetromino;
    nextTetromino = createTetromino();
    score = 0;
    level = 1;
    gameOver = false;
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('level').textContent = 'Level: 1';
    document.getElementById('game-board').style.border = '4px solid ' + BORDER_COLORS[0];
    resizeCanvas();
    drawBoard();
    drawNextPiecePreview();
    clearInterval(dropTimer);
    dropTimer = setInterval(gameLoop, 500);
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !gameOver) {
        // Toggle pause/resume
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.click();
        e.preventDefault();
        return;
    }
    if (paused) return;
    if (gameOver || animatingDrop) return;
    if (e.key === 'ArrowLeft' && canMove(current, 0, -1)) {
        current.col--;
    } else if (e.key === 'ArrowRight' && canMove(current, 0, 1)) {
        current.col++;
    } else if (e.key === 'ArrowDown' && canMove(current, 1, 0)) {
        current.row++;
    } else if (e.key === 'ArrowUp') {
        let newShape = rotate(current.shape);
        if (canMove(current, 0, 0, newShape)) {
            current.shape = newShape;
        }
    }
    drawBoard();
});

document.getElementById('restart-btn').onclick = startGame;

const pauseBtn = document.getElementById('pause-btn');
pauseBtn.onclick = function() {
    if (!paused) {
        paused = true;
        pauseBtn.textContent = 'Resume';
        clearInterval(dropTimer);
    } else {
        paused = false;
        pauseBtn.textContent = 'Pause';
        clearInterval(dropTimer);
        dropTimer = setInterval(gameLoop, 500);
    }
};

startGame();

// --- Touch Controls for Mobile ---
function triggerKey(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', {key}));
}

document.getElementById('btn-left')?.addEventListener('touchstart', e => { e.preventDefault(); triggerKey('ArrowLeft'); }, { passive: false });
document.getElementById('btn-right')?.addEventListener('touchstart', e => { e.preventDefault(); triggerKey('ArrowRight'); }, { passive: false });
document.getElementById('btn-rotate')?.addEventListener('touchstart', e => { e.preventDefault(); triggerKey('ArrowUp'); }, { passive: false });
document.getElementById('btn-down')?.addEventListener('touchstart', e => { e.preventDefault(); triggerKey('ArrowDown'); }, { passive: false });
document.getElementById('btn-drop')?.addEventListener('touchstart', e => { 
    e.preventDefault(); 
    triggerKey(' ');
}, { passive: false });
document.getElementById('btn-touch-pause')?.addEventListener('touchstart', e => { 
    e.preventDefault(); 
    document.getElementById('pause-btn')?.click();
}, { passive: false });


function drawNextPiecePreview() {
    const preview = document.getElementById('next-piece-canvas');
    if (!preview || !nextTetromino) return;
    const ctx2 = preview.getContext('2d');
    ctx2.clearRect(0, 0, preview.width, preview.height);
    // Find shape bounds
    const shape = nextTetromino.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    // Calculate cell size to fit in preview canvas with more padding
    const cellSize = Math.floor(Math.min((preview.width-36)/cols, (preview.height-36)/rows));
    const offsetX = Math.floor((preview.width - (cols * cellSize)) / 2);
    const offsetY = Math.floor((preview.height - (rows * cellSize)) / 2);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape[r][c]) {
                ctx2.save();
                ctx2.shadowBlur = 8;
                ctx2.shadowColor = shape[r][c];
                ctx2.fillStyle = shape[r][c];
                ctx2.strokeStyle = '#222e';
                ctx2.lineWidth = 2;
                ctx2.beginPath();
                ctx2.moveTo(offsetX + c*cellSize + cellSize*0.22, offsetY + r*cellSize);
                ctx2.arcTo(offsetX + (c+1)*cellSize, offsetY + r*cellSize, offsetX + (c+1)*cellSize, offsetY + (r+1)*cellSize, cellSize*0.32);
                ctx2.arcTo(offsetX + (c+1)*cellSize, offsetY + (r+1)*cellSize, offsetX + c*cellSize, offsetY + (r+1)*cellSize, cellSize*0.32);
                ctx2.arcTo(offsetX + c*cellSize, offsetY + (r+1)*cellSize, offsetX + c*cellSize, offsetY + r*cellSize, cellSize*0.32);
                ctx2.arcTo(offsetX + c*cellSize, offsetY + r*cellSize, offsetX + (c+1)*cellSize, offsetY + r*cellSize, cellSize*0.32);
                ctx2.closePath();
                ctx2.fill();
                ctx2.shadowBlur = 0;
                ctx2.stroke();
                ctx2.restore();
            }
        }
    }
}
