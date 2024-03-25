import { MoveDest, RoleData, Action } from "Creeps/creeps";

export class MemoryStructure implements CreepMemory {
    version: number;
    roleData: RoleData;
    healing: boolean = false;
    disable: boolean = false;
    dest: MoveDest | null = null;
    lastAction: string | undefined = undefined;
    renewing: boolean | undefined = undefined;

    constructor(roleData: RoleData) {
        this.version = MemoryManager.CurVersion;
        this.roleData = roleData;
    }
}

export class MemoryManager {
    static readonly CurVersion = 1;

    public static updateMemory(creep: Creep, roleData: RoleData | null = null) {
        if (!creep.memory.version) {
            creep.memory.version = 0;
        }
    }

    public static assignMemory(creep: Creep, roleData: RoleData) {
        creep.memory = new MemoryStructure(roleData);
    }
}
