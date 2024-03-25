/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('creeps.movement');
 * mod.thing == 'a thing'; // true
 */

import { MoveDest } from "creeps/creeps"

function getMemDest(creep: Creep)
{
    if (creep.memory.dest)
    {
        var position = new RoomPosition(creep.memory.dest.Pos.x, creep.memory.dest.Pos.y, creep.memory.dest.Pos.roomName);
        return new MoveDest(position, creep.memory.dest.Range);
    }
    return null;
}

function getDirection(dx, dy)
{

    var adx = Math.abs(dx), ady = Math.abs(dy);

    if (adx > ady * 2)
    {
        if (dx > 0)
        {
            return RIGHT;
        }
        else
        {
            return LEFT;
        }
    }
    else if (ady > adx * 2)
    {
        if (dy > 0)
        {
            return BOTTOM;
        }
        else
        {
            return TOP;
        }
    }
    else
    {
        if (dx > 0 && dy > 0)
        {
            return BOTTOM_RIGHT;
        }
        if (dx > 0 && dy < 0)
        {
            return TOP_RIGHT;
        }
        if (dx < 0 && dy > 0)
        {
            return BOTTOM_LEFT;
        }
        if (dx < 0 && dy < 0)
        {
            return TOP_LEFT;
        }
    }
}

function areDestsEqual(l, r)
{
    if (typeof l == "undefined")
    {
        return typeof r == "undefined";
    }
    return l.pos.x == r.pos.x && l.pos.y == r.pos.y && l.pos.roomName == r.pos.roomName && l.range == r.range;
}

function assignDest(creep, pos, range = 0)
{
    if (!(pos instanceof RoomPosition))
    {
        pos = pos.pos
    }
    var newDest = new MoveDest(pos, range);
    if (movement.notAtDest(creep, newDest) && !(creep.memory.dest && areDestsEqual(getMemDest(creep), newDest)))
    {
        creep.memory.newDest = true;
        creep.memory.dest = newDest;
    }
}

function mapToMovePath(pathFinderPath: RoomPosition[], orgPos: RoomPosition)
{
    var curX = orgPos.x, curY = orgPos.y;

    var retPath: PathFinderPath = {
        path: [],
        ops: 0,
        cost: 0,
        incomplete: false
    };

    for (var i = 0; i < pathFinderPath.length; i++)
    {
        var pos = pathFinderPath[i];
        if (pos.roomName != orgPos.roomName)
        {
            break;
        }
        var result = new RoomPosition(pos.x, pos.y, pos.roomName);

        curX = result.x;
        curY = result.y;
        retPath.path.push(result);
    }

    return retPath;
}


declare global
{
    interface PathFinderOpts
    {
        range: number
    }
}

function findPath(curCreep: Creep, destPos: RoomPosition, opts: PathFinderOpts)
{
    var orgPos = curCreep.pos;

    var pathFinderPath = PathFinder.search(orgPos, { pos: destPos, range: opts.range }, {
        // We need to set the defaults costs higher so that we
        // can set the road cost lower in `roomCallback`
        plainCost: 10,
        swampCost: 15,

        roomCallback: function (roomName)
        {

            let room = Game.rooms[roomName];

            // In this example `room` will always exist, but since
            // PathFinder supports searches which span multiple rooms
            // you should be careful!
            let costs = new PathFinder.CostMatrix;
            if (!Memory.cachedRooms)
            {
                Memory.cachedRooms = {};
            }
            var cachedRoom;
            if (typeof Memory.cachedRooms[roomName] != "undefined")
            {
                cachedRoom = Memory.cachedRooms[roomName];

                if (cachedRoom.tickCached >= Game.time)
                {
                    return PathFinder.CostMatrix.deserialize(cachedRoom.costMatrix);
                }
            }

            if (!room)
            {
                return;
            }
            var filter = function (struct)
            {
                if (struct.structureType === STRUCTURE_ROAD)
                {
                    // Favor roads over plain tiles
                    costs.set(struct.pos.x, struct.pos.y, 5);
                }
                else if (struct.structureType == STRUCTURE_RAMPART && struct.my)
                {
                    if (costs.get(struct.pos.x, struct.pos.y) != 0xff)
                    {
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    }
                }
                else if (struct.structureType !== STRUCTURE_CONTAINER &&
                    (struct.structureType !== STRUCTURE_RAMPART ||
                        !struct.my))
                {
                    // Can't walk through non-walkable buildings
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
            };

            room.find(FIND_STRUCTURES).forEach(filter);
            room.find(FIND_CONSTRUCTION_SITES).forEach(filter);

            // Avoid creeps in the room
            room.find(FIND_CREEPS).forEach(function (creep)
            {
                if (creep.pos.x > destPos.x + opts.range && creep.pos.x < destPos.x - opts.range && creep.pos.y > destPos.y + opts.range && creep.pos.y < destPos.y - opts.range)
                {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                }

                if (!creep.my)
                {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                }
                else if ((creep.memory.roleData && curCreep.memory.roleData && creep.memory.roleData.priority <= curCreep.memory.roleData.priority))
                {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                }
            });

            if (typeof cachedRoom == "undefined")
            {
                cachedRoom = {};
            }

            cachedRoom.costMatrix = costs.serialize();
            cachedRoom.tickCached = Game.time;
            cachedRoom.exitCount = 0;
            if (room.find(FIND_EXIT_TOP).length > 0)
            {
                cachedRoom.exitCount++;
            }

            if (room.find(FIND_EXIT_RIGHT).length > 0)
            {
                cachedRoom.exitCount++;
            }

            if (room.find(FIND_EXIT_LEFT).length > 0)
            {
                cachedRoom.exitCount++;
            }

            if (room.find(FIND_EXIT_BOTTOM).length > 0)
            {
                cachedRoom.exitCount++;
            }

            Memory.cachedRooms[roomName] = cachedRoom;
            return costs;
        }
    });

    pathFinderPath.path = mapToMovePath(pathFinderPath.path, orgPos);

    return pathFinderPath;
}

export const movement =
{
    /** @param {Creep} creep @param {RoomPosition} pos */
    assignDest: assignDest,

    shouldMove: function (creep: Creep)
    {
        return creep.memory.renewing || (creep.memory.healData && creep.memory.healData.healing) || (creep.memory.moving || movement.notAtDest(creep));
    },

    notAtDest: function (creep: Creep, dest: MoveDest)
    {
        if (!dest)
        {
            dest = getMemDest(creep);
        }

        if (typeof dest == typeof RoomPosition)
        {
            return !creep.pos.inRangeTo(dest, 1);
        }
        return dest && !creep.pos.inRangeTo(dest, dest.range);
    },

    processMovement: function (creep)
    {
        var movePath = creep.memory.movePath;
        if (creep.memory.healData && creep.memory.healData.healing)
        {
            assignDest(creep, Game.creeps[creep.memory.healData.healerName], 1)
        }

        if (creep.memory.newDest || (!creep.memory.moving && movement.notAtDest(creep)))
        {
            creep.memory.moveInc = 0;
            creep.memory.moving = true;
            var memDest = getMemDest(creep)
            movePath = findPath(creep, memDest.pos, { range: memDest.range });
        }
        else
        {
            if (typeof movePath == "undefined" || typeof movePath.path == "undefined" || creep.memory.moveInc >= 5)
            {
                var oldPath = movePath;
                var memDest = getMemDest(creep)
                movePath = findPath(creep, memDest.pos, { range: memDest.range });
                if (movePath.incomplete)
                {
                    movePath = oldPath;
                }
                creep.memory.moveInc = 0;
            }
        }

        creep.memory.moveInc += 1;

        if (typeof movePath == "undefined" || typeof movePath.path == "undefined" || movePath.path.length == 0)
        {
            var memDest = getMemDest(creep);
            movePath = findPath(creep, memDest.pos, { range: memDest.range });
            creep.memory.moveInc = 0;
        }

        if (typeof movePath != "undefined" && typeof movePath.path == "string")
        {
            movePath.path = Room.deserializePath(movePath.path);
        }

        if (creep.fatigue <= 0 && movePath.path && movePath.path[0])
        {
            var creepsAtNewPos = creep.room.lookForAt(LOOK_CREEPS, movePath.path[0].x, movePath.path[0].y);

            if (creepsAtNewPos[0] && creepsAtNewPos[0].my && creepsAtNewPos[0].name != creep.name && creepsAtNewPos[0].memory.roleData.priority > creep.memory.roleData.priority)
            {
                var blockingCreep = creepsAtNewPos[0];
                if (typeof blockingCreep.memory.movement == "undefined")
                {
                    blockingCreep.memory.movement = { amBlocking: false, blocking: "" };
                }
                blockingCreep.memory.movement.amBlocking = true;
                blockingCreep.memory.movement.blocking = creep.name;

                blockingCreep.move(blockingCreep.pos.getDirectionTo(creep.pos));
            }

            if (typeof creep.memory.movement != "undefined" && creep.memory.movement.amBlocking == true)
            {
                creep.memory.movement.amBlocking = false;
            }
            else
            {
                creep.move(movePath.path[0].direction);
                console.log("Creep: " + creep.name + ": " + movePath.path[0].direction);
                if (creep.pos.x == movePath.path[0].x && creep.pos.y == movePath.path[0].y)
                {
                    movePath.path.shift();
                    creep.memory.movePath.curPos = { x: creep.pos.x, y: creep.pos.y, roomName: creep.pos.roomName }
                }
            }
        }

        if (movement.notAtDest(creep))
        {
            creep.memory.movePath = movePath;
            if (typeof movePath.path != typeof [])
            {
                console.log(movePath.path);
            }
            creep.memory.movePath.path = Room.serializePath(movePath.path);
            creep.memory.newDest = false;
        }
        else
        {
            creep.memory.moving = false;
        }
    }
}
