// This section contains some game constants
var GAME_WIDTH = 525;
var GAME_HEIGHT = 700;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 5;
const RAINBOW_HEIGHT = ENEMY_HEIGHT / 2;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
const R_KEY_CODE = 82;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';

const MAX_LIVES = 3;

// TODO
//


// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png', 'heart.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});


class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}


class Enemy extends Entity {
    constructor(xPos, score) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + score / 500 + 0.25;

        this.number = Math.floor(Math.random() * score) + 1;
    }

    render(ctx) {
        super.render(ctx);

        // Draw number
        const width = Math.max(Math.floor(Math.log10(this.number)), 0) + 1;
        ctx.fillStyle = 'black';
        ctx.fillText(this.number, this.x + ENEMY_WIDTH / 2 - width * 10, this.y + 110);
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
        this.lives = MAX_LIVES;
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }

}


/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (enemySpot === undefined || this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH, this.score);
    }

    // This method kicks off the game
    start() {
        
        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {

            //console.log(e.keyCode);

            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            } else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            } else if (e.keyCode === R_KEY_CODE) {
                this.restart();
            }
        });

        this.restart();
    }

    restart() {
        this.score = 0;
        this.lastFrame = Date.now();

        this.enemies = [];
        this.player.lives = MAX_LIVES;

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        //this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0, GAME_WIDTH, GAME_HEIGHT); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
                this.score++;
            }
        });
        this.setupEnemies();

        const HEART_SIZE = 35;

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + ' GAME OVER', 5, 30);

        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`Score: ${this.score}`, 5, 30);

            this.ctx.fillText('Lives: ', 5, 60);
            for (var i = 0; i < this.player.lives; i++) {
                this.ctx.drawImage(images['heart.png'], 80 + i * HEART_SIZE, HEART_SIZE, HEART_SIZE, HEART_SIZE);
            }

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
        const enemyIdx = this.player.x / PLAYER_WIDTH;
        const enemy = this.enemies[enemyIdx];

        // Check collision
        if (enemy && GAME_HEIGHT - (enemy.y + ENEMY_HEIGHT) < PLAYER_HEIGHT && enemy.y + RAINBOW_HEIGHT < GAME_HEIGHT) {
            if (!isPrime(this.enemies[this.player.x / PLAYER_WIDTH].number)) {
                this.player.lives--;
            } else {
                this.score += this.enemies[this.player.x / PLAYER_WIDTH].number;
            }
            delete this.enemies[this.player.x / PLAYER_WIDTH];
        }

        return this.player.lives == 0;
    }
}

function isPrime(num) {
    const sqrt = Math.sqrt(num);

    for (var i = 2; i <= sqrt; i++) {
        if (num % i == 0) {
            return false;
        }
    }
    return true;
}



// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();
