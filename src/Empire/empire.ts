import { EnemyController } from "./enemies";
import { ResourceController, SourceController } from "./resources";

export class SourceData extends RoomPosition
{
    public Index: number;

    public constructor(roomName: string, x: number, y: number, index: number)
    {
        super(x, y, roomName);
        this.Index = index;
    }
}

export const Empire =
{
    EnemyController: EnemyController,
    SourceController: SourceController,
    ResourceController: ResourceController
};

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

export class CachedRoom
{
    public roomName: string;
    public tickCached: number;
    public sourceData: EmpireSource[];
    public CostMatrix: number[] = [];
    public ExitCount: number = 0;

    public constructor(roomName: string, tickCached: number, sourceData: EmpireSource[])
    {
        this.roomName = roomName;
        this.tickCached = tickCached;
        this.sourceData = sourceData;
    }
}

var empireResources = require("empire.resources");
var empireRooms = require("empire.rooms");

module.exports = {
    sourceController: empireResources.sourceController,
    resourceController: empireResources.resourceController,
    roomController: empireRooms.roomController,

};
