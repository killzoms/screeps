export class Priority
{
    public Priority: number;

    public constructor(priority: number)
    {
        this.Priority = priority;
    }

    public static getPriority(obj: Structure | ConstructionSite | Priority)
    {
        if (obj instanceof Structure || obj instanceof ConstructionSite)
        {
            return Priority.getStructurePriority(obj);
        }
        else
        {
            if (typeof obj.Priority == "undefined")
            {
                return 0;
            }

            return obj.Priority;
        }
    }

    public static getStructurePriority(structure: Structure | ConstructionSite)
    {
        switch (structure.structureType)
        {
            case STRUCTURE_WALL:
                return 1;
            case STRUCTURE_RAMPART:
                return 2;
            case STRUCTURE_CONTAINER:
                return 4;
            case STRUCTURE_EXTENSION:
                return 3;
            case STRUCTURE_ROAD:
                return 2;
            default:
                return 99;
        }
    }
}
