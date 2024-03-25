import { BodyPart, creeps } from "creeps/creeps"

export class Misc
{
    public calculateEnergyCost(bodyParts: string[])
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

    public getDistance(pos1: RoomPosition, pos2: RoomPosition)
    {
        return Math.sqrt(((pos1.x - pos2.x) ^ 2) + ((pos1.y - pos2.y) ^ 2));
    }

    public getCreepsByRole(role: string)
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


    public findStructuresByType(room: Room, type: string): AnyStructure[]
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

    public pickBestContainer(sourcePos: RoomPosition, creep: Creep)
    {
        var containers = this.findStructuresByType(creep.room, STRUCTURE_CONTAINER) as Array<StructureContainer>;
        var targetRoom = Game.rooms[sourcePos.roomName];
        return _.sortBy(containers, (container) =>
        {
            return targetRoom.findPath(sourcePos, container.pos).length + container.store.getFreeCapacity();
        })[0]
    }


    public pickupDroppedItems(creep: Creep, pos: RoomPosition)
    {
        var droppedItems = Game.rooms[pos.roomName].find(FIND_DROPPED_RESOURCES, { filter: (droppedItem) => { return droppedItem.resourceType == RESOURCE_ENERGY } });
        var closestItems = _.sortBy(droppedItems, (item) => { return pos.findPathTo(item.pos).length - item.amount * 0.5 })

        if (creep.pickup(closestItems[0]) == ERR_NOT_IN_RANGE)
        {
            creeps.Movement.assignDest(creep, closestItems[0], 1);
        }
    }

    public getTargetStructures(room: Room)
    {
        return room.find(FIND_STRUCTURES, { filter: (structure) => { return this.isTarget(structure) } });
    }

    public getFillableStructures(room: Room, filterFn = (u: AnyStructure) => { })
    {
        return room.find(FIND_STRUCTURES, { filter: (structure) => { return this.isFillable(structure as AnyStoreStructure) && filterFn(structure) } });
    }

    public getRepairableStructures(room: Room)
    {
        return room.find(FIND_STRUCTURES, { filter: (structure) => { return this.isRepairable(structure) } })
    }

    public isFillable(structure: AnyStoreStructure)
    {
        return typeof structure.store != "undefined" && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }

    public isRepairable(structure: AnyStructure)
    {
        return structure.hits < structure.hitsMax
    }

    public isTarget(structure: AnyStructure)
    {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART || structure.structureType == STRUCTURE_ROAD || structure.structureType == STRUCTURE_CONTAINER);
    }
}
