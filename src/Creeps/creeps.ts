import { Ai } from "./ai";
import { Movement, MovePath, MoveDest } from "./movement";
import { Action } from "./action";
import { Misc } from "./misc";
import { Roles, Role } from "./roles";
import { Spawner } from "./spawner";
import { Priority } from "Empire/priority";

export class CreepPos
{
    x: number;
    y: number;
    roomName: string;
    range: number;

    constructor(pos: RoomPosition, range = 0)
    {
        this.x = pos.x;
        this.y = pos.y;
        this.roomName = pos.roomName;
        this.range = range;
    }
}

export const Creeps = { Ai, Action, Movement, Misc, Roles, Spawner, Role };
