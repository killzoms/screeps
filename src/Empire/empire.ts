export class SourceData extends RoomPosition {
    public Index: number;

    public constructor(roomName: string, x: number, y: number, index: number) {
        super(x, y, roomName);
        this.Index = index;
    }
}

export class Empire {

}
