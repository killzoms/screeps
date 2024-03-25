var creepsMovement = require("creeps.movement");
var creepsMisc = require("creeps.misc");
var creepsEmpire = require("empire");
var creepsPriority = require("creeps.priority");
import { Action, Creeps } from "./creeps";


function clearHealingAction(creep: Creep) {
    creep.memory.healing = false;
}

var clearHealing = new Action("clearHealing", 200, function (creep: Creep) { return creep.hits == creep.hitsMax }, false, clearHealingAction)

function findClosestSpawn(creep: Creep) {
    var sortedSpawns = _.sortBy(Game.spawns, (spawn) => { return creep.pos.getRangeTo(spawn) });

    return sortedSpawns[0];
}

function shouldRenew(creep: Creep) {
    var closestSpawn = findClosestSpawn(creep);
    var regenedTicks = 600 / creep.body.length;
    var regenCost = Creeps.Misc.calculateEnergyCost(Creeps.Misc.getBody(creep)) * 0.4 / creep.body.length;
    return (creep.memory.renewing || (Creeps.Misc.getTicksToLive(creep) < 500 && closestSpawn.store.getUsedCapacity(RESOURCE_ENERGY) > regenCost))
}

function movementAction(creep: Creep) {
    creepsMovement.processMovement(creep);
}

var movement = new Action("move", 1, creepsMovement.shouldMove, false, movementAction);

var renew = new Action("renew", 11, shouldRenew, true, function (creep) {
    var closestSpawn = findClosestSpawn(creep);
    var regenedTicks = 600 / creep.body.length;
    var regenCost = Creeps.Misc.calculateEnergyCost(Creeps.Misc.getBody(creep)) * 0.4 / creep.body.length;

    creep.say("Renewing");

    if (creep.memory.renewing && (Creeps.Misc.getTicksToLive(creep) > 1200 || closestSpawn.store.getUsedCapacity(RESOURCE_ENERGY) < regenCost)) {
        creep.memory.renewing = false;
        return;
    }

    if (!creep.memory.renewing) {
        creep.memory.renewing = true;
    }
    if (creep.memory.renewing) {
        var renewResult = closestSpawn.renewCreep(creep)
        if (renewResult == ERR_NOT_IN_RANGE || renewResult == ERR_BUSY) {
            creepsMovement.assignDest(creep, closestSpawn, 1)
        }
    }
});

function scout(creep: Creep) {/*
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

    if (fCreeps.length == 0) {
        creep.memory.scoutData.assignedRoom = creep.room.name;
    }
    else {

    }*/
}

var scoutAction = new Action("scout", 0, function (creep) { return false; return !creep.memory.scoutData || (creep.memory.scoutData && creep.memory.scoutData.assignedRoom != creep.room.name) }, true, scout);

function harvest(creep: Creep) {
    var idealSource;
    if (creep.memory.sourceData && creep.memory.sourceData.roomName && creep.memory.sourceData.index) {
        if (typeof Memory.cachedRooms[creep.memory.sourceData.roomName].sourceData == "undefined") {
            Empire.sourceController.findSources();
        }
        var roomSource = Memory.cachedRooms[creep.memory.sourceData.roomName].sourceData[creep.memory.sourceData.index];
        var sourcePos = new RoomPosition(roomSource.x, roomSource.y, creep.memory.sourceData.roomName);
        if (typeof Game.rooms[creep.memory.sourceData.roomName] == "undefined") {
            creepsMovement.assignDest(creep, sourcePos, 1)
        }
        else {
            var lookAt = Game.rooms[creep.memory.sourceData.roomName].lookForAt(LOOK_SOURCES, roomSource.x, roomSource.y);
            idealSource = lookAt[0];
        }
    }
    else {
        var sources = _.sortBy(Empire.sourceController.getAvailableSources(), (sourceData) => { return creep.pos.getRangeTo(new RoomPosition(sourceData.x, sourceData.y, sourceData.roomName)) });

        if (sources.length > 0) {
            var source: Source = sources[0];
            var room = Game.rooms[source.roomName];
            if (typeof room == "undefined") {
                creepsMovement.assignDest(creep, new RoomPosition(source.x, source.y, source.roomName), 1)
            }
            else {
                var lookAt = room.lookForAt(LOOK_SOURCES, source.x, source.y);
                idealSource = lookAt[0];
                creepsEmpire.sourceController.assignSource(creep, source);
            }
        }
    }


    if (typeof idealSource != "undefined") {
        var result = creep.harvest(idealSource)
        if (result == ERR_NOT_IN_RANGE) {
            creepsMovement.assignDest(creep, idealSource, 1);
        }
    }
}

var harvestAction = new Action("harvest", 0, function (creep) {
    if (creep.memory.roleData.role != "harvester") {
        return creepsEmpire.sourceController.getAvailableEnergy() > 0 && !getDraining(creep);
    }
    return creepsEmpire.sourceController.getAvailableEnergy() > 0;
}, true, harvest);

function attack(creep) {
    var enemies = creepsEmpire.enemyController.getEnemies();

    if (enemies.length > 0 && creep.attack(enemies[0]) == ERR_NOT_IN_RANGE) {
        creepsMovement.assignDest(creep, enemies[0], 1);
    }
}

var attackAction = new Action("attack", 0, function (creep) {
    var enemies = creepsEmpire.enemyController.getEnemies();
    return _.filter(creep.body, (bodyPart) => { return bodyPart.type == ATTACK; }).length > 0 && enemies.length > 0 && _.filter(enemies, (enemy) => { return enemy.owner.username == "Invader"; }).length > 0;
}, true, attack);

function build(creep) {
    var constructionSites = _.sortBy(creep.room.find(FIND_CONSTRUCTION_SITES), (target) => {
        return creepsPriority.getPriority(target);
    });
    var targetSite = constructionSites[0];

    var filteredSites = _.filter(constructionSites, function (site) {
        return targetSite.structureType == site.structureType;
    });

    var target = creep.pos.findClosestByRange(filteredSites);

    if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creepsMovement.assignDest(creep, target, 3);
    }
}

function getDraining(creep) {
    if (typeof creep.memory.roleData.draining == "undefined") {
        creep.memory.roleData.draining = false;
    }

    if (creep.memory.roleData.draining == false && creep.store.getFreeCapacity() == 0) {
        creep.memory.roleData.draining = true;
    }
    else if (creep.memory.roleData.draining == true && creep.store.getUsedCapacity() == 0) {
        creep.memory.roleData.draining = false;
    }

    return creep.memory.roleData.draining;
}

var buildAction = new Action("build", 0, function (creep) {
    return getDraining(creep) && creep.room.find(FIND_CONSTRUCTION_SITES).length > 0;
}, true, build);

function repair(creep) {
    var targetsToRepair = creep.room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.hits < structure.hitsMax; } });
    var primaryTargets = _.sortBy(targetsToRepair, (target) => {
        return target.hitsMax;
    })

    if (primaryTargets.length > 0) {
        var target = primaryTargets[0];

        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            creepsMovement.assignDest(creep, target, 3);
        }
    }
}

var repairAction = new Action("repair", 0, function (creep) { return getDraining(creep) && creep.room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.hits < structure.hitsMax; } }).length > 0; }, true, repair);

function heal(creep) {
    var allies = creep.room.find(FIND_MY_CREEPS, { filter: (creep) => { return creep.hits < creep.hitsMax } });
    if (allies.length > 0) {
        var injuredAlly = allies[0];
        injuredAlly.memory.healData = { healing: true, healerName: creep.name };
        if (creep.heal(injuredAlly) == ERR_NOT_IN_RANGE) {
            creepsMovement.assignDest(creep, injuredAlly, 1);
        }
        if (injuredAlly.hits == injuredAlly.hitsMax) {
            injuredAlly.memory.healData = { healing: false, healerName: creep.name };
        }

    }
}

var healAction = new Action("heal", 0, function (creep) { return creep.room.find(FIND_MY_CREEPS, { filter: (creep) => { return creep.hits < creep.hitsMax } }).length > 0; }, true, heal);

function pickupItems(creep) {
    var containers = creepsEmpire.resourceController.getContainers().concat(creepsEmpire.resourceController.getRuins());
    var withdrawing = false;
    if (containers.length > 0) {
        var container = _.sortBy(containers, (container) => {
            return creep.pos.getRangeTo(container.pos) - container.store.getUsedCapacity();
        })[0];

        if (container.store[RESOURCE_ENERGY] > creep.store.getFreeCapacity()) {
            withdrawing = true;
            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creepsMovement.assignDest(creep, container, 1);
            }
        }
    }

    if (!withdrawing) {
        var droppedItem = _.sortBy(creepsEmpire.resourceController.getDroppedItems(), (droppedItem) => {
            return creep.pos.getRangeTo(droppedItem.pos) / (droppedItem.amount * 0.5);
        })[0];

        var returnVar = creep.pickup(droppedItem)

        if (returnVar == ERR_NOT_IN_RANGE) {
            creepsMovement.assignDest(creep, droppedItem, 1);
        }
    }
};

var pickupItemsAction = new Action("pickupItems", 0, function (creep) { return !getDraining(creep) && (creepsEmpire.resourceController.getDroppedItems().filter((droppedItem) => { return droppedItem.resourceType == RESOURCE_ENERGY }).length > 0 || creepsEmpire.resourceController.getContainers().filter((container) => { return container.store[RESOURCE_ENERGY] > 0; })) }, true, pickupItems);

function upgrade(creep) {
    var target = creep.room.controller;
    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creepsMovement.assignDest(creep, target, 3);
    }
}

var upgradeAction = new Action("upgrade", 0, function (creep) { return global.shouldUpgrade && getDraining(creep) && creep.room.controller.my; }, true, upgrade);

function haul(creep) {
    var targetStructures = creepsMisc.getFillableStructures(creep.room, (fillable) => { return typeof fillable != "ConstructionSite" && fillable.structureType != STRUCTURE_CONTAINER });

    if (targetStructures.length > 0) {
        var transporting = creep.store.getUsedCapacity(RESOURCE_ENERGY) != 0;

        if (transporting && creep.transfer(targetStructures[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creepsMovement.assignDest(creep, targetStructures[0], 1);
        }
    }
}

var haulAction = new Action("haul", 0, function (creep) { return getDraining(creep) && creepsMisc.getFillableStructures(creep.room, (fillable) => { return typeof fillable != "ConstructionSite" && fillable.structureType != STRUCTURE_CONTAINER }).length > 0 }, true, haul);


export class action {
    public static Init() {
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
        }
    }

    public static RegisterAction(action: Action) {
        Game.actions[action.Name] = action;
    }
}

module.exports = {
    Action: Action,


};
