import { ai } from "./ai";
import { movement } from "./movement";
import { action } from "./action";
import { Misc } from "./misc";
import { Roles } from "./roles";
import { Spawner } from "./spawner";
import { Priority } from "Empire/priority";

export const Creeps = {
    Ai: ai,
    Action: action,
    Movement: movement,
    Misc: Misc,
    Roles: Roles,
    Spawner: Spawner
};

export class BodyPart
{
    PartName: BodyPartConstant;
    Multiplier: number;

    constructor(PartName: BodyPartConstant, mult: number)
    {
        this.PartName = PartName;
        this.Multiplier = mult;
    }
}

export class RoleData extends Priority
{
    Role: string;
    Draining: boolean = false;

    constructor(role: string, priority: number)
    {
        super(priority);
        this.Role = role;
    }
}

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

export class MoveDest
{
    Pos: { x: number, y: number, roomName: string; };
    Range: number;

    constructor(pos: { x: number, y: number; roomName: string; }, range = 0)
    {
        this.Pos = pos;
        this.Range = range;
    }
}


export class Action extends Priority
{
    Name: string;
    ShouldRun: (creep: Creep) => boolean;
    ShouldBreak: boolean;
    Run: (creep: Creep) => void;

    constructor(name: string, priority: number, shouldRun: (creep: Creep) => boolean, shouldBreak: boolean = false, fn: (creep: Creep) => void)
    {
        super(priority);
        this.Name = name;
        this.ShouldRun = shouldRun;
        this.ShouldBreak = shouldBreak;
        this.Run = fn;
    }

    public static shouldRun(creep: Creep): boolean
    {
        return true;
    }
}

export class HealData
{
    Healing: boolean = false;
    HealerName: string = "";
}
