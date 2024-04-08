import { Misc } from "Creeps/misc";
import { CachedRoom } from "./rooms";

export class SourceData extends RoomPosition
{
    public Index: number;

    public constructor(roomName: string, x: number, y: number, index: number)
    {
        super(x, y, roomName);
        this.Index = index;
    }
}

export class EmpireSource extends RoomPosition
{
    public Index: number;
    public PositionData: PositionData;

    constructor(pos: RoomPosition, sourceIndex: number, positionData: PositionData)
    {
        super(pos.x, pos.y, pos.roomName);

        this.Index = sourceIndex;
        this.PositionData = positionData;
    }
}

export class PositionData
{
    public TotalPositions: number;
    public OpenPositions: number;

    public constructor(usedPositions: number, totalPositions: number)
    {
        this.TotalPositions = totalPositions;
        this.OpenPositions = totalPositions - usedPositions;
    }
}

function findOpenPositions(sourcePos: RoomPosition, index: number): PositionData
{
    var positionsToLookAt = [new RoomPosition(sourcePos.x - 1, sourcePos.y - 1, sourcePos.roomName), new RoomPosition(sourcePos.x, sourcePos.y - 1, sourcePos.roomName), new RoomPosition(sourcePos.x + 1, sourcePos.y - 1, sourcePos.roomName),
    new RoomPosition(sourcePos.x - 1, sourcePos.y, sourcePos.roomName), new RoomPosition(sourcePos.x + 1, sourcePos.y, sourcePos.roomName),
    new RoomPosition(sourcePos.x - 1, sourcePos.y + 1, sourcePos.roomName), new RoomPosition(sourcePos.x, sourcePos.y + 1, sourcePos.roomName), new RoomPosition(sourcePos.x + 1, sourcePos.y + 1, sourcePos.roomName)];
    if (Game.rooms[sourcePos.roomName])
    {
        var terrain = Game.rooms[sourcePos.roomName].getTerrain();
        var totalPositions = 0;
        var usedPositions = 0;

        for (var i in positionsToLookAt)
        {
            if (terrain.get(positionsToLookAt[i].x, positionsToLookAt[i].y) != TERRAIN_MASK_WALL)
            {
                totalPositions++;
            }
        }
        var harvesters = Misc.getCreepsByRole("harvester");
        for (var i in harvesters)
        {
            var creep = harvesters[i];
            if (creep.memory.sourceData && creep.memory.sourceData.Index == index && creep.memory.sourceData.roomName == sourcePos.roomName)
            {
                usedPositions++;
            }
        }

        return new PositionData(usedPositions, totalPositions);
    }

    if (Memory.cachedRooms[sourcePos.roomName])
    {
        return Memory.cachedRooms[sourcePos.roomName].sourceData[index].PositionData;
    }

    return new PositionData(0, 0);
}

export class SourceController
{
    public static Sources: Record<string, EmpireSource[]>;

    public static getAvailableSources()
    {
        let availableSources = [];
        if (SourceController.Sources)
        {
            SourceController.Sources = SourceController.findAllSources();
        }

        for (var i in SourceController.Sources)
        {
            var roomSources = SourceController.Sources[i];
            if (roomSources != undefined)
            {
                for (let j = 0; j < roomSources.length; j++)
                {
                    var source: EmpireSource = roomSources[j];
                    var positionData = findOpenPositions(source, source.Index);
                    if (positionData.OpenPositions > 0)
                    {
                        availableSources.push(source);
                    }
                }
            }
        }

        return availableSources;
    }

    public static findAllSources(): Record<string, EmpireSource[]>
    {
        let foundSources: Record<string, EmpireSource[]> = {};
        if (!Memory.cachedRooms)
        {
            Memory.cachedRooms = {};
        }

        for (let i in Game.rooms)
        {
            let cachedRoom = Memory.cachedRooms[i];
            if (cachedRoom != undefined)
            {
                if (cachedRoom.tickCached == Game.time)
                {
                    continue;
                }
            }

            let fSources: EmpireSource[] = [];
            let found = Game.rooms[i].find(FIND_SOURCES);

            for (let j = 0; j < found.length; j++)
            {
                var source = found[j];
                var positionData = findOpenPositions(source.pos, j);


                fSources.push(new EmpireSource(source.pos, j, positionData));
            }
        }

        for (let i in Memory.cachedRooms)
        {
            let roomSources: EmpireSource[] = [];
            let cachedRoom = Memory.cachedRooms[i];
            if (cachedRoom == undefined)
            {
                continue;
            }

            for (let j = 0; j < cachedRoom.sourceData.length; j++)
            {
                roomSources.push(cachedRoom.sourceData[j]);
            }
            foundSources[i] = roomSources;
        }

        return foundSources;
    }

    public static findSourcesInRoom(roomName: string): EmpireSource[]
    {
        var room = Game.rooms[roomName];
        if (room)
        {
            var cachedRoom = Memory.cachedRooms[roomName];
            if (cachedRoom && cachedRoom.tickCached == Game.time)
            {
                return cachedRoom.sourceData;
            }

            let fSources: EmpireSource[] = [];
            let found = room.find(FIND_SOURCES);

            for (let j = 0; j < found.length; j++)
            {
                var source = found[j];
                var positionData = findOpenPositions(source.pos, j);


                fSources.push(new EmpireSource(source.pos, j, positionData));
            }

            return fSources;
        }
        return [];
    }

    public static assignSource(creep: Creep, source: SourceData)
    {
        if (Memory.cachedRooms[source.roomName] && Memory.cachedRooms[source.roomName].sourceData[source.Index])
        {
            if (Memory.cachedRooms[source.roomName].sourceData[source.Index].PositionData.OpenPositions > 0)
            {
                Memory.cachedRooms[source.roomName].sourceData[source.Index].PositionData.OpenPositions--;

                creep.memory.sourceData = source;
            }
        }
    }

    public static getAvailableEnergy()
    {
        var availableEnergy = 0;
        if (SourceController.Sources == undefined)
        {
            SourceController.Sources = SourceController.findAllSources();
        }

        for (var i in SourceController.Sources)
        {
            var roomSources = SourceController.Sources[i];
            for (var roomSource of roomSources)
            {
                if (Game.rooms[i])
                {
                    var room = Game.rooms[i];
                    var source = room.lookForAt(LOOK_SOURCES, roomSource.x, roomSource.y)[0];
                    availableEnergy += source.energy;
                }
            }
        }

        return availableEnergy;
    }
}

export class ResourceController
{
    public static findContainers()
    {

        var containers: Record<string, StructureContainer[]> = {};

        for (var i in Game.rooms)
        {
            var fContainers: StructureContainer[] = Game.rooms[i].find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_CONTAINER; } });

            containers[i] = [];
            for (var j in fContainers)
            {
                var container = fContainers[j];
                containers[i].push(container);
            }
        }

        return containers;
    }

    public static getContainers()
    {
        var containers = [];
        var foundContainers = ResourceController.findContainers();

        for (var i in foundContainers)
        {
            var roomContainers = foundContainers[i];
            for (var j in roomContainers)
            {
                containers.push(roomContainers[j]);
            }
        }
        return containers;
    }

    public static findDroppedItems()
    {
        var droppedItems: Record<string, Resource[]> = {};

        for (var i in Game.rooms)
        {
            var fResources: Resource[] = Game.rooms[i].find(FIND_DROPPED_RESOURCES);
            droppedItems[i] = [];
            for (var j in fResources)
            {
                var droppedResource = fResources[j];

                droppedItems[i].push(droppedResource);
            }
        }

        return droppedItems;
    }

    public static findRuins()
    {
        var ruins: Record<string, Ruin[]> = {};

        for (var i in Game.rooms)
        {
            var fRuins: Ruin[] = Game.rooms[i].find(FIND_RUINS);
            ruins[i] = [];
            for (var j in fRuins)
            {
                var fRuin = fRuins[j];

                ruins[i].push(fRuin);
            }
        }

        return ruins;
    }

    public static getDroppedItems()
    {
        var droppedItems = [];
        var foundItems = ResourceController.findDroppedItems();

        for (var i in foundItems)
        {
            var roomItems = foundItems[i];
            for (var j in roomItems)
            {
                droppedItems.push(roomItems[j]);
            }
        }

        return droppedItems;
    }

    public static getRuins()
    {
        var ruins = [];
        var foundRuins = ResourceController.findRuins();

        for (var i in foundRuins)
        {
            var roomRuins = foundRuins[i];
            for (var j in roomRuins)
            {
                ruins.push(roomRuins[j]);
            }
        }

        return ruins;
    }
};
