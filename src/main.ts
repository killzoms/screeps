import { ErrorMapper } from "utils/ErrorMapper";
import { Creeps } from "Creeps/creeps";
import { Action, HealData } from "Creeps/action";
import { Role, RoleData } from "Creeps/roles";
import { MemoryManager } from "memoryManager";
import { SourceData } from "Empire/resources";
import { CachedRoom } from "Empire/rooms";
import { MoveData } from "Creeps/movement";
import { Empire } from "Empire/empire";

declare global
{
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */

  // Memory extension samples
  interface Memory
  {
    uuid: number;
    log: any;
    oldData: any;
    cachedRooms: Record<string, CachedRoom>;
  }

  interface CreepMemory
  {
    renewing: boolean;
    sourceData: SourceData | null;
    roleData: RoleData;
    healData: HealData;
    disable: boolean;
    version: number;
    lastAction: string;
    moveData: MoveData;
  }

  interface Game
  {
    actions: Record<string, Action>;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS
  {
    interface Global
    {
      log: any;
      shouldUpgrade: Boolean;
      roles: Record<string, Role>;
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() =>
{
  console.log("Hello World!");
  //profiler.wrap(function() {
  var spawn = Game.spawns["Spawn1"];
  if (spawn && spawn.room.controller != null)
  {
    var controllerDowngrade = CONTROLLER_DOWNGRADE[spawn.room.controller.level];

    if (global.shouldUpgrade == null || (!global.shouldUpgrade && spawn.room.controller.ticksToDowngrade < controllerDowngrade - 5000))
    {
      global.shouldUpgrade = true;
    }
    else if (spawn.room.controller.ticksToDowngrade > controllerDowngrade - 500)
    {
      global.shouldUpgrade = spawn.room.controller.level < 5;;
    }

  }

  Empire.Structures.ProcessStructures();

  if (Memory.oldData != null)
  {
    delete Memory.oldData;
  }

  for (var creepName in Game.creeps)
  {
    var creep = Game.creeps[creepName];
    MemoryManager.updateMemory(creep);
  }

  Creeps.Action.Init();
  Creeps.Roles.Init();

  if (spawn)
  {
    Creeps.Spawner.spawnAllCreeps(spawn);
  }

  var sortedCreeps = _.sortBy(_.filter(Game.creeps, (creepPri) => { return creepPri.memory.roleData.Priority > 0; }), (creepPri) => { return creepPri.memory.roleData.Priority; });

  for (var index in sortedCreeps)
  {
    var creep = sortedCreeps[index];
    try
    {
      Creeps.Ai.run(creep);
    }
    catch (ex: any)
    {
      console.error("ERRORED ON " + creep.name + "\n" + ex.stack);
      Game.notify("ERRORED ON " + creep.name + "\n" + ex.stack);
    }
  }

  for (var name in Memory.creeps)
  {
    if (!Game.creeps[name])
    {
      var creepMem = Memory.creeps[name];
      if (creepMem.roleData && creepMem.roleData.Role == "harvester")
      {
        if (creepMem.sourceData)
        {
          if (Memory.cachedRooms && Memory.cachedRooms[creepMem.sourceData.roomName] && Memory.cachedRooms[creepMem.sourceData.roomName].sourceData && Memory.cachedRooms[creepMem.sourceData.roomName].sourceData[creepMem.sourceData.Index])
          {
            Memory.cachedRooms[creepMem.sourceData.roomName].sourceData[creepMem.sourceData.Index].PositionData.OpenPositions++;
          }
        }
      }

      delete Memory.creeps[name];
      console.log("Clearing old Creep Memory");
    }
  }

  if (Game.cpu.bucket > 7500)
  {
    Game.cpu.generatePixel();
  }
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps)
  {
    if (!(name in Game.creeps))
    {
      delete Memory.creeps[name];
    }
  }
});
