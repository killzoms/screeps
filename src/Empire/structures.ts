import { EnemyController } from "./enemies";


export class Structures
{
    static ProcessStructures()
    {
        for (var id in Game.structures)
        {
            var structure = Game.structures[id];

            var tower = structure as StructureTower;
            if (tower != undefined)
            {
                Structures.ProcessTower(tower);
            }
        }
    }

    static ProcessTower(tower: StructureTower)
    {
        var enemies = _.sortBy(EnemyController.getEnemies(), (creep) => { return tower.pos.getRangeTo(creep); });
        if (tower.isActive())
        {
            if (enemies.length > 0)
            {
                tower.attack(enemies[0]);
            }
        }
    }
}
