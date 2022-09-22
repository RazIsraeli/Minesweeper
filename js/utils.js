'use strict'

function renderBoard(board, selector) {
  var strHTML = '<table border="0"><tbody>'
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>'
    for (var j = 0; j < board[0].length; j++) {
      const cell = board[i][j]
      var className = `cell cell-${i}-${j}`
      var cellContent = ''
      if (cell.mineNegsCount && !cell.isMine) {
        className += ' number'
        cellContent = cell.mineNegsCount
      } else if (cell.isMine) {
        className += ' mine'
        cellContent = MINE
      }
      cellContent = cell.isShown ? cellContent : ''
      if (cell.isShown) className += ' shown'

      if (i === 0) {
        strHTML += `<td class="${className}" onclick="onCellClicked(this,${i},${j})" oncontextmenu="onCellMarked(this,${i},${j})" style="width:40px; height:40px;">${cellContent}</td>`
      } else {
        strHTML += `<td class="${className}" onclick="onCellClicked(this,${i},${j})" oncontextmenu="onCellMarked(this,${i},${j})" style="height:40px;">${cellContent}</td>`
      }
    }
    strHTML += '</tr>'
  }
  strHTML += '</tbody></table>'

  const elContainer = document.querySelector(selector)
  elContainer.innerHTML = strHTML
}

// location is an object like this - { i: 2, j: 7 }
function renderCell(location, value) {
  // Select the elCell and set the value
  const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
  elCell.innerHTML = value
}

function getEmptyLocation(board) {
  var emptyLocations = []
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      var currCell = board[i][j]
      if (currCell === ' ') {
        var emptyLocation = { i: i, j: j }
        emptyLocations.push(emptyLocation)
      }
    }
  }
  if (emptyLocations.length) return null
  const randIdx = getRandomInt(0, emptyLocations.length)
  return emptyLocations[randIdx]
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getRandomColor() {
  var letters = '0123456789ABCDEF'
  var color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}
