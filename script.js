// 简洁扫雷逻辑（原生 JS）
const boardEl = document.getElementById('board');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const minesInput = document.getElementById('mines');
const startBtn = document.getElementById('start');
const remainingEl = document.getElementById('remaining');
const timeEl = document.getElementById('time');

let rows=9, cols=9, mines=10;
let grid=[]; // {mine:boolean, open:boolean, flag:boolean, adjacent:number}
let timer=null, seconds=0, started=false, remaining=0, cellsLeft=0;

startBtn.addEventListener('click', ()=>initGame());

function initGame(){
  rows = clamp(+rowsInput.value || 9,5,30);
  cols = clamp(+colsInput.value || 9,5,30);
  mines = clamp(+minesInput.value || 10,1,rows*cols-1);
  remaining = mines;
  remainingEl.textContent = remaining;
  timeEl.textContent = '0';
  seconds = 0; started=false;
  clearInterval(timer);

  grid = Array.from({length:rows}, ()=>Array.from({length:cols}, ()=>({mine:false,open:false,flag:false,adjacent:0})));
  boardEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  boardEl.innerHTML = '';

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const cell = document.createElement('div');
      cell.className='cell';
      cell.dataset.r=r; cell.dataset.c=c;
      cell.addEventListener('click', onCellClick);
      cell.addEventListener('contextmenu', onCellRightClick);
      boardEl.appendChild(cell);
    }
  }

  cellsLeft = rows*cols - mines;
}

function placeMines(firstR, firstC){
  let placed=0;
  const total=rows*cols;
  while(placed < mines){
    const idx = Math.floor(Math.random()*total);
    const r=Math.floor(idx/cols), c=idx%cols;
    // avoid placing mine on first click cell and its neighbors
    if(grid[r][c].mine) continue;
    if(Math.abs(r-firstR)<=1 && Math.abs(c-firstC)<=1) continue;
    grid[r][c].mine = true; placed++;
  }
  // compute adjacent counts
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(grid[r][c].mine) continue;
      let cnt=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        if(dr===0&&dc===0) continue; const nr=r+dr, nc=c+dc;
        if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&grid[nr][nc].mine) cnt++;
      }
      grid[r][c].adjacent = cnt;
    }
  }
}

function onCellClick(e){
  const r=+this.dataset.r, c=+this.dataset.c;
  // start on first click
  if(!started){
    placeMines(r,c);
    started=true; timer = setInterval(()=>{seconds++; timeEl.textContent=seconds},1000);
  }
  openCell(r,c);
}

function onCellRightClick(e){
  e.preventDefault();
  const r=+this.dataset.r, c=+this.dataset.c;
  if(grid[r][c].open) return;
  grid[r][c].flag = !grid[r][c].flag;
  const el = getCellEl(r,c);
  if(grid[r][c].flag){ el.classList.add('flag'); el.textContent='🚩'; remaining--; }
  else { el.classList.remove('flag'); el.textContent=''; remaining++; }
  remainingEl.textContent = remaining;
}

function openCell(r,c){
  const cell = grid[r][c];
  if(cell.open || cell.flag) return;
  const el = getCellEl(r,c);
  cell.open = true; el.classList.add('open');
  if(cell.mine){
    el.classList.add('mine'); el.textContent='💣';
    gameOver(false);
    return;
  }
  cellsLeft--;
  if(cell.adjacent>0){ el.textContent = cell.adjacent; el.style.color = colorFor(cell.adjacent); }
  else{ // flood fill
    el.textContent='';
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      const nr=r+dr, nc=c+dc;
      if(nr>=0&&nr<rows&&nc>=0&&nc<cols) openCell(nr,nc);
    }
  }
  checkWin();
}

function checkWin(){
  if(cellsLeft===0){ gameOver(true); }
}

function gameOver(won){
  clearInterval(timer);
  // reveal mines
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const el=getCellEl(r,c);
    if(grid[r][c].mine){ el.classList.add('mine'); if(!grid[r][c].flag) el.textContent='💣'; }
    el.removeEventListener('click', onCellClick);
    el.removeEventListener('contextmenu', onCellRightClick);
  }
  setTimeout(()=>{
    if(won) alert('你赢了！🎉'); else alert('游戏结束');
  },50);
}

function getCellEl(r,c){ return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`); }
function colorFor(n){ const colors=['#3b82f6','#16a34a','#ef4444','#eab308','#a78bfa','#06b6d4','#ef4444','#6b7280']; return colors[(n-1)%colors.length]; }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

// 初始化一次默认布局
initGame();
