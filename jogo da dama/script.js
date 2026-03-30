const board = document.getElementById("board");
let selectedPiece = null;
let currentPlayer = "red"; // você
let cells = [];
let pieces = {};

//-------------------------------
// CRIA TABULEIRO
//-------------------------------
function createBoard() {
    for (let row = 0; row < 8; row++) {
        cells[row] = [];
        for (let col = 0; col < 8; col++) {
            let cell = document.createElement("div");
            cell.classList.add("cell");

            if ((row + col) % 2 === 0) cell.classList.add("white");
            else cell.classList.add("black");

            cell.dataset.row = row;
            cell.dataset.col = col;

            board.appendChild(cell);
            cells[row][col] = cell;

            cell.addEventListener("click", () => cellClick(row, col));
        }
    }
}

//-------------------------------
// COLOCA AS PEÇAS
//-------------------------------
function placePieces() {
    const initialRows = 3;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 !== 0) {
                if (row < initialRows) addPiece(row, col, "blue");
                if (row >= 8 - initialRows) addPiece(row, col, "red");
            }
        }
    }
}

//-------------------------------
// ADICIONAR PEÇA
//-------------------------------
function addPiece(row, col, color) {
    let piece = document.createElement("div");
    piece.classList.add("piece", color);

    piece.dataset.color = color;
    piece.dataset.row = row;
    piece.dataset.col = col;

    if (color === "red") {
        piece.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentPlayer === "red") selectPiece(piece);
        });
    }

    pieces[row + "-" + col] = piece;
    cells[row][col].appendChild(piece);
}

//-------------------------------
// SELECIONAR PEÇA
//-------------------------------
function selectPiece(piece) {
    if (piece.dataset.color !== currentPlayer) return;

    clearHighlights();
    selectedPiece = piece;

    let moves = getValidMoves(piece);
    highlightMoves(moves);
}

//-------------------------------
// MOVIMENTOS VÁLIDOS (COMER INCLUÍDO)
//-------------------------------
function getValidMoves(piece) {
    let moves = [];
    let captures = [];

    let row = Number(piece.dataset.row);
    let col = Number(piece.dataset.col);
    let color = piece.dataset.color;
    let direction = color === "red" ? -1 : 1;

    let steps = [[direction, -1], [direction, 1]];

    if (piece.classList.contains("king")) {
        steps.push([-direction, -1], [-direction, 1]);
    }

    for (let [dr, dc] of steps) {
        let newRow = row + dr;
        let newCol = col + dc;

        let jumpRow = row + dr * 2;
        let jumpCol = col + dc * 2;

        // Movimento sem comer
        if (isInsideBoard(newRow, newCol) && !pieces[newRow + "-" + newCol]) {
            moves.push([newRow, newCol]);
        }

        // Movimento com captura
        if (
            isInsideBoard(jumpRow, jumpCol) &&
            pieces[newRow + "-" + newCol] &&
            pieces[newRow + "-" + newCol].dataset.color !== color &&
            !pieces[jumpRow + "-" + jumpCol]
        ) {
            captures.push([jumpRow, jumpCol, newRow, newCol]); // destino + posição da peça comida
        }
    }

    // Regra de captura obrigatória
    if (captures.length > 0) return captures;

    return moves;
}

//-------------------------------
// HIGHLIGHT
//-------------------------------
function highlightMoves(moves) {
    moves.forEach(m => cells[m[0]][m[1]].classList.add("highlight"));
}

function clearHighlights() {
    document.querySelectorAll(".highlight").forEach(c => c.classList.remove("highlight"));
}

function isInsideBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

//-------------------------------
// CLIQUE NA CASA
//-------------------------------
function cellClick(row, col) {
    if (!selectedPiece) return;

    let moves = getValidMoves(selectedPiece);

    let move = moves.find(m => m[0] === row && m[1] === col);
    if (!move) return;

    let isCapture = move.length === 4;

    if (isCapture) {
        let eatRow = move[2];
        let eatCol = move[3];

        let eaten = pieces[eatRow + "-" + eatCol];
        if (eaten) {
            eaten.remove();
            delete pieces[eatRow + "-" + eatCol];
        }
    }

    movePiece(selectedPiece, row, col);

    selectedPiece = null;
    clearHighlights();

    currentPlayer = "blue";
    setTimeout(aiMove, 400);
}

//-------------------------------
// MOVIMENTO DA PEÇA
//-------------------------------
function movePiece(piece, row, col) {
    let oldRow = Number(piece.dataset.row);
    let oldCol = Number(piece.dataset.col);

    delete pieces[oldRow + "-" + oldCol];

    piece.dataset.row = row;
    piece.dataset.col = col;
    pieces[row + "-" + col] = piece;

    cells[row][col].appendChild(piece);

    if ((row === 0 && piece.dataset.color === "red") ||
        (row === 7 && piece.dataset.color === "blue")) {
        piece.classList.add("king");
    }
}

//-------------------------------
// 🤖 IA AZUL COMENDO TAMBÉM
//-------------------------------
function aiMove() {
    let aiPieces = Object.values(pieces).filter(p => p.dataset.color === "blue");
    let bestMoves = [];

    // Capturas primeiro (obrigatórias)
    aiPieces.forEach(piece => {
        let moves = getValidMoves(piece);
        if (moves.length > 0 && moves[0].length === 4) { // captura
            moves.forEach(m => bestMoves.push({ piece, move: m }));
        }
    });

    // Se não tiver captura, movimentos normais
    if (bestMoves.length === 0) {
        aiPieces.forEach(piece => {
            let moves = getValidMoves(piece);
            moves.forEach(m => bestMoves.push({ piece, move: m }));
        });
    }

    if (bestMoves.length === 0) return; // IA perdeu

    let choice = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    let m = choice.move;

    // comer
    if (m.length === 4) {
        let eatRow = m[2];
        let eatCol = m[3];

        let eaten = pieces[eatRow + "-" + eatCol];
        if (eaten) {
            eaten.remove();
            delete pieces[eatRow + "-" + eatCol];
        }
    }

    movePiece(choice.piece, m[0], m[1]);

    currentPlayer = "red";
}

//-------------------------------
createBoard();
placePieces();