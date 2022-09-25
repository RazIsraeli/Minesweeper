'use strict'
//global
const EMPTY = ''
const MINE = '<img src="images/mine.png">'
const FLAG = '<img src="images/flag.png">'
const LIFE = '👻'
const HINT = '<img src="images/hint.png">'
const SAFE_CLICK = '<img src="images/safe.png">'

var gGame
var gBoard //start with 4X4 board
var gMines //start with 2
var gShownMines
var gTimeInterval
var gLives
var gHintsCount
var gIsHintOn
var gHintedCells
var gSafeClicksCount
var gIsSafeClickOn
var gScore
var gIsPlaceMines
var gManualMinesCount
var gLevel1BestScore
var gLevel2BestScore
var gLevel3BestScore

var gLevel = { size: 4, mines: 2 }

function onInit() {
  gScore = 0
  gLives = 3
  gHintsCount = 3
  gSafeClicksCount = 3
  gIsHintOn = false
  gHintedCells = []
  gIsSafeClickOn = false
  gIsPlaceMines = false
  gManualMinesCount = 0
  gShownMines = 0
  gLevel1BestScore = gLevel1BestScore ? gLevel1BestScore : 99999999
  gLevel2BestScore = gLevel2BestScore ? gLevel2BestScore : 99999999
  gLevel3BestScore = gLevel3BestScore ? gLevel3BestScore : 99999999
  showPlaceMines()
  updateBestScore()
  var elLife = document.querySelector('.life span')
  var strHTML = ''
  for (let i = 0; i < gLives; i++) {
    strHTML += `<span>${LIFE}</span>`
  }
  elLife.innerHTML = strHTML

  var elHints = document.querySelector('.hints')
  var strHTML = ''
  for (let i = 0; i < gHintsCount; i++) {
    strHTML += `<span class="hint" onclick="onHint(this)">${HINT}</span>`
  }
  elHints.innerHTML = strHTML

  var elSafeClicks = document.querySelector('.safe-clicks')
  var strHTML = ''
  for (let i = 0; i < gSafeClicksCount; i++) {
    strHTML += `<span class="safe-click" onclick="onSafeClick(this)">${SAFE_CLICK}</span>`
  }
  elSafeClicks.innerHTML = strHTML

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
  renderBoard(gBoard, '.board-container')
}

function onCellClicked(elCell, cellI, cellJ) {
  if (gIsPlaceMines && gMines.length < gLevel.mines) {
    if (gMines.includes(gBoard[cellI][cellJ])) return
    gBoard[cellI][cellJ].isMine = true
    gMines.push(gBoard[cellI][cellJ])
    elCell.innerHTML = MINE
    elCell.style.borderColor = 'red'
    showMinesCount()
    console.log('Mine placed in cell ' + cellI + ' ' + cellJ)
    if (gMines.length === gLevel.mines) checkFirstClick(cellI, cellJ)
    return
  }
  //first click to start time and prevent clicking shown cells
  checkFirstClick(cellI, cellJ)
  if (!gGame.isOn) return
  if (gBoard[cellI][cellJ].isShown) return
  if (gBoard[cellI][cellJ].isMarked) return

  if (gIsHintOn) {
    revealCells(cellI, cellJ)
    setTimeout(unrevealCells, 1000)
    return
  }

  //checking what is the content of the cell
  if (gBoard[cellI][cellJ].isMine) {
    gShownMines++
    gGame.shownCount++
    reduceLife()
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
    document.querySelector(`.cell-${cellI}-${cellJ}`).classList.add('shown')
    // elCell.classList.add('shown')
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
  if (gIsHintOn) return

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
  renderCell({ i: cellI, j: cellJ }, elCell.innerHTML)
}

function ignoreshownCount(cellI, cellJ) {
  if (gBoard[cellI][cellJ].isShown || gBoard[cellI][cellJ].isMarked) {
    console.log('Clicked on a shown/marked cell....')
    return
  }
}

function checkFirstClick(cellI, cellJ) {
  if (!gTimeInterval) {
    hidePlaceMines()
    if (!gIsPlaceMines) createMines(cellI, cellJ)
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
  gIsPlaceMines = false
}

function gameOver(isPlayerWin) {
  //when the player won
  if (isPlayerWin) {
    console.log('congrats! You won!')
    document.querySelector('.game-icon img').src = 'images/win-face.png'
    gScore = gGame.secsPassed
    console.log('gScore: ', gScore)
    updateBestScore()
  } else if (!isPlayerWin || gLives < 0 || gShownMines === gMines.length) {
    console.log('Too bad.. you lost')
    document.querySelector('.game-icon img').src = 'images/crying-face.png'
    document.querySelector('.game-icon img').style = 'width:40px;height:40px;'
  }
  //resetting global settings
  gGame.secsPassed = 0
  gGame.isOn = false
  gMines = 0
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

  showPlaceMines()
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

function createMines(cellI, cellJ) {
  var emptyLocations = getEmptyLocations(cellI, cellJ)

  for (let i = 0; i < gLevel.mines; i++) {
    var randIdx = getRandomInt(0, emptyLocations.length)

    var randLocation = emptyLocations.splice(randIdx, 1)[0]

    gBoard[randLocation.i][randLocation.j] = createMine()
    gMines.push(gBoard[randLocation.i][randLocation.j])
  }
}

function getEmptyLocations(cellI, cellJ) {
  var emptyLocations = []
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      if (!(i === cellI && j === cellJ)) emptyLocations.push({ i, j })
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
      gLevel = { size: 8, mines: 14 }
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
    strHTML += `<span>${LIFE}</span>`
  }
  elLife.innerHTML = strHTML
}

function onHint(elHint) {
  if (gIsSafeClickOn) return
  if (gIsHintOn && !elHint.classList.contains('hint-clicked')) return
  if (elHint.classList.contains('hint-clicked')) {
    elHint.classList.remove('hint-clicked')
    elHint.classList.add('hint')
    gIsHintOn = false
  } else {
    elHint.classList.add('hint-clicked')
    elHint.classList.remove('hint')
    gIsHintOn = true
  }
}

function revealCells(cellI, cellJ) {
  for (let i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue

    for (let j = cellJ - 1; j <= cellJ + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue
      if (gBoard[i][j].isShown || gBoard[i][j].isMarked) continue
      gHintedCells.push({ i: i, j: j })
      // update model
      gBoard[i][j].isShown = true
    }
  }
  // update DOM
  renderBoard(gBoard, '.board-container')
}

function unrevealCells() {
  // update model:
  for (let i = 0; i < gHintedCells.length; i++) {
    const hintedCell = gHintedCells[i]
    gBoard[hintedCell.i][hintedCell.j].isShown = false
  }
  gHintedCells = []
  // update DOM
  renderBoard(gBoard, '.board-container')
  reduceHintCount()
}

function reduceHintCount() {
  gHintsCount--

  var elHints = document.querySelector('.hints')
  var strHTML = ''
  for (let i = 0; i < gHintsCount; i++) {
    strHTML += `<span class="hint" onclick="onHint(this)">${HINT}</span>`
  }
  strHTML = !gHintsCount ? 'Out of hints...' : strHTML
  elHints.innerHTML = strHTML

  gIsHintOn = false
}

function onSafeClick(elSafe) {
  if (gIsHintOn) return
  if (gIsSafeClickOn && !elSafe.classList.contains('safe-click-clicked')) return

  if (elSafe.classList.contains('safe-click-clicked')) {
    elSafe.classList.remove('safe-click-clicked')
    gIsSafeClickOn = false
  } else {
    elSafe.classList.add('safe-click-clicked')
    gIsSafeClickOn = true
  }
  showSafeCell()
}

function showSafeCell() {
  var emptyLocation = getEmptyLocation(gBoard)
  if (!emptyLocation) {
    reduceSafeClicksCount()
    return
  }
  if (!gGame.isOn && gSafeClicksCount < 3) return

  renderCell({ i: emptyLocation.i, j: emptyLocation.j }, 'S')
  setTimeout(() => {
    renderBoard(gBoard, '.board-container')
  }, 1500)
  reduceSafeClicksCount()
}
function reduceSafeClicksCount() {
  gSafeClicksCount--

  var elSafeClicks = document.querySelector('.safe-clicks')
  var strHTML = ''
  for (let i = 0; i < gSafeClicksCount; i++) {
    strHTML += `<span class="safe-click" onclick="onSafeClick(this)">${SAFE_CLICK}</span>`
  }
  strHTML = !gSafeClicksCount ? 'Out of safe clicks...' : strHTML
  elSafeClicks.innerHTML = strHTML

  gIsSafeClickOn = false
}

function hidePlaceMines() {
  var elPlaceMines = document.querySelector('.place-mines-container')
  elPlaceMines.style.display = 'none'
}
function showPlaceMines() {
  var elPlaceMines = document.querySelector('.place-mines-container')
  elPlaceMines.style.display = 'block'
  elPlaceMines.innerHTML = `<h3 class="place-mines-header">Place Mines:</h3>
  <div class="place-mines"><button onclick="onPlaceMines()">Manually place mines</button></div>`
}

function onPlaceMines() {
  gIsPlaceMines = true
  console.log('gIsPlaceMines: ', gIsPlaceMines)
  showMinesCount()
}

function showMinesCount() {
  var elPlaceMines = document.querySelector('.place-mines')
  elPlaceMines.innerHTML = `<span>Mines left: ${
    gLevel.mines - gMines.length
  }</span>`
  elPlaceMines.style.display = 'block'
}

function updateBestScore() {
  var currBestScore
  var level

  switch (gLevel.mines) {
    case 2:
      currBestScore = gLevel1BestScore
      level = 'Beginner'
      break
    case 14:
      currBestScore = gLevel2BestScore
      level = 'Medium'
      break
    case 32:
      currBestScore = gLevel3BestScore
      level = 'Expert'
      break
  }

  switch (level) {
    case 'Beginner':
      if (gScore && gScore < currBestScore) {
        console.log('New best score! ' + gScore)
        localStorage.setItem('bestScoreLevel1', gScore)
      } else if (currBestScore === 99999999) {
        console.log('No record yet')
      }

      break
    case 'Medium':
      if (gScore && gScore < currBestScore) {
        console.log('New best score! ' + gScore)
        localStorage.setItem('bestScoreLevel1', gScore)
      } else if (currBestScore === 99999999) {
        console.log('No record yet')
      }
      break
    case 'Beginner':
      break
  }
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
