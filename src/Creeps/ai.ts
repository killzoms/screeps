function processActions(creep: Creep)
{
    var highPriActions = _.sortBy(_.filter(Game.actions, (action) => { return action.Priority > 0 }), (action) => { return -action.Priority })
    var breaking = false;

    for (var i in highPriActions)
    {
        var action = highPriActions[i];

        if (breaking && action.ShouldBreak)
        {
            continue;
        }

        if (action.ShouldRun(creep))
        {
            action.Run(creep);
            if (action.ShouldBreak)
            {
                var breaking = true;
            }
        }
    }
}

export class ai
{
    public static run(creep: Creep)
    {
        if (!creep.memory.disable)
        {
            processActions(creep);
        }
    }
}
