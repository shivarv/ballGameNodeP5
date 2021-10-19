let gameStarted = false;
let redCircle;
let circleRadius = 50;
let blueCircle;

let isFirst = false;
let socket;

let vectorRedCircleColor =  new p5.Vector(255, 0, 0);
let vectorBlueCircleColor = new p5.Vector(0, 0, 255);
let height = 400;
let width = 400;

let bulletSize = 10;

let redFireBullets = [];
let blueFireBullets = [];

let createdRedSquare = [];
let createdBlueSquare = [];

let input, button, playerIdMessage, selectList, choosePlayerTypeMessage;

let currentPlayerType;
let playerId;

let elementsToRemove = [];
function setup() {
  let elementPositionMap = {};
  elementPositionMap.choosePlayerTypeMessage =  {x: 20, y: 5};
  elementPositionMap.selectPlayer = {x: 20, y: 50};
  elementPositionMap.playerIdMessage = {x: 20, y: 70};
  elementPositionMap.input =  {x: 20, y: 120};

  createCanvas(height, width);
  textAlign(CENTER);
  
  choosePlayerTypeMessage = createElement('h3', 'Choose Player Type'); choosePlayerTypeMessage.position
  (elementPositionMap['choosePlayerTypeMessage'].x,         elementPositionMap['choosePlayerTypeMessage'].y);
  addElementToRemove(choosePlayerTypeMessage);
  selectList = createSelect();
  selectList.option('player1');
  selectList.option('player2');
  selectList.selected('player1');
  currentPlayerType = 'player1';
  selectList.changed(selectPlayerType);
  selectList.position(elementPositionMap['selectPlayer'].x, elementPositionMap['selectPlayer'].y);
  addElementToRemove(selectList);
  playerIdMessage = createElement('h3', 'Choose Player Id');           playerIdMessage.position
  (elementPositionMap['playerIdMessage'].x,         elementPositionMap['playerIdMessage'].y);
  addElementToRemove(playerIdMessage);
   input = createInput();
  input.position(elementPositionMap['input'].x, elementPositionMap['input'].y);
  addElementToRemove(input);

  button = createButton('submit');
  button.position(input.x + input.width + 10, elementPositionMap['input'].y);
  addElementToRemove(button);
  button.mousePressed(gameStart);  
 
}

function addElementToRemove(ele) {
  elementsToRemove.push(ele);
}

function selectPlayerType() {
    console.log('selectPlayerType '+selectList.value());
  currentPlayerType = selectList.value();
}

function gameStart() {
  createCanvas(height, width);
  gameStarted = true;
  socket =  io().connect('http://localhost:3000');
  socket.on('playershoot', playerShootEventHandler);
  socket.on('playermoved', playerMovedEventHandler)
  //socket.on('serverevent', newServerEvent);
  for(let i in elementsToRemove) {
    elementsToRemove[i].remove();
  }
  redCircle = new p5.Vector(width / 2, circleRadius/2);
  blueCircle = new p5.Vector(width / 2 ,height - circleRadius / 2);
}

function playerMovedEventHandler(data) {
    console.log('playerMovedEventHandler subscribed');
    moveCharacterType(data.playerType, data.keyCode, false);
}

function playerShootEventHandler(data) {
    console.log('playershootHandler subscribed');
    fireBulletBasedOnPlayerType(data.playerType);
}

function fireBulletBasedOnPlayerType(playerType) {
    if(playerType === 'player1') {
        fireBullet('blue');
    } else if(playerType === 'player2') {
        fireBullet('red');
    }
}

function isGameStarted() {
    return gameStarted === true;
}

function draw(){
  
  if(!isGameStarted()) {
    return;
  }
  

  createdRedSquare = [];
  createdBlueSquare = [];
  /*
  redCircle.x++;
  if(redCircle.x > width) {
    redCircle.x = 0;
  }

  blueCircle.y++;
  if(blueCircle.y > height) {
    blueCircle.y = 0;
  }
*/
  background(50);

  fill(vectorRedCircleColor.x, vectorRedCircleColor.y, vectorRedCircleColor.z);

  //ellipse wants parameter of diamater not radius
  ellipse(redCircle.x, redCircle.y, circleRadius, circleRadius);

  fill(vectorBlueCircleColor.x, vectorBlueCircleColor.y, vectorBlueCircleColor.z);
   //ellipse wants parameter of diamater not radius
  ellipse(blueCircle.x, blueCircle.y, circleRadius, circleRadius);
  fill(vectorRedCircleColor.x, vectorRedCircleColor.y, vectorRedCircleColor.z);
  for(let i = 0; i < redFireBullets.length; i++) {
      square(redFireBullets[i].currentLocation.x, redFireBullets[i].currentLocation.y, bulletSize);
      redFireBullets[i].currentLocation.y += 1;
    if(redFireBullets[i].currentLocation.y  >= (height - bulletSize * 2)) {
      console.log('reached the end ');
       redFireBullets.splice(i, 1);
    }
    
  }
  
  fill(vectorBlueCircleColor.x, vectorBlueCircleColor.y, vectorBlueCircleColor.z);
  for(let i = 0; i < blueFireBullets.length; i++) {
      square(blueFireBullets[i].currentLocation.x, blueFireBullets[i].currentLocation.y - bulletSize/2, bulletSize);
      blueFireBullets[i].currentLocation.y -= 1;
    if(blueFireBullets[i].currentLocation.y <= bulletSize * 2) {
       blueFireBullets.splice(i, 1);
    }
  }
  
  checkforIntersection();
  checkForPlayerHit();
}

function mouseClicked(event) {
  if(isGameStarted()) {
    fireBulletBasedOnPlayerType(currentPlayerType);
    console.log('currentPlayerType '+currentPlayerType);
    socket.emit('playershoot', {playerType: currentPlayerType});
  }
}

function keyPressed() {
    console.log('keypressed');
  if(!isGameStarted()) {
    return;
  }
  try{
    moveCharacterType(currentPlayerType, keyCode, true);

  } catch(e) {
      console.log('exception ');
      console.log(e);
  }
}

function moveCharacterType(playerType, keyCodeRecieved, isPublishEvent) {
    console.log('moveCharacter keycode '+keyCodeRecieved);
    let circle = getCircleToMove(playerType);
    if (keyCodeRecieved === LEFT_ARROW) {
        moveCharacter(circle, true);
    } else if (keyCodeRecieved === RIGHT_ARROW) {
        moveCharacter(circle, false);
    } else if (keyCodeRecieved === ENTER) {
        fireBullet('blue');
    }
    if(isPublishEvent) {
        socket.emit('playermoved', {playerType: playerType, keyCode: keyCodeRecieved});
    }
}

function fireBullet(colorType)
{
    if(colorType === 'blue') {
      blueFireBullets.push({value: 1, currentLocation: {x: blueCircle.x - bulletSize/2, y: height - circleRadius }});
    }   else if (colorType === 'red') {
      redFireBullets.push({value: 1, currentLocation: {x: redCircle.x - bulletSize/2, y: circleRadius }});
    }
}

function getCircleToMove(playerType) {
    let circleRef;
    if(playerType === 'player1') {
        circleRef = blueCircle;
    } else if (playerType === 'player2') {
        circleRef = redCircle;
    }
    return circleRef;
}

/*
function keyTyped() {
  if(!isGameStarted()) {
    return;
  }
  
  if(playerType === 'player1')
  moveCharacter(blueCircle, true);
    //redCircle.x -= bulletSize; //circleRadius/2;
  } else if (key === 'd') {
    moveCharacter(redCircle, false);
    //redCircle.x += bulletSize; //circleRadius/2;
  }
 
}
*/

function moveCharacter(characterRef, isLeft) {
  if(isLeft) {
    characterRef.x -= bulletSize - 1;
  } else if(!isLeft) {
    characterRef.x += bulletSize - 1;

  }
}

function checkforIntersection() {
    for(let i = 0; i < redFireBullets.length; i++) {
        for(let j = 0; j < blueFireBullets.length; j++) {
          console.log(redFireBullets[i]?.currentLocation?.x + '  '+redFireBullets[i]?.currentLocation?.y + ' blue--  ' +blueFireBullets[j]?.currentLocation?.x + '  '+blueFireBullets[j].currentLocation?.y);
             if(checkBulletXCordinateForCollision(blueFireBullets[j],
                                  redFireBullets[i]               
                                                 ) && 
                (redFireBullets[i]?.currentLocation?.y + bulletSize/2 >= (blueFireBullets[j]?.currentLocation?.y - bulletSize/2)
               )) {
                 console.log(redFireBullets.length + '  '+blueFireBullets.length);
                  redFireBullets.splice(i, 1);
                  blueFireBullets.splice(i, 1);
                 console.log(redFireBullets.length + '  '+blueFireBullets.length);
             }
        }
    }
}

function checkBulletXCordinateForCollision(blueBullet, redBullet) {
  let blueX , redX;
  if(!blueBullet || !blueBullet.currentLocation || !blueBullet.currentLocation.hasOwnProperty('x')
 ||   !redBullet || !redBullet.currentLocation || !redBullet.currentLocation.hasOwnProperty('x')
    ) {
    return false;
  }
  blueX = blueBullet.currentLocation.x;
  redX = redBullet.currentLocation.x;
      if( (blueX === redX) 
         || (blueX < redX && blueX + bulletSize > redX)
         || (blueX > redX && blueX < redX + bulletSize)
        ) {
        return true;
      }
  return false;
}

function checkForPlayerHit() {
  if(!redFireBullets || redFireBullets.length === 0) {
    return;
  }
 // console.log('in checkforplayer hit');
 // console.log(redFireBullets[0].currentLocation.x + '  '+redFireBullets[0].currentLocation.y +' '+blueCircle.x + ' '+blueCircle.y);
  for(let i = 0; i < redFireBullets.length; i++) {
    if((redFireBullets[i]?.currentLocation?.x >=  blueCircle.x - circleRadius/2 && (redFireBullets[i]?.currentLocation?.x <=  blueCircle.x + circleRadius/2) ) && 
                (redFireBullets[i]?.currentLocation?.y >= blueCircle.y)) {
      blueCircle = null;
    }
  }
}