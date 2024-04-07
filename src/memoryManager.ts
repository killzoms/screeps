import { HealData } from "Creeps/action";
import { MoveData } from "Creeps/movement";
import { RoleData } from "Creeps/roles";
import { SourceData } from "Empire/resources";

export class MemoryStructure implements CreepMemory
{
    version: number;
    roleData: RoleData;
    healData: HealData = new HealData();
    disable: boolean = false;
    lastAction: string = "none";
    renewing: boolean = false;
    sourceData: SourceData | null = null;
    moveData: MoveData = new MoveData();

    constructor(roleData: RoleData)
    {
        this.version = MemoryManager.CurVersion;
        this.roleData = roleData;
    }
}

export class MemoryManager
{
    static readonly CurVersion = 1;

    public static updateMemory(creep: Creep, roleData: RoleData | null = null)
    {
        if (!creep.memory.version)
        {
            creep.memory.version = 0;
        }
    }

    public static assignMemory(creep: Creep, roleData: RoleData)
    {
        creep.memory = new MemoryStructure(roleData);
    }
}
