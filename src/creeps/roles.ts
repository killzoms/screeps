import { Action } from "./creeps"
import { action } from "./action"
var creepsMisc = require("creeps.misc");

class RoleAction {
    Action: Action;

    constructor(action: Action, priority: number, shouldRun: (creep: Creep) => boolean = Action.shouldRun) {
        this.Action = action;
    }
}

export class BodyPart {
    PartName: string;
    Multiplier: number;

    constructor(PartName: string, mult: number) {
        this.PartName = PartName;
        this.Multiplier = mult;
    }
}

export class Role {
    BodyParts: BodyPart[];
    Actions: RoleAction[];
    Limit: (creep: Creep) => number;
    Priority: number;

    constructor(bodyParts: BodyPart[], actions: RoleAction[], limit: (creep: Creep) => number, priority: number) {
        this.BodyParts = bodyParts
        this.Actions = actions
        this.Limit = limit
        this.Priority = priority
    }

    static base = {
        BodyParts: [new BodyPart(WORK, 1), new BodyPart(CARRY, 1), new BodyPart(MOVE, 2)]
    }
}

var roleAction = new Action("Role", 5, function () { return true }, true, function (creep: Creep) {
    Roles.runBestAction(creep);
});

export class Roles {
    roles = ["hauler", "harvester", "builder", "healer", "upgrader", "attacker", "scout"];

    public static Init() {
        action.RegisterAction(roleAction);
        global.roles = {

            hauler: {
                BodyParts: [{ PartName: CARRY, Multiplier: 1 }, { PartName: MOVE, Multiplier: 1 }],
                Actions: [new RoleAction(Game.actions.haul, 10), new RoleAction(Game.actions.upgrade, 6, function (creep) { return creepsMisc.getCreepsByRole("upgrader").length <= 0 && Game.actions.upgrade.ShouldRun(creep); }), new RoleAction(Game.actions.build, 8, function (creep) { return creepsMisc.getCreepsByRole("builder").length <= 0 && Game.actions.build.ShouldRun(creep); }), new RoleAction(Game.actions.repair, 7, function (creep) { return Game.actions.repair.ShouldRun(creep); }), new RoleAction(Game.actions.pickupItems, 2), new RoleAction(Game.actions.harvest, 1), /*new Action(buildAction, 9), new Action(upgradeAction, 8), new Action(harvestAction, 1)*/],
                Limit: function (creep: Creep) { return 2; },
                Priority: 3
            },
            harvester: {
                BodyParts: [{ PartName: WORK, Multiplier: 1 }, { PartName: MOVE, Multiplier: 1 }],
                Actions: [new RoleAction(Game.actions.haul, 10, function (creep) { return creepsMisc.getCreepsByRole("hauler").length <= 0 && creep.store.getFreeCapacity() == 0 && Game.actions.haul.ShouldRun(creep) }), new RoleAction(Game.actions.harvest, 9), new RoleAction(Game.actions.repair, 8), /*new Action(buildAction, 9), new Action(upgradeAction, 8), new Action(harvestAction, 1)*/],
                Limit: function (creep: Creep) {
                    var limit = 0;
                    if (Memory.cachedRooms) {
                        for (var roomIndex in Memory.cachedRooms) {
                            if (Memory.cachedRooms[roomIndex].sourceData) {
                                //return Memory.cachedRooms[roomIndex].sourceData.length + 1;
                                for (var sourceIndex in Memory.cachedRooms[roomIndex].sourceData) {
                                    var sourceData = Memory.cachedRooms[roomIndex].sourceData[sourceIndex];
                                    if (sourceData.totalPositions) {
                                        limit += sourceData.totalPositions;
                                    }
                                }
                            }
                        }
                    }
                    return limit;
                },
                Priority: 1
            },
            builder: {
                BodyParts: [{ PartName: WORK, Multiplier: 1 }, { PartName: CARRY, Multiplier: 0.5 }, { PartName: MOVE, Multiplier: 1.5 }],
                Actions: [new RoleAction(Game.actions.build, 10), new RoleAction(Game.actions.repair, 9), new RoleAction(Game.actions.upgrade, 8), new RoleAction(Game.actions.pickupItems, 99), new RoleAction(Game.actions.harvest, 98), /*new Action(buildAction, 9), new Action(upgradeAction, 8), new Action(harvestAction, 1)*/],
                Limit: function (creep) { return 1; },
                Priority: 4
            },
            healer: {
                BodyParts: [{ PartName: HEAL, Multiplier: 1 }, { PartName: MOVE, Multiplier: 1 }],
                Actions: [new RoleAction(Game.actions.heal, 10), new RoleAction(Game.actions.upgrade, 8), new RoleAction(Game.actions.repair, 7), new RoleAction(Game.actions.pickupItems, 3), new RoleAction(Game.actions.harvest, 3), /*new Action(buildAction, 9), new Action(upgradeAction, 8), new Action(harvestAction, 1)*/],
                Limit: function (creep) { return 0; },
                Priority: 11
            },
            upgrader: {
                BodyParts: [{ PartName: WORK, Multiplier: 1 }, { PartName: CARRY, Multiplier: 0.5 }, { PartName: MOVE, Multiplier: 1.5 }],
                Actions: [new RoleAction(Game.actions.upgrade, 10), new RoleAction(Game.actions.haul, 9), new RoleAction(Game.actions.repair, 8), new RoleAction(Game.actions.build, 7), new RoleAction(Game.actions.pickupItems, 2), new RoleAction(Game.actions.harvest, 1), /*new Action(buildAction, 9), new Action(upgradeAction, 8), new Action(harvestAction, 1)*/],
                Limit: function (creep) { return 1; },
                Priority: 2
            },
            attacker: {
                BodyParts: [{ PartName: TOUGH, Multiplier: 2 }, { PartName: ATTACK, Multiplier: 1 }, { PartName: MOVE, Multiplier: 3 }],
                Actions: [new RoleAction(Game.actions.attack, 10), new RoleAction(Game.actions.upgrade, 7), new RoleAction(Game.actions.repair, 8), new RoleAction(Game.actions.haul, 6), new RoleAction(Game.actions.pickupItems, 2), new RoleAction(Game.actions.harvest, 1), /*new Action(buildAction, 9), new Action(upgradeAction, 8), new Action(harvestAction, 1)*/],
                Limit: function (creep) { return 0; },
                Priority: 10
            },

            scout: {
                BodyParts: [{ PartName: MOVE, Multiplier: 1 }, { PartName: ATTACK, Multiplier: 1 }],
                Actions: [new RoleAction(Game.actions.scout, 10), new RoleAction(Game.actions.repair, 9), new RoleAction(Game.actions.harvest, 1)],
                Limit: function (creep: Creep) {
                    var limit = 0;
                    return limit;/*
                    if (Memory.cachedRooms) {
                        for (var roomIndex in Memory.cachedRooms) {
                            limit++;
                            var room = Memory.cachedRooms[roomIndex];
                            if (room.exitCount) {
                                limit += room.exitCount;
                            }
                        }
                    }

                    return limit;*/
                },
                Priority: 60
            }
        }
    }


    public static runBestAction(creep: Creep) {
        var roleData = global.roles[creep.memory.roleData.Role];
        if (roleData) {
            var sortedActions = _.sortBy(roleData.Actions, (action) => { return -action.Action.Priority; })
            for (var i in sortedActions) {
                var pickedAction = sortedActions[i];

                if (pickedAction.Action.ShouldRun(creep)) {
                    pickedAction.Action.Run(creep);
                    creep.memory.lastAction = pickedAction.Action.Name;
                    if (pickedAction.Action.ShouldBreak) {
                        break;
                    }
                }
            }
        }
    }
}
