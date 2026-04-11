const canvas = document.getElementById('gameCanvas');
const gl = canvas.getContext('webgl');
gl.clearColor(0.8,0.8,0.8,1.0);

const gridSize = 10;
const cellSize = 2 / gridSize;

let players = [
  { pos: 0, color: [1, 0, 0, 1] },
  { pos: 0, color: [0, 0, 1, 1] } 
];
let currentPlayer = 0;

const ladders = { 3: 13, 8: 30, 27: 83, 39: 58 };
const snakes  = { 16: 6, 86: 23, 98: 77, 72: 52 };

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);


const vsSource = `
attribute vec2 pos;
void main() {
  gl_Position = vec4(pos, 0, 1);
}`;
const fsSource = `
precision mediump float;
uniform vec4 col;
void main() {
  gl_FragColor = vec4(col);
}`;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vsSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const positionLoc = gl.getAttribLocation(program, 'pos');
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

const colorLoc = gl.getUniformLocation(program, 'col');

function cellToCoords(cell) {
  const row = Math.floor(cell / gridSize);
  const col = row % 2 === 0 ? cell % gridSize : gridSize - 1 - (cell % gridSize);
  const x = -1 + col * cellSize + cellSize / 2;
  const y = -1 + row * cellSize + cellSize / 2;
  return [x, y];
}

function drawSquare(x, y, size, color) {
  const half = size / 2;
  const vertices = new Float32Array([
    x - half, y - half,
    x + half, y - half,
    x + half, y + half,
    x - half, y + half
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.uniform4fv(colorLoc, color);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function drawTileNumbers() {
  const numberLayer = document.getElementById('numberLayer');
  numberLayer.innerHTML = ''; 
  
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / gridSize);
    const col = row % 2 === 0 ? i % gridSize : gridSize - 1 - (i % gridSize);

    const div = document.createElement('div');
    div.innerText = i;
    div.style.position = 'absolute';
    div.style.fontSize = '12px';
    div.style.color = '#000';
    div.style.left = `${(col * 50) + 2}px`;  // 500px / 10 = 50px per cell
    div.style.top = `${(9 - row) * 50 + 2}px`; // Flip vertically
    div.style.pointerEvents = 'none';
    numberLayer.appendChild(div);
  }
}


function drawLine(x1, y1, x2, y2, color) {
  const lineVertices = new Float32Array([x1, y1, x2, y2]);
  gl.bufferData(gl.ARRAY_BUFFER, lineVertices, gl.STATIC_DRAW);
  gl.uniform4fv(colorLoc, color);
  gl.drawArrays(gl.LINES, 0, 2);
}

function drawBoard() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for (let i = 0; i <= gridSize; i++) {
    let pos = -1 + i * cellSize;
    drawLine(-1, pos, 1, pos, [0, 0, 0, 1]);
    drawLine(pos, -1, pos, 1, [0, 0, 0, 1]);
  }

  for (const [start, end] of Object.entries(ladders)) {
    const [x1, y1] = cellToCoords(Number(start));
    const [x2, y2] = cellToCoords(end);
    drawLine(x1, y1, x2, y2, [0, 1, 0, 1]);
  }

  for (const [start, end] of Object.entries(snakes)) {
    const [x1, y1] = cellToCoords(Number(start));
    const [x2, y2] = cellToCoords(end);
    drawLine(x1, y1, x2, y2, [1, 0, 0, 1]);
  }

  for (const player of players) {
    const [x, y] = cellToCoords(player.pos);
    drawSquare(x, y, 0.15, player.color);
  }

  drawTileNumbers(); 
}


function animateDiceRoll(callback) {
  let count = 0;
  const interval = setInterval(() => {
    const tempRoll = Math.floor(Math.random() * 6) + 1;
    document.getElementById('diceResult').innerText = `Dice: ${tempRoll}`;
    count++;
    if (count >= 10) {
      clearInterval(interval);
      callback(tempRoll);
    }
  }, 100);
}

function rollDice() {
  animateDiceRoll(dice => {
    let player = players[currentPlayer];
    player.pos += dice;
    if (player.pos > 99) player.pos = 99;

    if (ladders[player.pos]) player.pos = ladders[player.pos];
    if (snakes[player.pos])  player.pos = snakes[player.pos];

    currentPlayer = (currentPlayer + 1) % players.length;
    drawBoard();
  });
}

drawBoard();
