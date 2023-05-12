import { type SuroiBitStream } from "../../../../common/src/utils/suroiBitStream";
import { type Game } from "../game";
import { type ObjectType } from "../../../../common/src/utils/objectType";
import { type Vector } from "../../../../common/src/utils/vector";

export abstract class GameObject {
    id: number;
    type: ObjectType;

    game: Game;
    scene: Phaser.Scene;

    position: Vector;
    rotation: number;

    constructor(game: Game, scene: Phaser.Scene) {
        this.game = game;
        this.scene = scene;
    }

    abstract deserializePartial(stream: SuroiBitStream): void;
    abstract deserializeFull(stream: SuroiBitStream): void;

    abstract destroy(): void;
}
