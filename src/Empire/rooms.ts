import { EmpireSource } from "./resources";

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
