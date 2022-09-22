'use strict'
//global
const EMPTY = ''
const MINE = '<img src="images/mine.png">'
const FLAG = '<img src="images/flag.png">'
const LIFE = '👻'

var gGame
var gBoard //start with 4X4 board
var gMines //start with 2
var gShownMines
var gTimeInterval
var gLives

var gLevel = { size: 4, mines: 2 }

function onInit() {
  gLives = 3
  gShownMines = 0
  var elLife = document.querySelector('.life span')
  var strHTML = ''
  for (let i = 0; i < gLives; i++) {
    strHTML += LIFE
  }
  elLife.innerText = strHTML

  gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isWin: false,
  }

  gMines = []
  document.addEventListener('contextmenu', (event) => event.preventDefault())
  gBoard = buildBoard(gLevel.size)
  // createMines()
  // updateNegs()
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
    gShownMines++
    gGame.shownCount++
    reduceLife()
    console.log('gShownMines: ', gShownMines)
    console.log('Life reduced to ' + gLives)
    //check if out of life
    if (!gLives || gShownMines === gMines.length) {
      // update model
      for (let i = 0; i < gMines.length; i++) {
        gMines[i].isShown = true
        gGame.shownCount++
      }
      //update DOM
      var elMines = document.querySelectorAll('.mine')
      for (let i = 0; i < elMines.length; i++) {
        const elMine = elMines[i]
        elMine.innerHTML = MINE
      }
      //update model:
      gBoard[cellI][cellJ].isShown = true
      // update DOM
      elCell.innerHTML = MINE
      elCell.classList.add('shown')
      elCell.style.backgroundColor = 'rgba(255,0,0,0.4)'
      gameOver()
      return
    } else {
      //update model:
      gBoard[cellI][cellJ].isShown = true
      // update DOM
      elCell.innerHTML = MINE
      elCell.classList.add('shown')
      elCell.style.backgroundColor = 'rgba(255,0,0,0.4)'
    }
  } else if (gBoard[cellI][cellJ].mineNegsCount) {
    // update model
    gBoard[cellI][cellJ].isShown = true
    gGame.shownCount++
    // update DOM
    const value = gBoard[cellI][cellJ].mineNegsCount
    elCell.innerText = value
    elCell.classList.add('shown')
    renderCell({ i: cellI, j: cellJ }, value)
    if (Math.pow(gLevel.size, 2) === gGame.shownCount + gGame.markedCount)
      checkGameOver()
  } else expandShown(gBoard, cellI, cellJ)
}

function checkGameOver() {
  console.log('Checking game over')
  if (gMines.length !== gGame.markedCount + gShownMines) return

  var markedMines = 0

  for (let i = 0; i < gMines.length; i++) {
    const currMine = gMines[i]
    if (currMine.isMarked || currMine.isShown) markedMines++
    else return
  }

  if (markedMines === gMines.length) {
    gGame.isWin = true
    gameOver(true)
  }
}

function onCellMarked(elCell, cellI, cellJ) {
  //first click to start the game and ignore clicks on shown cells
  checkFirstClick()
  if (!gGame.isOn) return
  if (gBoard[cellI][cellJ].isShown) return

  if (gBoard[cellI][cellJ].isMarked) {
    //update model
    gBoard[cellI][cellJ].isMarked = false
    gGame.markedCount--
    //update DOM
    elCell.innerHTML = ''
  } else {
    // update model
    gBoard[cellI][cellJ].isMarked = true
    gGame.markedCount++
    //update DOM
    elCell.innerHTML = FLAG
    if (Math.pow(gLevel.size, 2) === gGame.shownCount + gGame.markedCount)
      checkGameOver()
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
    createMines()
    updateNegs()
    renderBoard(gBoard, '.board-container')
    console.table(gBoard)
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
    document.querySelector('.game-icon img').src = 'images/win-face.png'
    //TODO what happens when wins?
    //when the player lost
  } else if (!isPlayerWin || gLives < 0 || gShownMines === gMines.length) {
    console.log('Too bad.. you lost')
    document.querySelector('.game-icon img').src = 'images/lose-face.png'
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

  return board
}

function restart() {
  //clear all settings and reset timer
  gameOver(gGame.isWin)
  document.querySelector('.time span').innerText = gGame.secsPassed
  document.querySelector('.game-icon img').src = 'images/smiley-regular.png'
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

function createMines() {
  var emptyLocations = getEmptyLocations()

  for (let i = 0; i < gLevel.mines; i++) {
    var randIdx = getRandomInt(0, emptyLocations.length)

    var randLocation = emptyLocations.splice(randIdx, 1)[0]

    gBoard[randLocation.i][randLocation.j] = createMine()
    gMines.push(gBoard[randLocation.i][randLocation.j])
  }
}

function getEmptyLocations() {
  var emptyLocations = []
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      emptyLocations.push({ i, j })
    }
  }
  if (!emptyLocations.length) return null

  return emptyLocations
}

function createMine() {
  const cell = {
    isShown: false,
    isMine: true,
    isMarked: false,
  }
  return cell
}

function updateNegs() {
  for (let i = 0; i < gLevel.size; i++) {
    for (let j = 0; j < gLevel.size; j++) {
      if (gBoard[i][j].isMine) gBoard[i][j].mineNegsCount = ''
      else gBoard[i][j].mineNegsCount = setMinesNegsCount(gBoard, i, j)
    }
  }
}

function changeLevel(level) {
  // var gameLevel = {}

  switch (level) {
    case 0:
      gLevel = { size: 4, mines: 2 }
      break
    case 1:
      gLevel = { size: 8, mines: 18 }
      break
    case 2:
      gLevel = { size: 12, mines: 32 }
      break
    default:
      gLevel = { size: 4, mines: 2 }
      break
  }

  restart()
}

function expandShown(board, cellI, cellJ) {
  //handle current cell - model and DOM
  gBoard[cellI][cellJ].isShown = true
  gGame.shownCount++
  var elCell = document.querySelector(`.cell-${cellI}-${cellJ}`)
  elCell.classList.add('shown')
  renderCell({ i: cellI, j: cellJ }, '')
  //check i and j growing only (direction bottom-right)
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= board[0].length) continue
      if (i === cellI && j === cellJ) continue

      var currCell = board[i][j]
      if (currCell.isShown || currCell.isMarked) continue
      if (currCell.isMine) continue
      if (!currCell.mineNegsCount && !currCell.isMine) {
        expandShown(board, i, j)
      }
      if (currCell.mineNegsCount) {
        // update model
        board[i][j].isShown = true
        gGame.shownCount++
        // update DOM
        var elCell = document.querySelector(`.cell-${i}-${j}`)
        elCell.classList.add('shown')
        renderCell({ i: i, j: j }, board[i][j].mineNegsCount)
      }
    }
  }
}

function reduceLife() {
  if (gLives < 0) {
    gameOver(false)
    return
  }
  // update model
  gLives--
  // update DOM
  var elLife = document.querySelector('.life span')
  var strHTML = ''
  for (let i = 0; i < gLives; i++) {
    strHTML += LIFE
  }
  elLife.innerText = strHTML
}

// function showNegs(board, cellI, cellJ) {
//   var negs = []
//   var positions = []
//   for (let i = cellI - 1; i <= cellI + 1; i++) {
//     if (i < 0 || i >= board.length) continue

//     for (let j = cellJ - 1; j <= cellJ + 1; j++) {
//       if (j < 0 || j >= board[0].length) continue
//       if (i === cellI && j === cellJ) continue

//       var currCell = board[i][j]
//       if (currCell.isShown || currCell.isMarked) continue
//       if (currCell.mineNegsCount) {
//         negs.push(currCell)
//         positions.push({ i, j })
//       }
//     }
//   }
//   if (!negs.length) return null

//   for (let i = 0; i < negs.length; i++) {
//     const neg = negs[i]
//     // update model:
//     neg.isShown = true
//     gGame.shownCount++
//     // update DOM
//     const pos = positions[i]
//     var elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
//     elCell.innerText = neg.mineNegsCount
//     elCell.classList.add('shown')
//     renderCell(pos, neg.mineNegsCount)
//   }
// }
