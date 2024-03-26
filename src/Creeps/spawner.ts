/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('creeps.spawner');
 * mod.thing == 'a thing'; // true
 */
import { MemoryStructure } from "memoryManager";
import { Creeps, BodyPart, RoleData } from "./creeps";


function buildBody(bodyPartsData: BodyPart[], spawn: StructureSpawn): BodyPartConstant[]
{
    let multiplier = 0;
    let bodyParts: BodyPartConstant[] = [];

    for (var bodyPart of Creeps.Roles.Base.BodyParts)
    {
        var addedParts = 0;
        while (bodyPart.Multiplier < addedParts)
        {
            bodyParts.push(bodyPart.PartName);
            addedParts++;
        }
    }

    var baseCost = Creeps.Misc.calculateEnergyCost(bodyParts);

    var reachedLimit = false;
    while (!reachedLimit)
    {
        var potentialParts: string[] = [];
        for (var i in bodyPartsData)
        {
            var potentialPart = bodyPartsData[i];
            var potentialPartNum = Math.floor(potentialPart.Multiplier * (multiplier + 1));
            var addedParts = 0;
            while (potentialPartNum > addedParts)
            {
                potentialParts.push(potentialPart.PartName);
                addedParts++;
            }
        }

        var potentialCost = Creeps.Misc.calculateEnergyCost(potentialParts);

        reachedLimit = potentialCost + baseCost > Spawner.getSpawnerCapacity(spawn);

        if (!reachedLimit)
        {
            multiplier++;
        }
    }

    for (var bodyPart of bodyPartsData)
    {
        var bodyPartCount = Math.floor(bodyPart.Multiplier * multiplier);

        var addedParts = 0;
        while (bodyPartCount > addedParts)
        {
            bodyParts.push(bodyPart.PartName);
            addedParts++;
        }
    }

    return bodyParts;
}


export class Spawner
{
    public static spawnAllCreeps(spawn: StructureSpawn)
    {
        var renewingCreeps = _.filter(Game.creeps, (creep) => { return creep.memory.renewing; });
        if (renewingCreeps.length > 0)
        {
            return;
        }

        var harvesterCreepsLength = Creeps.Misc.getCreepsByRole("harvester").length;
        var upgraderCreepsLength = Creeps.Misc.getCreepsByRole("upgrader").length;
        var haulerCreepsLength = Creeps.Misc.getCreepsByRole("hauler").length;
        var builderCreepsLength = Creeps.Misc.getCreepsByRole("builder").length;

        var priorityRoles = _.sortBy(Creeps.Roles.roles, (role) =>
        {
            if (!global.roles[role])
            {
                return 0;
            }

            //if ()

            return global.roles[role].Priority;
        });

        for (var i in priorityRoles)
        {
            var role = priorityRoles[i];
            var roleData = global.roles[role];
            if (roleData)
            {
                var bodyParts = buildBody(roleData.BodyParts, spawn);
                var creeps = _.sortBy(Creeps.Misc.getCreepsByRole(role), (creep) => { return creep.body.length; });

                if (roleData.Limit() > creeps.length)
                {
                    Spawner.spawnCreep(role, spawn);
                    break;
                }
                else if (creeps.length > 0 && creeps[0].body.length < bodyParts.length)
                {
                    Spawner.tryReplaceCreep(creeps[0], spawn);
                    break;
                }
            }
        }
    }

    public static tryReplaceCreep(creep: Creep, spawn: StructureSpawn)
    {
        var oldMemory = Object.create(creep.memory);
        creep.suicide();

        Spawner.spawnCreep(oldMemory.role, spawn, oldMemory);
    }

    public static spawnCreep(role: string, spawn: StructureSpawn, memory = {})
    {
        var roleData = global.roles[role];
        if (roleData)
        {
            var bodyParts = buildBody(roleData.BodyParts, spawn);
            var creeps = Creeps.Misc.getCreepsByRole(role);

            var energyCost = Creeps.Misc.calculateEnergyCost(bodyParts);

            if (creeps.length < roleData.Limit())
            {
                if (Spawner.getSpawnerCapacity(spawn) >= energyCost)
                {
                    var newName = role + Game.time;
                    if (!spawn.spawning)
                    {
                        console.log("Spawning new creep: " + newName);
                        spawn.spawnCreep(bodyParts, newName, { memory: new MemoryStructure(new RoleData(role, roleData.Priority)) });
                    }
                }
                else
                {
                    var energyBeforeSpawn = energyCost - Spawner.getSpawnerCapacity(spawn);
                    spawn.room.visual.text(energyBeforeSpawn + " more energy needed to spawn\n" + role, spawn.pos.x, spawn.pos.y - 1, { opacity: 0.5 });
                }
            }
        }
    }

    public static getSpawnerCapacity(spawner: StructureSpawn)
    {
        var extensions: StructureExtension[] = spawner.room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_EXTENSION; } });
        var extensionCapacity = 0;
        for (let extension of extensions)
        {
            extensionCapacity += extension.store.getUsedCapacity(RESOURCE_ENERGY);
        }
        return extensionCapacity + spawner.store.getUsedCapacity(RESOURCE_ENERGY);
    }
}
