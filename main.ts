/*TODO:
- start timer when player starts moving
*/
interface Window{
  requestAnimFrame: any;
  mozRequestAnimationFrame: any;
}

interface Point{
  x: number;
  y: number;
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function(callback){
            window.setTimeout(callback, 1000 / 60);
          };
})();

let introCanvas = <HTMLCanvasElement> document.getElementById("canvas_intro");
introCanvas.width = window.innerWidth;
introCanvas.height = window.innerHeight;


let pFrames = [[], [], [], [], []];
let currFrame = 0;

/*
0: intro
1: playing
2: reverse
3: replay
4: prom?
*/
let state = 0;

let currLevel = 0;
let level = null;
let config = [
  { //intro
    canvas: introCanvas,
    player: {x: 500, y: 300},
    exit: {x: 1300, y: 300},
    gems: [
      {x: 720, y: 650},
      {x: 1050, y: 650}
    ],
    blocks: [
      {x: 900, y: 400, radius: 200}
    ]
  },
  { //P
    canvas: document.getElementById("canvas1"),
    player: {x: 40, y: 280},
    exit: {x: 40, y: 180},
    gems: [
      {x: 50, y: 50},
      {x: 260, y: 100}
    ],
    blocks: [
      {x: 150, y: 110, radius: 70},
      {x: 150, y: 280, radius: 70}
    ],
    duration: 170
  },
  { //R
    canvas: document.getElementById("canvas2"),
    player: {x: 50, y: 280},
    exit: {x: 270, y: 260},
    gems: [
      {x: 50, y: 50},
      {x: 190, y: 195}
    ],
    blocks: [
      {x: 150, y: 110, radius: 70},
      {x: 150, y: 260, radius: 70}
    ],
    duration: 150
  },
  { //O
    canvas: document.getElementById("canvas3"),
    player: {x: 30, y: 150},
    exit: {x: 30, y: 150},
    gems: [
      {x: 150, y: 280},
      {x: 230, y: 60}
    ],
    blocks: [
      {x: 150, y: 150, radius: 100},
      {x: 0, y: 0, radius: 50},
      {x: 0, y: 300, radius: 50},
      {x: 300, y: 0, radius: 50},
      {x: 300, y: 300, radius: 50}
    ],
    duration: 150
  },
  { //M
    canvas: document.getElementById("canvas4"),
    player: {x: 150, y: 150},
    exit: {x: 150, y: 150},
    gems: [
      {x: 30, y: 30},
      {x: 290, y: 30},
      {x: 30, y: 270},
      {x: 290, y: 270}
    ],
    blocks: [
      {x: 150, y: 40, radius: 70},
      {x: 70, y: 150, radius: 40},
      {x: 230, y: 150, radius: 40},
      {x: 100, y: 250, radius: 60},
      {x: 200, y: 250, radius: 60}
    ],
    duration: 350
  }
];

window.onload = () => {
  let redraw = false;
  level = new Level(config[currLevel]);

  function update(){
    if(state == 0 || state == 1){
      if(level){
        level.update();
        redraw = true;
      }
    }
    else if(state == 2){
      loadFrame();

      currFrame -= 2;
      if(currFrame < 0){
        nextLevel();
      }
      redraw = true;
    }
    else if(state == 3){
      loadFrame();

      currFrame += 2;
      if(currFrame >= pFrames[currLevel].length){
        nextLevel();
      }
      redraw = true;
    }
  }

  function draw(){
    if(level){
      level.draw();
      redraw = false;
    }
  }

  setInterval(update, 1000/30);
  (function animloop(){
    window.requestAnimFrame(animloop);
    if(redraw) draw();
  })();
}

class Level{
  player: Player;
  gems: Gem[] = [];
  gemsCollected = 0;
  exit: Exit;
  blocks = [];
  timer: Timer;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  pathCanvas: HTMLCanvasElement;
  pctx: CanvasRenderingContext2D;

  pathOldPoint: null;

  constructor(public config: any){
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    if(state == 0) this.height = this.canvas.height;
    else this.height = this.canvas.height - 80;

    this.pathCanvas = document.createElement("canvas");
    this.pathCanvas.width = this.width;
    this.pathCanvas.height = this.height;
    this.pctx = this.pathCanvas.getContext("2d");

    this.player = new Player(config.player.x, config.player.y, this.canvas);

    for(var gem of config.gems){
      this.gems.push(new Gem(gem.x, gem.y, this.ctx));
    }

    this.exit = new Exit(config.exit.x, config.exit.y, this.canvas);

    this.blocks = config.blocks;

    if(state > 0) this.timer = new Timer(config.duration, this.ctx);
  }

  public update(){
    this.player.update(this.width, this.height, this.blocks);

    for(var gem of this.gems){
      let isCollect = gem.update(this.player.x, this.player.y);
      if(isCollect) this.gemsCollected++;
    }

    if(this.gemsCollected >= this.gems.length){
      this.exit.update(this.player.x, this.player.y);
    }

    if(state > 0) this.timer.update();

    pFrames[currLevel].push({
      player: {
        x: this.player.x,
        y: this.player.y
      }
    });
  }

  public draw(){
    //clear screen
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(0, 0, this.width, this.height);

    //draw obstacles
    for(var block of this.blocks){
      this.ctx.fillStyle = "#777";
      this.ctx.beginPath();
      this.ctx.arc(block.x, block.y, block.radius, 0, 2*Math.PI);
      this.ctx.fill();
    }

    this.exit.draw(this.gemsCollected >= this.gems.length);

    for(var gem of this.gems){
      gem.draw();
    }

    this.player.draw();

    if(state > 0) this.timer.draw();

    if(state == 3 && currFrame > 2){ //hack: first frame is incorrect
      if(!this.pathOldPoint){
        this.pathOldPoint = {
          x: this.player.x,
          y: this.player.y
        }
      }
      this.pctx.beginPath();
      this.pctx.strokeStyle = "#d22";
      this.pctx.lineWidth = 10;
      this.pctx.lineCap = "round";
      this.pctx.lineJoin = "round";
      this.pctx.moveTo(this.pathOldPoint.x, this.pathOldPoint.y);
      this.pctx.lineTo(this.player.x, this.player.y);
      this.pctx.stroke();

      this.ctx.drawImage(this.pathCanvas, 0, 0);

      this.pathOldPoint = {
        x: this.player.x,
        y: this.player.y
      }
    }
  }
}

class Player{
  ctx: CanvasRenderingContext2D;

  radius = 15;
  speed = 5;

  constructor(public x: number, public y: number, public canvas: HTMLCanvasElement){
    this.ctx = canvas.getContext("2d");
  }

  public update(lvWidth: number, lvHeight: number, blocks: any){
    //keyboard movement
    if(Key.left) this.x -= this.speed;
    if(Key.right) this.x += this.speed;
    if(Key.up) this.y -= this.speed;
    if(Key.down) this.y += this.speed;

    //canvas border
    this.x = clamp(this.x, this.radius, lvWidth - this.radius - 1);
    this.y = clamp(this.y, this.radius, lvHeight - this.radius - 1);

    //collision with blocks
    for(var block of blocks){
      let dx = this.x - block.x;
      let dy = this.y - block.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      let overlap = this.radius + block.radius - dist;
      if(overlap > 0){ //collided
        let pushx = dx/dist * overlap;
        let pushy = dy/dist * overlap;
        this.x += pushx;
        this.y += pushy;
      }
    }
  }

  public draw(){
    this.ctx.fillStyle = "#fff";
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    this.ctx.fill();
  }
}

class Gem{
  radius = 20;
  collected = false;

  constructor(public x: number, public  y: number, public ctx: CanvasRenderingContext2D){
  }

  public update(px: number, py: number){
    if(this.collected) return false;

    let dist = Math.sqrt(Math.pow(this.x - px, 2) + Math.pow(this.y - py, 2));
    if(dist < 20) this.collected = true;
    return this.collected;
  }

  public draw(){
    if(this.collected) return;

    var spikes = 4;
    var innerR = 10, outerR = 15;
    var rot = Math.PI / 2 * 3;
    var step = Math.PI / spikes;
    var xpos = this.x, ypos = this.y;

    this.ctx.beginPath();
    this.ctx.moveTo(xpos, ypos - outerR);
    for(var i = 0; i < spikes; i++){
      xpos = this.x + Math.cos(rot) * outerR;
      ypos = this.y + Math.sin(rot) * outerR;
      this.ctx.lineTo(xpos, ypos);
      rot += step;

      xpos = this.x + Math.cos(rot) * innerR;
      ypos = this.y + Math.sin(rot) * innerR;
      this.ctx.lineTo(xpos, ypos);
      rot += step;
    }
    this.ctx.lineTo(xpos, ypos);
    this.ctx.closePath();
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = "#a00";
    this.ctx.stroke();
    this.ctx.fillStyle = "#f00";
    this.ctx.fill();
  }
}

class Timer{
  time: number;
  decay = 1;
  constructor(public duration: number, public ctx: CanvasRenderingContext2D){
    this.time = duration;
  }

  public update(){
    if(this.time > 0) this.time -= this.decay;
    else if(this.time <= 0) resetLevel();
  }

  public draw(){
    //background
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 300, 300, 80);
    this.ctx.fillStyle = "#007";
    this.ctx.fillRect(45, 315, 210, 50);
    this.ctx.fillStyle = "#00f";
    this.ctx.fillRect(50, 320, this.time * 200/ this.duration, 40);
  }
}

class Exit{
  ctx: CanvasRenderingContext2D;

  width = 40;
  height = 60;

  constructor(public x: number, public y: number, public canvas: HTMLCanvasElement){
    this.ctx = this.canvas.getContext("2d");
  }

  public update(px: number, py: number){
    let dist = Math.sqrt(Math.pow(this.x - px, 2)*10 + Math.pow(this.y - py, 2));
    if(dist < 30) nextLevel();
  }

  public draw(unlocked: boolean){
    this.ctx.fillStyle = "#080";
    this.ctx.fillRect(this.x - this.width/2 - 5, this.y - this.height/2 - 5, this.width + 10, this.height + 10);

    if(unlocked) this.ctx.fillStyle = "#0f0";
    else this.ctx.fillStyle = "#080";
    this.ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
  }
}

function loadFrame(){
  var frame = pFrames[currLevel][currFrame];
  level.player.x = frame.player.x
  level.player.y = frame.player.y;
}

function resetLevel(){
  level = null;
  pFrames[currLevel] = [];
  setTimeout(function(){
    level = new Level(config[currLevel]);
  }, 500);
}

function nextLevel(){
  if(state == 0){
    introCanvas.style.top = "-100%";
    state = 1;
  }
  if(state == 1){
    currLevel++;
    if(currLevel < config.length){
      level = null;
      setTimeout(function(){
        level = new Level(config[currLevel]);
        level.canvas.style.border = "1px solid white";
      }, 1000);
    }
    else state = 2;
  }
  if(state == 2){
    document.getElementById("rewind_text").style.opacity = "1";
    currLevel--;
    if(currLevel > 0){
      level = new Level(config[currLevel]);
      currFrame = pFrames[currLevel].length - 1;
      loadFrame();
    }
    else state = 3;
  }
  if(state == 3){
    document.getElementById("rewind_text").style.opacity = "0";
    document.getElementById("replay_text").style.opacity = "1";
    currLevel++;
    if(currLevel < config.length){
      level = new Level(config[currLevel]);
      currFrame = 0;
      loadFrame();
    }
    else state = 4;
  }
  if(state == 4){ //"?"
    level = null;
    document.getElementById("replay_text").style.opacity = "0";
    document.getElementById("ending_text").style.opacity = "1";
    document.getElementById("canvas_container").style.width = "1590px";

    var questionCanvas = <HTMLCanvasElement>document.getElementById("canvas5");
    questionCanvas.setAttribute("width", "300");
    questionCanvas.style.width = "300px";
    questionCanvas.style.border = "1px solid white";
    var qctx = questionCanvas.getContext("2d");

    var questionPoints = {
      x: [60, 60, 100, 200, 240, 240, 150, 150],
      y: [145, 90, 50, 50, 90, 145, 200, 250]
    };
    qctx.beginPath();
    qctx.strokeStyle = "#d22";
    qctx.lineWidth = 10;
    qctx.lineCap = "round";
    qctx.lineJoin = "round";
    qctx.moveTo(questionPoints.x[0], questionPoints.y[0]);
    for(var i=0;i<questionPoints.x.length;i++){
      qctx.lineTo(questionPoints.x[i], questionPoints.y[i]);
    }
    qctx.stroke();
    qctx.beginPath();
    qctx.arc(150, 300, 10, 0, 2*Math.PI);
    qctx.fill();
    qctx.stroke();
  }
}

function clamp(num: number, min: number, max: number){
  return Math.min(Math.max(num, min), max);
}

namespace Key{
  export let left: boolean;
  export let right: boolean;
  export let up: boolean;
  export let down: boolean;

  let KEY_CODES = { //maybe change to enum
    37:"left", 38:"up", 39:"right", 40:"down", //arrow keys
    65:"left", 87:"up", 68:"right", 83:"down" //WASD
  };
  let onKeyDown = (event) => {
    var code = KEY_CODES[event.keyCode];
    Key[code] = true;
    event.stopPropagation();
    event.preventDefault();
  }
  let onKeyUp = (event) => {
    var code = KEY_CODES[event.keyCode];
    Key[code] = false;
    event.stopPropagation();
    event.preventDefault();
  }
  window.addEventListener("keydown", onKeyDown, false);
  window.addEventListener("keyup", onKeyUp, false);
}
