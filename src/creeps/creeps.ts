import { ai } from "./ai";
import { movement } from "./movement"
import { action } from "./action";

export const creeps = {
    Ai: ai,
    Action: action,
    Movement: movement
}

export class BodyPart
{
    type: string;

    constructor(type: string)
    {
        this.type = type;
    }
}

export class RoleData
{
    Role: string;
    Priority: number;

    constructor(role: string, priority: number)
    {
        this.Role = role;
        this.Priority = priority;
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
        this.y = pos.y
        this.roomName = pos.roomName
        this.range = range;
    }
}

export class MoveDest
{
    Pos: { x: number, y: number, roomName: string };
    Range: number;

    constructor(pos: RoomPosition, range = 0)
    {
        this.Pos = pos;
        this.Range = range;
    }
}


export class Action
{
    Name: string;
    Priority: number;
    ShouldRun: (creep: Creep) => boolean;
    ShouldBreak: boolean;
    Run: (creep: Creep) => void;

    constructor(name: string, priority: number, shouldRun: (creep: Creep) => boolean = null, shouldBreak: boolean = false, fn: (creep: Creep) => void = null)
    {
        this.Name = name;
        this.Priority = priority;
        this.ShouldRun = shouldRun;
        this.ShouldBreak = shouldBreak;
        this.Run = fn;
    }
}
