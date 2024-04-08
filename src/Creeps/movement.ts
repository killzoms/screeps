/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('creeps.movement');
 * mod.thing == 'a thing'; // true
 */

import { SourceController } from "Empire/resources";
import { CachedRoom } from "Empire/rooms";

export class MoveData
{
    Dest: MoveDest | undefined;
    NewDest: boolean = false;
    Moving: boolean = false;
    Inc: number = 0;
    movePath: MovePath = {
        path: [],
        incomplete: false
    };
}

export class Dest
{
    x: number;
    y: number;
    roomName: string;

    constructor(x: number, y: number, roomName: string)
    {
        this.x = x;
        this.y = y;
        this.roomName = roomName;
    }
}

export class MoveDest
{
    Pos: Dest;
    Range: number;

    constructor(pos: Dest, range = 0)
    {
        this.Pos = pos;
        this.Range = range;
    }
}

export class MovePath
{
    path: PathStep[] | string;
    incomplete: boolean;

    constructor(path: PathStep[], incomplete: boolean)
    {
        this.path = path;
        this.incomplete = incomplete;
    }
}

function getDirection(dx: number, dy: number)
{
    var direction: DirectionConstant;
    if (dx == 1)
    {
        if (dy == 1)
        {
            direction = BOTTOM_RIGHT;
        }
        else if (dy == -1)
        {
            direction = TOP_RIGHT;
        }
        else
        {
            direction = RIGHT;
        }
    }
    else if (dx == -1)
    {
        if (dy == 1)
        {
            direction = BOTTOM_LEFT;
        }
        else if (dy == -1)
        {
            direction = TOP_LEFT;
        }
        else
        {
            direction = LEFT;
        }
    }
    else
    {
        if (dy == 1)
        {
            direction = BOTTOM;
        }
        else if (dy == -1)
        {
            direction = TOP;
        }
        else
        {
            direction = 0 as DirectionConstant;
        }
    }

    return direction;
}

function areDestsEqual(l: MoveDest | null, r: MoveDest | null)
{
    if (l == null || r == null)
    {
        return l == r;
    }
    return l.Pos.x == r.Pos.x && l.Pos.y == r.Pos.y && l.Pos.roomName == r.Pos.roomName && l.Range == r.Range;
}

function mapToMovePath(pathFinderPath: RoomPosition[], orgPos: RoomPosition): PathStep[]
{
    var curX = orgPos.x, curY = orgPos.y;
    let path = [];

    for (var i = 0; i < pathFinderPath.length; i++)
    {
        var pos = pathFinderPath[i];
        if (pos.roomName != orgPos.roomName)
        {
            break;
        }

        var x = pos.x;
        var y = pos.y;
        var dx: number;
        var dy: number;
        var direction: number;

        if (x > curX)
        {
            dx = 1;
        }
        else if (x < curX)
        {
            dx = -1;
        }
        else
        {
            dx = 0;
        }

        if (y > curY)
        {
            dy = 1;
        }
        else if (y < curY)
        {
            dy = -1;
        }
        else
        {
            dy = 0;
        }

        var result = {
            x: x,
            dx: dx,
            y: y,
            dy: dy,
            direction: getDirection(dx, dy)
        };

        curX = x;
        curY = y;
        path.push(result);
    }

    return path;
}

function findPath(curCreep: Creep, destPos: RoomPosition, opts: { range: number; })
{
    var orgPos = curCreep.pos;

    var pathFinderPath = PathFinder.search(orgPos, { pos: destPos, range: opts.range }, {
        // We need to set the defaults costs higher so that we
        // can set the road cost lower in `roomCallback`
        plainCost: 10,
        swampCost: 15,

        roomCallback: function (roomName): CostMatrix | boolean
        {

            let room = Game.rooms[roomName];

            // In this example `room` will always exist, but since
            // PathFinder supports searches which span multiple rooms
            // you should be careful!
            var costs = new PathFinder.CostMatrix;
            if (!Memory.cachedRooms)
            {
                Memory.cachedRooms = {};
            }
            var cachedRoom: CachedRoom | undefined = undefined;
            if (typeof Memory.cachedRooms[roomName] != "undefined")
            {
                cachedRoom = Memory.cachedRooms[roomName];

                if (cachedRoom.tickCached >= Game.time)
                {
                    return PathFinder.CostMatrix.deserialize(cachedRoom.CostMatrix);
                }
            }

            if (!room)
            {
                return false;
            }
            var filter = function (struct: { structureType: StructureConstant; pos: RoomPosition; })
            {
                if (struct.structureType === STRUCTURE_ROAD)
                {
                    // Favor roads over plain tiles
                    costs.set(struct.pos.x, struct.pos.y, 5);
                }
                else if (struct.structureType == STRUCTURE_RAMPART && (struct as StructureRampart).my)
                {
                    if (costs.get(struct.pos.x, struct.pos.y) != 0xff)
                    {
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    }
                }
                else if (struct.structureType !== STRUCTURE_CONTAINER &&
                    (struct.structureType !== STRUCTURE_RAMPART ||
                        !(struct as StructureRampart).my))
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
                costs.set(creep.pos.x, creep.pos.y, 0xff);

                if (!creep.my)
                {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                }
                else if ((creep.memory.roleData && curCreep.memory.roleData && creep.memory.roleData.Priority <= curCreep.memory.roleData.Priority))
                {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                }
            });

            if (cachedRoom == undefined)
            {
                cachedRoom = new CachedRoom(room.name, Game.time, SourceController.findSourcesInRoom(room.name));
            }

            cachedRoom.sourceData = SourceController.findSourcesInRoom(room.name);
            cachedRoom.CostMatrix = costs.serialize();
            cachedRoom.tickCached = Game.time;
            cachedRoom.ExitCount = 0;
            if (room.find(FIND_EXIT_TOP).length > 0)
            {
                cachedRoom.ExitCount++;
            }

            if (room.find(FIND_EXIT_RIGHT).length > 0)
            {
                cachedRoom.ExitCount++;
            }

            if (room.find(FIND_EXIT_LEFT).length > 0)
            {
                cachedRoom.ExitCount++;
            }

            if (room.find(FIND_EXIT_BOTTOM).length > 0)
            {
                cachedRoom.ExitCount++;
            }

            Memory.cachedRooms[roomName] = cachedRoom;
            return costs;
        }
    });

    var movePath = new MovePath(mapToMovePath(pathFinderPath.path, orgPos), pathFinderPath.incomplete);

    return movePath;
}

export class Movement
{
    static assignDest(creep: Creep, pos: { x: number, y: number; roomName: string; } | { pos: { x: number, y: number; roomName: string; }; }, range = 0)
    {
        var castPos = pos as { pos: { x: number, y: number; roomName: string; }; };
        if (castPos.pos != undefined)
        {
            pos = castPos.pos;
        }

        var newDest = new MoveDest(pos as { x: number, y: number; roomName: string; }, range);
        if (Movement.notAtDest(creep, newDest) && !(creep.memory.moveData.Dest && areDestsEqual(creep.memory.moveData.Dest, newDest)))
        {
            creep.memory.moveData.NewDest = true;
            creep.memory.moveData.Dest = newDest;
        }
    }

    static shouldMove(creep: Creep)
    {
        return creep.memory.renewing || (creep.memory.healData && creep.memory.healData.Healing) || (creep.memory.moveData.Moving || Movement.notAtDest(creep));
    }

    static notAtDest(creep: Creep, dest: MoveDest | undefined = undefined)
    {
        if (dest == undefined)
        {
            dest = creep.memory.moveData.Dest;
            if (dest == undefined)
            {
                return false;
            }
        }

        return !creep.pos.inRangeTo(dest.Pos.x, dest.Pos.y, dest.Range);
    }

    static processMovement(creep: Creep)
    {
        var movePath = creep.memory.moveData.movePath;
        if (creep.memory.healData && creep.memory.healData.Healing)
        {
            Movement.assignDest(creep, Game.creeps[creep.memory.healData.HealerName], 1);
        }

        if (creep.memory.moveData.NewDest || (!creep.memory.moveData.Moving && Movement.notAtDest(creep)))
        {
            creep.memory.moveData.Inc = 0;
            creep.memory.moveData.Moving = true;
            var memDest = creep.memory.moveData.Dest;
            if (memDest != null)
            {
                movePath = findPath(creep, memDest.Pos as RoomPosition, { range: memDest.Range });
            }
        }
        else
        {
            if (movePath == undefined || typeof movePath.path == "undefined" || creep.memory.moveData.Inc >= 5)
            {
                var oldPath = movePath;
                var memDest = creep.memory.moveData.Dest;
                if (memDest != null)
                {
                    movePath = findPath(creep, memDest.Pos as RoomPosition, { range: memDest.Range });
                    if (movePath.incomplete)
                    {
                        movePath = oldPath;
                    }
                }
                creep.memory.moveData.Inc = 0;
            }
        }

        creep.memory.moveData.Inc += 1;

        if (typeof movePath == "undefined" || typeof movePath.path == "undefined" || movePath.path.length == 0)
        {
            var memDest = creep.memory.moveData.Dest;
            if (memDest != null)
            {
                movePath = findPath(creep, memDest.Pos as RoomPosition, { range: memDest.Range });
            }
            creep.memory.moveData.Inc = 0;
        }

        if (typeof movePath != "undefined" && typeof movePath.path == "string")
        {
            movePath.path = Room.deserializePath(movePath.path);
        }

        var mPath = movePath.path as PathStep[];
        if (mPath != undefined)
        {
            if (creep.fatigue <= 0 && mPath[0])
            {
                var nextStep = mPath[0];
                if (creep.pos.x == nextStep.x && creep.pos.y == nextStep.y && mPath.length > 1)
                {
                    mPath.shift();
                    nextStep = mPath[0];
                }

                creep.move(nextStep.direction);
            }

            if (Movement.notAtDest(creep))
            {
                creep.memory.moveData.movePath = movePath;
                creep.memory.moveData.movePath.path = Room.serializePath(mPath);
                creep.memory.moveData.NewDest = false;
            }
            else
            {
                creep.memory.moveData.Moving = false;
            }
        }
    }
}
