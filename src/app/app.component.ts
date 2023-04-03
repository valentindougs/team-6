import {
    AfterViewInit,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import * as PIXI from 'pixi.js';
import { PIXIController, PLAYER } from 'pixi-controller';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    standalone: true,
})
export class AppComponent implements AfterViewInit {
    app!: PIXI.Application;
    container = new PIXI.Container();
    Controller!: PIXIController;
    redSquare = new PIXI.Sprite(PIXI.Texture.WHITE);
    texture = PIXI.Texture.from(
        'https://raw.githubusercontent.com/pixijs/examples/gh-pages/examples/assets/bunny.png'
    );
    bunny = new PIXI.Sprite(this.texture);
    initialSpeed = 3;
    speed = this.initialSpeed;
    ellapsedTime = 0;
    spawnedBonuses = 0;
    scoreValue = 0;
    bonusArray: PIXI.Sprite[] = [];

    @ViewChild('canvasElement')
    canvasElement!: ElementRef;

    ngAfterViewInit(): void {
        this.app = new PIXI.Application({
            width: 600,
            height: 400,
            antialias: true,
            backgroundColor: 0x1099bb,
            resolution: window.devicePixelRatio || 1,
        });
        this.Controller = new PIXIController(this.canvasElement.nativeElement);
        document.body.appendChild(this.app.view as unknown as Node);
        this.bunny.anchor.set(0.5);
        this.container.addChild(this.bunny);

        this.redSquare.position.set(this.app.screen.width / 2 - 50, this.app.screen.height / 2 - 50);
        this.redSquare.width = 100;
        this.redSquare.height = 100;
        this.redSquare.tint = 0xff0000;
        this.app.stage.addChild(this.redSquare);

        this.container.x = this.container.width;
        this.container.y = this.app.screen.height;
        this.container.pivot.x = this.container.width / 2;
        this.container.pivot.y = this.container.height / 2;

        this.app.stage.addChild(this.container);
        this.addTicker();
    }

    detectCollision(
        object1X: number,
        object1Y: number,
        object1Width: number,
        object1Height: number,
        object2X: number,
        object2Y: number,
        object2Width: number,
        object2Height: number,
    ) {
        const collision =
            object1X > object2X &&
            object1X - object1Width < object2X + object2Width &&
            object1Y > object2Y &&
            object1Y - object1Height < object2Y + object2Height;

        return collision;
    }

    isInScreen(nextX: number, nextY: number) {
        return (
            nextX >= 10 &&
            nextX <= this.app.screen.width + 10 &&
            nextY >= 10 &&
            nextY <= this.app.screen.height + 10
        );
    }

    generateBonus() {
        const greenSquare = new PIXI.Sprite(PIXI.Texture.WHITE);
        greenSquare.position.set(
            Math.random() * this.app.screen.width,
            Math.random() * this.app.screen.height
        );
        greenSquare.width = 10;
        greenSquare.height = 10;
        greenSquare.tint = 0x00ff00;
        this.app.stage.addChild(greenSquare);
        this.bonusArray.push(greenSquare);
    }

    handleBonusCollisions(nextX: number, nextY: number) {
        this.bonusArray.forEach((bonus) => {
            const collision = this.detectCollision(
                nextX,
                nextY,
                this.container.width,
                this.container.height,
                bonus.x,
                bonus.y,
                bonus.width,
                bonus.height
            );
            if (collision) {
                bonus.destroy();
                this.bonusArray.splice(this.bonusArray.indexOf(bonus), 1);
                this.speed = this.speed * 1.1;
                this.scoreValue += 1 + (this.speed - 1) * 100 * 1000;
            }
        });
    }

    addTicker(): void {
        this.app.ticker.add((delta) => {
            // rotate the container!
            this.ellapsedTime += delta;
            if (this.ellapsedTime / 100 > this.spawnedBonuses) {
                this.spawnedBonuses++;
                this.generateBonus();
            }
        });

        this.app.ticker.add(() => {
            let nextX = this.container.x;
            let nextY = this.container.y;
            const currentX = this.container.x;
            const currentY = this.container.y;
            if (this.Controller.Keyboard.isKeyDown(...PLAYER.LEFT)) {
                nextX -= this.speed;
            }
            if (this.Controller.Keyboard.isKeyDown(...PLAYER.RIGHT)) {
                nextX += this.speed;
            }
            if (this.Controller.Keyboard.isKeyDown(...PLAYER.UP)) {
                nextY -= this.speed;
            }
            if (this.Controller.Keyboard.isKeyDown(...PLAYER.DOWN)) {
                nextY += this.speed;
            }
            const isBunnyOnScreen = this.isInScreen(nextX, nextY);
            if (isBunnyOnScreen) {
                const gameOver = this.detectCollision(
                    nextX,
                    nextY,
                    this.container.width,
                    this.container.height,
                    this.redSquare.x,
                    this.redSquare.y,
                    this.redSquare.width,
                    this.redSquare.height
                );
                if (gameOver) {
                    this.redSquare.visible = false;
                    this.container.visible = false;
                    this.bonusArray.forEach((bonus) => (bonus.visible = false));
                    // this.app.renderer.backgroundColor = 0x000000;
                    const text = new PIXI.Text('GAME OVER', {
                        fontFamily: 'Arial',
                        fontSize: 24,
                        fill: 0xff0000,
                        align: 'center',
                    });
                    text.anchor.set(0.5, 0.5);
                    text.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
                    //      text.x = app.screen.width / 2;
                    //    text.y = app.screen.height / 2;
                    this.app.stage.addChild(text);
                    this.app.ticker.stop();
                    //  speedBoostTime = 300;
                    //  speed = speed * 3;
                }
                this.handleBonusCollisions(nextX, nextY);

                if (!gameOver) {
                    this.container.x = nextX;
                    this.container.y = nextY;
                }
            }
            this.Controller.update();
        });
    }
}
