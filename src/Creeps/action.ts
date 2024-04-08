import { Priority } from "Empire/priority";
import { Empire } from "Empire/empire";
import { SourceData } from "Empire/resources";
import { Misc } from "./misc";
import { Movement } from "./movement";

export class HealData
{
    Healing: boolean = false;
    HealerName: string = "";
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

    public static Init()
    {
        Game.actions = {
            renew: renew,
            move: movement,
            clearHealing: clearHealing,
            haul: haulAction,
            upgrade: upgradeAction,
            pickupItems: pickupItemsAction,
            harvest: harvestAction,
            heal: healAction,
            build: buildAction,
            repair: repairAction,
            attack: attackAction,
            scout: scoutAction,
        };
    }

    public static RegisterAction(action: Action)
    {
        Game.actions[action.Name] = action;
    }
}

function clearHealingAction(creep: Creep)
{
    creep.memory.healData.Healing = false;
}

var clearHealing = new Action("clearHealing", 200, function (creep: Creep) { return creep.hits == creep.hitsMax; }, false, clearHealingAction);

function findClosestSpawn(creep: Creep)
{
    var sortedSpawns = _.sortBy(Game.spawns, (spawn) => { return creep.pos.getRangeTo(spawn); });

    return sortedSpawns[0];
}

function shouldRenew(creep: Creep)
{
    var closestSpawn = findClosestSpawn(creep);
    var regenedTicks = 600 / creep.body.length;
    var regenCost = Misc.calculateEnergyCost(Misc.getBody(creep)) * 0.4 / creep.body.length;
    return (creep.memory.renewing || (Misc.getTicksToLive(creep) < 500 && closestSpawn.store.getUsedCapacity(RESOURCE_ENERGY) > regenCost));
}

function movementAction(creep: Creep)
{
    Movement.processMovement(creep);
}

var movement = new Action("move", 1, Movement.shouldMove, false, movementAction);

var renew = new Action("renew", 11, shouldRenew, true, function (creep)
{
    var closestSpawn = findClosestSpawn(creep);
    var regenedTicks = 600 / creep.body.length;
    var regenCost = Misc.calculateEnergyCost(Misc.getBody(creep)) * 0.4 / creep.body.length;

    creep.say("Renewing");

    if (creep.memory.renewing && (Misc.getTicksToLive(creep) > 1200 || closestSpawn.store.getUsedCapacity(RESOURCE_ENERGY) < regenCost))
    {
        creep.memory.renewing = false;
        return;
    }

    if (!creep.memory.renewing)
    {
        creep.memory.renewing = true;
    }
    if (creep.memory.renewing)
    {
        var renewResult = closestSpawn.renewCreep(creep);
        if (renewResult == ERR_NOT_IN_RANGE || renewResult == ERR_BUSY)
        {
            Movement.assignDest(creep, closestSpawn, 1);
        }
    }
});

function scout(creep: Creep)
{/*
    if (!creep.memory.scoutData) {
        creep.memory.scoutData = {};
    }

    var fCreeps = creep.room.find(FIND_MY_CREEPS, {
        filter: function (fCreep) {
            if (fCreep != creep) {
                if (fCreep.scoutData && fCreep.scoutData.assignedRoom == creep.room.name) {
                    return true;
                }
            }
            return false;
        }
    });

    if (flength == 0) {
        creep.memory.scoutData.assignedRoom = creep.room.name;
    }
    else {

    }*/
}

var scoutAction = new Action("scout", 0, function (creep) { return false;/* return !creep.memory.scoutData || (creep.memory.scoutData && creep.memory.scoutData.assignedRoom != creep.room.name)*/ }, true, scout);

function harvest(creep: Creep)
{
    var idealSource: Source | undefined;
    if (creep.memory.sourceData != undefined && creep.memory.sourceData.roomName != undefined && creep.memory.sourceData.Index != undefined)
    {
        if (Memory.cachedRooms[creep.memory.sourceData.roomName].sourceData == null)
        {
            Empire.SourceController.findAllSources();
        }
        var roomSource = Memory.cachedRooms[creep.memory.sourceData.roomName].sourceData[creep.memory.sourceData.Index];
        if (typeof Game.rooms[creep.memory.sourceData.roomName] == "undefined")
        {
            Movement.assignDest(creep, creep.memory.sourceData, 1);
        }
        else
        {
            var lookAt = Game.rooms[creep.memory.sourceData.roomName].lookForAt(LOOK_SOURCES, roomSource.x, roomSource.y);
            idealSource = lookAt[0];
        }
    }
    else
    {
        var sources = _.sortBy(Empire.SourceController.getAvailableSources(), (sourceData) => { return creep.pos.getRangeTo(new RoomPosition(sourceData.x, sourceData.y, sourceData.roomName)); });

        if (sources.length > 0)
        {
            var source: SourceData = sources[0];
            var room = Game.rooms[source.roomName];
            if (typeof room == "undefined")
            {
                Movement.assignDest(creep, source, 1);
            }
            else
            {
                var lookAt = room.lookForAt(LOOK_SOURCES, source.x, source.y);
                idealSource = lookAt[0];
                Empire.SourceController.assignSource(creep, source);
            }
        }
    }

    if (idealSource != undefined)
    {
        var result = creep.harvest(idealSource);

        if (result == ERR_NOT_IN_RANGE)
        {
            Movement.assignDest(creep, idealSource, 1);
        }
    }
}

var harvestAction = new Action("harvest", 0, function (creep)
{
    if (creep.memory.roleData.Role != "harvester")
    {
        return Empire.SourceController.getAvailableEnergy() > 0 && !getDraining(creep);
    }
    return Empire.SourceController.getAvailableEnergy() > 0;
}, true, harvest);

function attack(creep: Creep)
{
    var enemies = Empire.EnemyController.getEnemies();

    if (enemies.length > 0 && creep.attack(enemies[0]) == ERR_NOT_IN_RANGE)
    {
        Movement.assignDest(creep, enemies[0], 1);
    }
}

var attackAction = new Action("attack", 0, function (creep)
{
    var enemies = Empire.EnemyController.getEnemies();
    return _.filter(creep.body, (bodyPart) => { return bodyPart.type == ATTACK; }).length > 0 && enemies.length > 0 && _.filter(enemies, (enemy: Creep) => { return enemy.owner.username == "Invader"; }).length > 0;
}, true, attack);

function build(creep: Creep)
{
    var constructionSites = _.sortBy(creep.room.find(FIND_CONSTRUCTION_SITES), (target) =>
    {
        return Priority.getPriority(target);
    });
    var targetSite = constructionSites[0];

    var filteredSites = _.filter(constructionSites, function (site)
    {
        return targetSite.structureType == site.structureType;
    });

    var target: ConstructionSite | null = creep.pos.findClosestByRange(filteredSites);

    if (target != null && creep.build(target) == ERR_NOT_IN_RANGE)
    {
        Movement.assignDest(creep, target, 3);
    }
}

function getDraining(creep: Creep)
{
    if (typeof creep.memory.roleData.Draining == "undefined")
    {
        creep.memory.roleData.Draining = false;
    }

    if (creep.memory.roleData.Draining == false && creep.store.getFreeCapacity() == 0)
    {
        creep.memory.roleData.Draining = true;
    }
    else if (creep.memory.roleData.Draining == true && creep.store.getUsedCapacity() == 0)
    {
        creep.memory.roleData.Draining = false;
    }

    return creep.memory.roleData.Draining;
}

var buildAction = new Action("build", 0, function (creep)
{
    return getDraining(creep) && creep.room.find(FIND_CONSTRUCTION_SITES).length > 0;
}, true, build);

function repair(creep: Creep)
{
    var targetsToRepair = creep.room.find(FIND_STRUCTURES, { filter: (structure: AnyStructure) => { return structure.hits < structure.hitsMax; } });
    var primaryTargets = _.sortBy(targetsToRepair, (target) =>
    {
        return target.hitsMax;
    });

    if (primaryTargets.length > 0)
    {
        var target = primaryTargets[0];

        if (creep.repair(target) == ERR_NOT_IN_RANGE)
        {
            Movement.assignDest(creep, target, 3);
        }
    }
}

var repairAction = new Action("repair", 0, function (creep) { return getDraining(creep) && creep.room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.hits < structure.hitsMax; } }).length > 0; }, true, repair);

function heal(creep: Creep)
{
    var allies = creep.room.find(FIND_MY_CREEPS, { filter: (creep) => { return creep.hits < creep.hitsMax; } });
    if (allies.length > 0)
    {
        var injuredAlly = allies[0];
        injuredAlly.memory.healData = { Healing: true, HealerName: creep.name };
        if (creep.heal(injuredAlly) == ERR_NOT_IN_RANGE)
        {
            Movement.assignDest(creep, injuredAlly, 1);
        }
        if (injuredAlly.hits == injuredAlly.hitsMax)
        {
            injuredAlly.memory.healData = { Healing: false, HealerName: creep.name };
        }

    }
}

var healAction = new Action("heal", 0, function (creep) { return creep.room.find(FIND_MY_CREEPS, { filter: (creep) => { return creep.hits < creep.hitsMax; } }).length > 0; }, true, heal);

function pickupItems(creep: Creep)
{
    var containers: StructureContainer[] = Empire.ResourceController.getContainers();

    var withdrawing = false;
    if (containers.length > 0)
    {
        var container = _.sortBy(containers, (container) =>
        {
            return creep.pos.getRangeTo(container.pos) - container.store.getUsedCapacity();
        })[0];

        if (container.store[RESOURCE_ENERGY] > creep.store.getFreeCapacity())
        {
            withdrawing = true;
            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                Movement.assignDest(creep, container, 1);
            }
        }
    }

    if (!withdrawing)
    {
        var droppedItem = _.sortBy(Empire.ResourceController.getDroppedItems(), (droppedItem) =>
        {
            return creep.pos.getRangeTo(droppedItem.pos) / (droppedItem.amount * 0.5);
        })[0];

        var returnVar = creep.pickup(droppedItem);

        if (returnVar == ERR_NOT_IN_RANGE)
        {
            Movement.assignDest(creep, droppedItem, 1);
        }
    }
};

var pickupItemsAction = new Action("pickupItems", 0, function (creep) { return !getDraining(creep) && (Empire.ResourceController.getDroppedItems().filter((droppedItem) => { return droppedItem.resourceType == RESOURCE_ENERGY; }).length > 0 || Empire.ResourceController.getContainers().filter((container) => { return container.store[RESOURCE_ENERGY] > 0; }).length > 0); }, true, pickupItems);

function upgrade(creep: Creep)
{
    var target = creep.room.controller;
    if (creep.room.controller != undefined && creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
    {
        Movement.assignDest(creep, target as StructureController, 3);
    }
}

var upgradeAction = new Action("upgrade", 0, function (creep) { return global.shouldUpgrade && getDraining(creep) && creep.room.controller != undefined && creep.room.controller.my; }, true, upgrade);

function haul(creep: Creep)
{
    var targetStructures = Misc.getFillableStructures(creep.room, (fillable) => { return !(fillable instanceof ConstructionSite) && fillable.structureType != STRUCTURE_CONTAINER; });

    if (targetStructures.length > 0)
    {
        var transporting = creep.store.getUsedCapacity(RESOURCE_ENERGY) != 0;

        if (transporting && creep.transfer(targetStructures[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
        {
            Movement.assignDest(creep, targetStructures[0], 1);
        }
    }
}

var haulAction = new Action("haul", 0, function (creep) { return getDraining(creep) && Misc.getFillableStructures(creep.room, (fillable) => { return !(fillable instanceof ConstructionSite) && fillable.structureType != STRUCTURE_CONTAINER; }).length > 0; }, true, haul);
