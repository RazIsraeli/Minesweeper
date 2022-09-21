'use strict'
//global
const EMPTY = ''
const MINE = '<img src="images/mine.png">'
const FLAG = '<img src="images/flag.png">'

var gGame
var gBoard //start with 4X4 board
var gMines //start with 2
var gTimeInterval

function onInit() {
  gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isWin: false,
  }
  gMines = []
  document.addEventListener('contextmenu', (event) => event.preventDefault())
  gBoard = buildBoard(4)
  console.table(gBoard)
  renderBoard(gBoard, '.board-container')
}

function onCellClicked(elCell, cellI, cellJ) {
  //first click to start time and prevent clicking shown cells
  checkFirstClick()
  if (!gGame.isOn) return
  if (gBoard[cellI][cellJ].isShown) return
  if (gBoard[cellI][cellJ].isMarked) return

  //checking what is the content of the cell
  if (gBoard[cellI][cellJ].isMine) {
    // update model
    for (let i = 0; i < gMines.length; i++) {
      gMines[i].isShown = true
    }
    //update DOM
    var elMines = document.querySelectorAll('.mine')
    for (let i = 0; i < elMines.length; i++) {
      const elMine = elMines[i]
      elMine.innerHTML = MINE
    }
    // elCell.innerHTML = MINE
    elCell.classList.add('shown')
    elCell.style.backgroundColor = 'rgba(255,0,0,0.4)'
    gameOver(gGame.isWin)
  } else if (gBoard[cellI][cellJ].mineNegsCount) {
    // update model
    gBoard[cellI][cellJ].isShown = true
    gGame.shownCount++
    // update DOM
    const value = gBoard[cellI][cellJ].mineNegsCount
    elCell.innerText = value
    elCell.classList.add('shown')
    renderCell({ i: cellI, j: cellJ }, value)
    checkGameOver()
  } else if (
    !gBoard[cellI][cellJ].mineNegsCount &&
    !gBoard[cellI][cellJ].isMine
  ) {
    showNegs(gBoard, cellI, cellJ)
    var elCell = document.querySelector(`.cell-${cellI}-${cellJ}`)
    gBoard[cellI][cellJ].isShown = true
    gGame.shownCount++
    elCell.classList.add('shown')
    checkGameOver()
  }
}

function checkGameOver() {
  console.log('Checking game over')
  var markedMines = 0

  console.log('Math.pow(gBoard.length,2): ', Math.pow(gBoard.length, 2))
  console.log('gMines.length: ', gMines.length)

  for (let i = 0; i < gMines.length; i++) {
    const currMine = gMines[i]
    if (currMine.isMarked) markedMines++
    else return
  }

  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard.length; j++) {
      const currCell = gBoard[i][j]
      if (currCell.isShown) {
        console.log('gGame.shownCount: ', gGame.shownCount)
      } else return
    }
  }
  console.log('gGames.shownCount: ', gGames.shownCount)
}

function cellMarked(elCell, cellI, cellJ) {
  //first click to start the game and ignore clicks on shown cells
  checkFirstClick()
  if (!gGame.isOn) return
  if (gBoard[cellI][cellJ].isShown) return

  if (gBoard[cellI][cellJ].isMarked) {
    //update model
    gBoard[cellI][cellJ].isMarked = false
    //update DOM
    elCell.innerHTML = ''
  } else {
    // update model
    gBoard[cellI][cellJ].isMarked = true
    //update DOM
    elCell.innerHTML = FLAG
    checkGameOver()
  }
}

function showNegs(board, cellI, cellJ) {
  var negs = []
  var positions = []
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[0].length) continue
      if (i === cellI && j === cellJ) continue

      var currCell = board[i][j]
      if (currCell.isShown) continue
      if (currCell.mineNegsCount) {
        negs.push(currCell)
        positions.push({ i, j })
      }
    }
  }
  if (!negs.length) return null

  for (let i = 0; i < negs.length; i++) {
    const neg = negs[i]
    // update model:
    neg.isShown = true
    gGame.shownCount++
    // update DOM
    const pos = positions[i]
    var elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
    elCell.innerText = neg.mineNegsCount
    elCell.classList.add('shown')
    renderCell(pos, neg.mineNegsCount)
  }
}

function ignoreshownCount(cellI, cellJ) {
  if (gBoard[cellI][cellJ].isShown || gBoard[cellI][cellJ].isMarked) {
    console.log('Clicked on a shown/marked cell....')
    return
  }
}

function checkFirstClick() {
  if (!gTimeInterval) {
    gGame.isOn = true
    const startTime = Date.now()
    //update model:
    gTimeInterval = setInterval(() => {
      // update DOM:
      gGame.secsPassed = Math.trunc((Date.now() - startTime) / 1000)
      document.querySelector('.time span').innerText = gGame.secsPassed
    }, 1000)
  }
}

function gameOver(isPlayerWin) {
  //when the player won
  if (isPlayerWin) {
    console.log('congrats! You won!')
    //TODO what happens when wins?
    //when the player lost
  }
  //resetting global settings
  gGame.secsPassed = 0
  gGame.isOn = false
  //clearing active intervals
  clearInterval(gTimeInterval)
}

function buildBoard(size) {
  const board = []

  for (var i = 0; i < size; i++) {
    board[i] = []
    for (var j = 0; j < size; j++) {
      const cell = {
        // minesAroundCount: 0
        isShown: false,
        isMine: false,
        isMarked: false,
      }
      board[i][j] = cell
    }
  }

  board[0][3].isMine = true
  board[3][0].isMine = true
  gMines.push(board[0][3])
  gMines.push(board[3][0])

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j].isMine) board[i][j].mineNegsCount = ''
      else board[i][j].mineNegsCount = setMinesNegsCount(board, i, j)
    }
  }
  return board
}

function restart() {
  //clear all settings and reset timer
  gameOver(gGame.isWin)
  document.querySelector('.time span').innerText = gGame.secsPassed
  gTimeInterval = 0
  onInit()
}

function setMinesNegsCount(board, rowIdx, colIdx) {
  if (board[rowIdx][colIdx].isMine) return
  var mineNegsCount = 0
  for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue

    for (let j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= board[0].length) continue
      if (i === rowIdx && j === colIdx) continue

      var currCell = board[i][j]
      if (currCell.isMine) mineNegsCount++
    }
  }
  return mineNegsCount
}
