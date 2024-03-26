import { Creeps } from "Creeps/creeps";

export class Misc
{
    public static calculateEnergyCost(bodyParts: string[])
    {
        var cost = 0;

        for (var part in bodyParts)
        {
            var bodyPart = bodyParts[part];

            switch (bodyPart)
            {
                case MOVE:
                    cost += BODYPART_COST.move;
                    break;
                case WORK:
                    cost += BODYPART_COST.work;
                    break;
                case ATTACK:
                    cost += BODYPART_COST.attack;
                    break;
                case CARRY:
                    cost += BODYPART_COST.carry;
                    break;
                case HEAL:
                    cost += BODYPART_COST.heal;
                    break;
                case RANGED_ATTACK:
                    cost += BODYPART_COST.ranged_attack;
                    break;
                case TOUGH:
                    cost += BODYPART_COST.tough;
                    break;
                case CLAIM:
                    cost += BODYPART_COST.claim;
                    break;
                default:
                    break;
            }
        }
        return cost;
    }

    public static getDistance(pos1: RoomPosition, pos2: RoomPosition)
    {
        return Math.sqrt(((pos1.x - pos2.x) ^ 2) + ((pos1.y - pos2.y) ^ 2));
    }

    public static getCreepsByRole(role: string)
    {
        var creepsByRole = [];
        for (var name in Game.creeps)
        {
            var creep = Game.creeps[name];
            if (creep.memory.roleData.Role == role)
            {
                creepsByRole.push(creep);
            }
        }
        return creepsByRole;
    }


    public static findStructuresByType(room: Room, type: string): AnyStructure[]
    {
        var structures = room.find(FIND_STRUCTURES);
        var foundStructures = [];
        for (var i in structures)
        {
            if (structures[i].structureType == type)
            {
                foundStructures.push(structures[i]);
            }
        }
        return foundStructures;
    }

    public static pickBestContainer(sourcePos: RoomPosition, creep: Creep)
    {
        var containers = this.findStructuresByType(creep.room, STRUCTURE_CONTAINER) as Array<StructureContainer>;
        var targetRoom = Game.rooms[sourcePos.roomName];
        return _.sortBy(containers, (container) =>
        {
            return targetRoom.findPath(sourcePos, container.pos).length + container.store.getFreeCapacity();
        })[0];
    }


    public pickupDroppedItems(creep: Creep, pos: RoomPosition)
    {
        var droppedItems = Game.rooms[pos.roomName].find(FIND_DROPPED_RESOURCES, { filter: (droppedItem) => { return droppedItem.resourceType == RESOURCE_ENERGY; } });
        var closestItems = _.sortBy(droppedItems, (item) => { return pos.findPathTo(item.pos).length - item.amount * 0.5; });

        if (creep.pickup(closestItems[0]) == ERR_NOT_IN_RANGE)
        {
            Creeps.Movement.assignDest(creep, closestItems[0], 1);
        }
    }

    public static getTicksToLive(creep: Creep): number
    {
        if (creep.ticksToLive == undefined)
        {
            return -1;
        }
        return creep.ticksToLive;
    }

    public static getBody(creep: Creep): string[]
    {
        return creep.body.map((part) => part.type);
    }

    public static getTargetStructures(room: Room)
    {
        return room.find(FIND_STRUCTURES, { filter: (structure) => { return this.isTarget(structure); } });
    }

    public static getFillableStructures(room: Room, filterFn = (u: { structureType: StructureConstant; store: StoreDefinition; }) => { })
    {
        return room.find(FIND_STRUCTURES, {
            filter: (structure) =>
            {
                var structStore = structure as { store: StoreDefinition; };
                if (structStore == undefined)
                {
                    return false;
                }

                var struct = structure as { structureType: StructureConstant; store: StoreDefinition; };
                if (struct == undefined)
                {
                    return false;
                }

                return this.isFillable(structStore) && filterFn(struct);
            }
        });
    }

    public static getRepairableStructures(room: Room)
    {
        return room.find(FIND_STRUCTURES, { filter: (structure) => { return this.isRepairable(structure); } });
    }

    public static isFillable(structure: { store: StoreDefinition; })
    {
        return typeof structure.store != "undefined" && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }

    public static isRepairable(structure: AnyStructure)
    {
        return structure.hits < structure.hitsMax;
    }

    public static isTarget(structure: AnyStructure)
    {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART || structure.structureType == STRUCTURE_ROAD || structure.structureType == STRUCTURE_CONTAINER);
    }
}
