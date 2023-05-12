import Phaser from "phaser";

import core from "../core";
import { type Game } from "../game";
import { type MenuScene } from "./menuScene";
import { InputPacket } from "../packets/sending/inputPacket";
import { Player } from "../objects/player";
import gsap from "gsap";
import Vector2 = Phaser.Math.Vector2;
import { Obstacles } from "../../../../common/src/definitions/obstacles";
import { JoinPacket } from "../packets/sending/joinPacket";

export class GameScene extends Phaser.Scene {
    activeGame: Game;

    constructor() {
        super("game");
    }

    preload(): void {
        if (core.game === undefined) return;
        this.activeGame = core.game;

        for (const object of Obstacles.definitions) {
            for (let i = 0; i < object.images.length; i++) {
                this.load.svg(`${object.idString}_${i}`, require(`../../assets/img/game/${object.images[i]}`));
            }
        }

        this.load.audio("swing", require("../../assets/audio/sfx/swing.mp3"));
        this.load.audio("grass_step_01", require("../../assets/audio/sfx/footsteps/grass_01.mp3"));
        this.load.audio("grass_step_02", require("../../assets/audio/sfx/footsteps/grass_02.mp3"));

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (this.player === undefined) return;
            this.player.rotation = Math.atan2(pointer.worldY - this.player.container.y, pointer.worldX - this.player.container.x);
            this.player.inputsDirty = true;
        });

        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown() && !this.player.punching) {
                this.player.punching = true;
                const altFist: boolean = Math.random() < 0.5;
                gsap.to(altFist ? this.player.leftFist : this.player.rightFist, {
                    x: 75,
                    y: altFist ? 10 : -10,
                    duration: 0.11,
                    repeat: 1,
                    yoyo: true,
                    ease: "none",
                    onComplete: () => { this.player.punching = false; }
                });
                this.sound.add("swing").play();
            }
        });

        this.addKey("W", "movingUp");
        this.addKey("S", "movingDown");
        this.addKey("A", "movingLeft");
        this.addKey("D", "movingRight");

        this.cameras.main.setZoom(this.sys.game.canvas.width / 2560);
    }

    private addKey(keyString: string, valueToToggle: string): void {
        const key: Phaser.Input.Keyboard.Key | undefined = this.input.keyboard?.addKey(keyString);
        if (key !== undefined) {
            key.on("down", () => {
                this.player[valueToToggle] = true;
                this.player.inputsDirty = true;
            });

            key.on("up", () => {
                this.player[valueToToggle] = false;
                this.player.inputsDirty = true;
            });
        }
    }

    get player(): Player {
        return this.activeGame.activePlayer;
    }

    create(): void {
        (this.scene.get("menu") as MenuScene).stopMusic();

        $("#game-ui").show();

        // Draw grid
        const GRID_WIDTH = 7200;
        const GRID_HEIGHT = 7200;
        const CELL_SIZE = 160;

        for (let x = 0; x <= GRID_WIDTH; x += CELL_SIZE) {
            this.add.line(x, 0, x, 0, x, GRID_HEIGHT * 2, 0x000000, 0.25).setOrigin(0, 0);
        }

        for (let y = 0; y <= GRID_HEIGHT; y += CELL_SIZE) {
            this.add.line(0, y, 0, y, GRID_WIDTH * 2, y, 0x000000, 0.25).setOrigin(0, 0);
        }

        // Create the player
        this.activeGame.activePlayer = new Player(this.activeGame, this, "Player", this.activeGame.socket, new Vector2(0, 0));

        // Follow the player w/ the camera
        this.cameras.main.startFollow(this.player.container);

        // Start the tick loop
        this.tick();

        // Send a packet indicating that the game is now active
        this.activeGame.sendPacket(new JoinPacket(this.player));
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    update(): void {}

    tick(): void {
        if (this.player?.inputsDirty) {
            this.player.inputsDirty = false;
            this.activeGame.sendPacket(new InputPacket(this.player));
        }

        setTimeout(() => { this.tick(); }, 30);
    }
}
