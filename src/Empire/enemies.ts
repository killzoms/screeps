/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('empire.enemies');
 * mod.thing == 'a thing'; // true
 */
function findEnemies()
{
    var foundEnemies: Map<string, Creep[]> = new Map();

    for (var i in Game.rooms)
    {
        var fEnemies = Game.rooms[i].find(FIND_HOSTILE_CREEPS);
        var roomEnemies: Creep[] = [];
        for (var j in fEnemies)
        {
            roomEnemies.push(fEnemies[j]);
        }
        foundEnemies.set(i, roomEnemies);
    }

    return foundEnemies;
}

export class EnemyController
{
    public static getEnemies()
    {
        var foundEnemies = [];
        var fEnemies = findEnemies();

        for (var i in fEnemies)
        {
            var roomEnemies = fEnemies.get(i);
            if (roomEnemies != undefined)
            {
                for (var j = 0; j < roomEnemies.length; j++)
                {
                    foundEnemies.push(roomEnemies[j]);
                }
            }
        }

        return foundEnemies;
    }
};
