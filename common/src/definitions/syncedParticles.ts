import { ZIndexes } from "../constants";
import { type Variation } from "../typings";
import { CircleHitbox } from "../utils/hitbox";
import { type EaseFunctions } from "../utils/math";
import { ObjectDefinitions, type ObjectDefinition, type ReferenceTo } from "../utils/objectDefinitions";
import { randomFloat } from "../utils/random";
import { Vec, type Vector } from "../utils/vector";
import { type ScopeDefinition } from "./scopes";

export type ValueSpecifier<T> = T | { readonly min: T, readonly max: T };
export type NumericSpecifier = ValueSpecifier<number>;
export type VectorSpecifier = ValueSpecifier<Vector>;

export interface Animated<T> {
    readonly start: ValueSpecifier<T>
    readonly end: ValueSpecifier<T>
    readonly easing?: keyof typeof EaseFunctions
}

export interface InternalAnimation<T> {
    readonly start: T
    readonly end: T
    readonly easing: (typeof EaseFunctions)[keyof typeof EaseFunctions]
}

export function resolveNumericSpecifier(numericSpecifier: NumericSpecifier): number {
    return typeof numericSpecifier === "number"
        ? numericSpecifier
        : randomFloat(numericSpecifier.min, numericSpecifier.max);
}

export function resolveVectorSpecifier(vectorSpecifier: VectorSpecifier): Vector {
    if ("x" in vectorSpecifier) return vectorSpecifier;

    const { min, max } = vectorSpecifier;
    return Vec.create(
        randomFloat(min.x, max.x),
        randomFloat(min.y, max.y)
    );
}

export type SyncedParticleDefinition = ObjectDefinition & {
    /**
     * @default {1}
     */
    readonly scale: Animated<number> | NumericSpecifier
    /**
     * @default {1}
     */
    readonly alpha: (Animated<number> & { creatorMult?: number }) | NumericSpecifier
    /**
     * @default {Infinity}
     */
    readonly lifetime: NumericSpecifier
    /**
     * @default {0}
     */
    readonly angularVelocity: NumericSpecifier
    /**
     * @default {Vec.create(0,0)}
     */
    readonly velocity: VectorSpecifier & { easing?: keyof typeof EaseFunctions }
    /**
     * @default {ZIndexes.ObstaclesLayer1}
     */
    readonly zIndex: ZIndexes

    readonly frame: string
    readonly tint?: number

    readonly depletePerMs: {
        readonly health: number
        readonly adrenaline: number
    }

    readonly hasCreatorID?: boolean
} & ({
    /**
     * @default {undefined}
     */
    readonly variations?: undefined
    readonly variationBits?: never
} | {
    /**
     * @default {undefined}
     */
    readonly variations: Variation
    readonly variationBits: number // TODO Auto generate this property if synced particles w/ variations are added
}) & ({
    readonly hitbox?: undefined
} | {
    readonly hitbox: CircleHitbox
    readonly snapScopeTo?: ReferenceTo<ScopeDefinition>
    /**
     * How long before the particle disappears do players zoom back out.
     */
    readonly scopeOutPreMs?: number
});

export interface SyncedParticleSpawnerDefinition {
    readonly type: ReferenceTo<SyncedParticleDefinition>
    readonly count: number
    readonly deployAnimation?: {
        readonly duration?: number
        readonly staggering?: {
            readonly delay: number
            readonly spawnPerGroup?: number
            readonly initialAmount?: number
        }
    }
    readonly spawnRadius: number
}

export const SyncedParticles = ObjectDefinitions.withDefault<SyncedParticleDefinition>()(
    "SyncedParticles",
    {
        scale: 1,
        alpha: 1,
        lifetime: Infinity,
        angularVelocity: 0,
        velocity: Vec.create(0, 0),
        zIndex: ZIndexes.ObstaclesLayer1,
        depletePerMs: {
            health: 0,
            adrenaline: 0
        }
    },
    ([derive, , createTemplate]) => {
        const syncedParticle = derive((idString: string, name?: string) => ({
            idString,
            name: name ?? (
                idString
                    .replace(/_/g, " ")
                    .split(" ")
                    .map(w => w && `${w[0].toUpperCase()}${w.slice(1)}`)
                    .join(" ")
            ),
            frame: idString
        }));

        const smokeLike = createTemplate(syncedParticle, {
            scale: {
                start: {
                    min: 1.5,
                    max: 2
                },
                end: {
                    min: 1.75,
                    max: 2.25
                }
            },
            alpha: {
                start: 1,
                end: 0,
                easing: "expoIn"
            },
            angularVelocity: {
                min: -0.0005,
                max: 0.0005
            },
            velocity: {
                min: {
                    x: -0.0002,
                    y: -0.0002
                },
                max: {
                    x: 0.0002,
                    y: 0.0002
                }
            },
            lifetime: {
                min: 19000,
                max: 21000
            },
            frame: "smoke_grenade_particle",
            zIndex: ZIndexes.BuildingsCeiling - 1,
            scopeOutPreMs: 3200
        });

        return [
            smokeLike(
                ["smoke_grenade_particle"],
                {
                    hitbox: new CircleHitbox(5),
                    snapScopeTo: "1x_scope"
                }
            ),
            smokeLike(
                ["plumpkin_smoke_grenade_particle"],
                {
                    tint: 0x854770,
                    hitbox: new CircleHitbox(5),
                    snapScopeTo: "1x_scope"
                }
            ),
            smokeLike(
                ["shrouded_particle"],
                {
                    tint: 0xaaaaaa,
                    hitbox: new CircleHitbox(5),
                    snapScopeTo: "1x_scope",
                    alpha: {
                        start: 0.5,
                        end: 0,
                        creatorMult: 0.15
                    },
                    velocity: {
                        easing: "circOut"
                    },
                    lifetime: {
                        min: 1800,
                        max: 2200
                    }
                }
            ),
            smokeLike(
                ["tear_gas_particle"],
                {
                    tint: 0xa0e6ff,
                    hitbox: new CircleHitbox(5),
                    snapScopeTo: "1x_scope",
                    depletePerMs: {
                        adrenaline: 0.0055
                    }
                }
            ),
            smokeLike(
                ["airdrop_smoke_particle"],
                {
                    velocity: {
                        min: {
                            x: -0.002,
                            y: -0.002
                        },
                        max: {
                            x: 0.002,
                            y: 0.002
                        },
                        easing: "circOut"
                    },
                    lifetime: {
                        min: 1500,
                        max: 2500
                    },
                    hitbox: new CircleHitbox(5)
                }
            )
        ];
    }
);
