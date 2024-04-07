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
    Pos: Dest;
    Range: number;

    constructor(pos: Dest, range = 0)
    {
        this.Pos = pos;
        this.Range = range;
    }
}

export class Dest
{
    x: number;
    y: number;
    roomName: string;

    constructor(x: number, y: number, roomName: string)
    {
        this.x = x;
        this.y = y;
        this.roomName = roomName;
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

export class MoveData
{
    Dest: MoveDest | undefined;
    NewDest: boolean = false;
    Moving: boolean = false;
    Inc: number = 0;
    movePath: MovePath = {
        path: [],
        incomplete: false
    };
}

export class MovePath
{
    path: PathStep[] | string;
    incomplete: boolean;

    constructor(path: PathStep[], incomplete: boolean)
    {
        this.path = path;
        this.incomplete = incomplete;
    }
}
