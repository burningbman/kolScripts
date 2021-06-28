import { useFamiliar, setProperty, getProperty, abort, visitUrl, print, equip, combatRateModifier, myHp, restoreHp, myName, myMp, eat, retrieveItem, myAdventures, setAutoAttack, cliExecute, runChoice, myMaxhp } from 'kolmafia';

import { ensureEffect, shrug, adventureHere, getPropertyInt, getPropertyIntInit, incrementProperty, setPropertyInt, setChoice } from './lib';

import { $familiar, $location, $item, $slot, $effect, Macro, $items, get, adventureMacro, $skill, set } from 'libram';

/** Combat Scripts */

const MACRO_STEAL_THEN_ATTACK = new Macro()
    .step('pickpocket')
    .skill($skill`curse of weaksauce`)
    .skill($skill`sing along`)
    .attack()
    .repeat();

/* End Combat Scripts */

type scoboParts = {
    boots: number;
    eyes: number;
    guts: number;
    skulls: number;
    crotches: number;
    skins: number;
}

export function getRichardCounts(): scoboParts {
    let richard = visitUrl("clan_hobopolis.php?place=3&action=talkrichard&whichtalk=3");
    //TODO: account for commas in the number
    let bootsMatch = richard.match("Richard has <b>(\\d+)</b> pairs? of charred hobo");
    let boots = (bootsMatch !== null) ? parseInt(bootsMatch[1]) : 0;
    let eyesMatch = richard.match("Richard has <b>(\\d+)</b> pairs? of frozen hobo");
    let eyes = (eyesMatch !== null) ? parseInt(eyesMatch[1]) : 0;
    let gutsMatch = richard.match("Richard has <b>(\\d+)</b> piles? of stinking hobo");
    let guts = (gutsMatch !== null) ? parseInt(gutsMatch[1]) : 0;
    let skullsMatch = richard.match("Richard has <b>(\\d+)</b> creepy hobo skull");
    let skulls = (skullsMatch !== null) ? parseInt(skullsMatch[1]) : 0;
    let crotchesMatch = richard.match("Richard has <b>(\\d+)</b> hobo crotch");
    let crotches = (crotchesMatch !== null) ? parseInt(crotchesMatch[1]) : 0;
    let skinsMatch = richard.match("Richard has <b>(\\d+)</b> hobo skin");
    let skins = (skinsMatch !== null) ? parseInt(skinsMatch[1]) : 0;

    print('Boots ' + boots, 'red');
    print('Eyes ' + eyes, 'blue');
    print('Guts ' + guts, 'green');
    print('Skulls ' + skulls, 'gray');
    print('Crotches ' + crotches, 'purple');
    print('Skins ' + skins);

    return {
        boots: boots,
        eyes: eyes,
        guts: guts,
        skulls: skulls,
        crotches: crotches,
        skins: skins
    }
}

export function getSneakyForHobos(sewers = false) {
    useFamiliar($familiar`Shorter-Order Cook`);
    equip($item`Xiblaxian stealth cowl`);
    equip($item`chalk chlamys`);
    equip($slot`shirt`, $item`camouflage T-shirt`);
    sewers ? equip($item`gatorskin umbrella`) : equip($item`rusted-out shootin' iron`);
    sewers ? equip($item`hobo code binder`) : equip($item`Cold Stone of Hatred`);
    equip($item`Xiblaxian stealth trouser`);
    equip($slot`acc1`, $item`lucky gold ring`);
    equip($slot`acc2`, $item`mafia thumb ring`);
    equip($slot`acc3`, $item`Mr. Cheeng's spectacles`);

    ensureEffect($effect`Smooth Movements`);
    ensureEffect($effect`The Sonata of Sneakiness`);
    shrug($effect`Carlweather's Cantata of Confrontation`);

    if (getPropertyInt('_feelLonelyUsed') < 3) {
        ensureEffect($effect`Feeling Lonely`);
    }
    if (getPropertyInt('_powerfulGloveBatteryPowerUsed') < 100) {
        ensureEffect($effect`Invisible Avatar`);
    }

    if (combatRateModifier() > -27) {
        abort('Not sneaky enough.');
    }
}

export function getConfrontationalForHobos() {
    useFamiliar($familiar`Jumpsuited Hound Dog`);
    equip($item`fiberglass fedora`);
    equip($item`Misty Cloak`);
    equip($slot`shirt`, $item`"Remember the Trees" Shirt`);
    equip($slot`off-hand`, $item`none`);
    equip($item`giant turkey leg`);
    equip($item`Spelunker's khakis`);
    equip($slot`acc1`, $item`lucky gold ring`);
    equip($slot`acc2`, $item`mafia thumb ring`);
    equip($slot`acc3`, $item`Mr. Cheeng's spectacles`);

    ensureEffect($effect`Musk of Moose`);
    ensureEffect($effect`Carlweather's Cantata of Confrontation`);
    shrug($effect`The Sonata of Sneakiness`);

    if (combatRateModifier() < 26)
        abort('Not confrontational enough.');
}

export function getHoboCountsRe(regex: RegExp): number {
    const logs = visitUrl('clan_raidlogs.php').replace(/a tirevalanch/gm, '1 tirevalanch');//TODO: maybe look for "(x turn"
    let match;
    let total: number = 0;

    if (regex != null)
        while ((match = regex.exec(logs)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (match.index === regex.lastIndex)
                regex.lastIndex++;
            total += parseInt(match[1]);
        }

    return total;
}

function calculateGratesAndValues(): { grates: number, valves: number } {
    let grateCount = 0;
    let valveCount = 0;

    let raidLogs = visitUrl('clan_raidlogs.php').split('<br>');

    raidLogs.forEach(function(raidLog: string) {
        let grateCheck = raidLog.match(/(grate.*\()(\d*).*/)
        if (grateCheck) {
            grateCount += parseInt(grateCheck[2]);
            return;
        }

        let valveCheck = raidLog.match(/(level.*\()(\d*).*/);
        if (valveCheck) {
            valveCount += parseInt(valveCheck[2]);
        }
    });

    return {
        grates: grateCount,
        valves: valveCount
    }
}

function throughSewers() {
    return visitUrl('clan_hobopolis.php').includes('clan_hobopolis.php?place=2');
}

export function getSewerItems() {
    return (
        !$items`unfortunate dumplings, sewer wad, bottle of ooze-o, gatorskin umbrella`.some(i => !retrieveItem(1, i)) &&
        retrieveItem(3, $item`oil of oiliness`)
    );
}

function runSewer() {
    print('Starting sewers.', 'blue');

    while (!throughSewers()) {
        let sewerStatus = calculateGratesAndValues();

        if (sewerStatus.grates < 20) {
            set("choiceAdventure198", 3);
        } else {
            set("choiceAdventure198", 3);
        }

        if (sewerStatus.valves < 20) {
            set("choiceAdventure197", 3);
        } else {
            set("choiceAdventure197", 1);
        }

        if (!getSewerItems()) {
            throw 'Unable to get sewer items';
        }
        getSneakyForHobos(true);

        if (get('_feelHatredUsed') === 3 && get('_snokebombUsed') === 3) {
            if (get('_saberForceUses') < 5) {
                setChoice(1387, 3);
                equip($item`Fourth of May Cosplay Saber`);
            }
            else if (get('_chestXRayUsed') < 3 || get('_reflexHammerUsed') < 3) {
                equip($slot`acc3`, $item`Lil' Doctor™ bag`);
            } else {
                retrieveItem(10, $item`tattered scrap of paper`);
            }
        }

        adventureMacro($location`A Maze of Sewer Tunnels`, Macro.step('pickpocket')
            .externalIf(get('_feelHatredUsed') < 3, Macro.skill($skill`Feel Hatred`).abort())
            .externalIf(get('_snokebombUsed') < 3, Macro.skill($skill`Snokebomb`).abort())
            .externalIf(get('_saberForceUses') < 5, Macro.skill($skill`Use the force`).abort())
            .externalIf(get('_chestXRayUsed') < 3, Macro.skill($skill`Chest X-Ray`).abort())
            .externalIf(get('_reflexHammerUsed') < 3, Macro.skill($skill`Reflex Hammer`).abort())
            .item([$item`tattered scrap of paper`, $item`tattered scrap of paper`]).repeat()
        );
    }

    let sewerStatus = calculateGratesAndValues();
    print('Valves: ' + sewerStatus.valves + ' Grates: ' + sewerStatus.grates, 'green');
    print('Through the sewers.', 'green');
}

function sideZoneLoop(location: Location, sneaky: boolean, callback: Function) {
    let shouldBreak = false;

    while (!shouldBreak && myAdventures() !== 0) {
        if (myMp() < 100)
            eat($item`magical sausage`);
        sneaky ? getSneakyForHobos() : getConfrontationalForHobos()
        if (myHp() < myMaxhp() * 2 / 3)
            restoreHp(myMaxhp());

        adventureMacro(location, MACRO_STEAL_THEN_ATTACK);

        shouldBreak = callback();
    }

    if (myAdventures() === 0) {
        print('No more adventures', 'red');
    }
}

const MAX_DIVERTS = 21;
function runEE(totalIcicles = 50) {
    setProperty('choiceAdventure273', '1'); // The Frigid Air; Pry open the freezer
    setProperty('choiceAdventure217', '1'); // There Goes Fritz!; Yodel a little
    setProperty('choiceAdventure292', '2'); // Cold Comfort; I’ll have the salad. I mean, I’ll leave.
    setProperty('choiceAdventure202', '2'); // Frosty; Skip adventure

    // TODO: update icicles and diverts each loop
    let icicles = getHoboCountsRe(/water pipes \((\d+) turns?\)/gm);
    let diverts = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);
    let bigYodelDone = getHoboCountsRe(new RegExp('\>' + myName() + ' \(\#\d*\) yodeled like crazy \\((\\d+) turns?\\)', 'gm')) > 0;

    if (bigYodelDone) {
        print("Big yodel already done in EE. Looking elsewhere.", "blue");
        return;
    }

    // do diverts first unless they are already done
    if (diverts < MAX_DIVERTS)
        setProperty('choiceAdventure215', '2'); // Piping Cold; Divert
    else
        setProperty('choiceAdventure215', '3'); // Piping Cold; Go all CLUE on the third Pipe

    print("Starting EE", "blue");

    sideZoneLoop($location`Exposure Esplanade`, true, function() {
        let done = false;
        if (getProperty('lastEncounter').includes('Piping Cold')) {
            if (getPropertyInt('choiceAdventure215') === 3) { // Piping Cold; Go all CLUE on the third Pipe
                icicles++;
                if (icicles > totalIcicles) {
                    setProperty('choiceAdventure217', '3'); // There Goes Fritz!; Yodel your heart out
                }
            }

            if (getPropertyInt('choiceAdventure215') === 2) { // Piping Cold; Divert
                diverts++;
                if (diverts >= MAX_DIVERTS) {
                    setProperty('choiceAdventure215', '3'); // Piping Cold; Go all CLUE on the third Pipe
                }
            }

            print("Icicle count: " + icicles + ' Diverts: ' + diverts, 'blue');
        }

        if (getProperty('lastEncounter').includes('There Goes Fritz!') && getPropertyInt('choiceAdventure217') === 3) {
            print("Big yodel done.", "blue");
            done = true;
        }

        if (getProperty('lastEncounter').includes('Bumpity Bump Bump')) {
            print("Frosty is up.", "blue");
            done = true;
        }

        return done;
    });

    print("Done in EE", "red");
}

function runTheHeap(playingWithOthers = true) {
    setProperty('choiceAdventure214', '1'); // You vs. The Volcano; Kick stuff
    setProperty('choiceAdventure295', '1'); // Juicy!; Buy
    setProperty('choiceAdventure203', '2'); // Deep Enough to Dive; Skip

    if (getPropertyIntInit('_BobSanders.TrashCount', 5) >= 5) {
        setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
    } else {
        setProperty('choiceAdventure216', '2'); // The Compostal Service; Begone'
    }

    if (playingWithOthers)
        setProperty('choiceAdventure218', '0'); // I Refuse; abort
    else
        setProperty('choiceAdventure218', '1'); // I Refuse; Explore the junkpile

    print("Starting Heap", "blue");

    sideZoneLoop($location`The Heap`, true, function() {
        if (getProperty('lastEncounter').includes('You vs. The Volcano')) {
            incrementProperty('_BobSanders.TrashCount');//TODO: replace with myName()
            if (getPropertyInt('_BobSanders.TrashCount') >= 5) {
                setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
            }
        }
        if (getPropertyInt('_BobSanders.TrashCount') >= 5 && getProperty('lastEncounter').includes('The Compostal Service')) {
            setProperty('choiceAdventure216', '2'); // The Compostal Service; Begone'
            setPropertyInt('_BobSanders.TrashCount', 0);
        }

        if (getProperty('lastEncounter').includes('Deep Enough to Dive')) {
            print("Oscus is up.", "blue");
        }

        return getProperty('lastEncounter').includes('Deep Enough to Dive');
    });

    print("Done in Heap", "red");
}

function runAHBG() {
    setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
    setProperty('choiceAdventure220', '2'); // Returning to the Tomb; Disturb not ye these bones
    setProperty('choiceAdventure293', '2'); // Flowers for You; Flee this creepy scene
    setProperty('choiceAdventure221', '1'); // A Chiller Night (1); Study the hobos' dance moves
    setProperty('choiceAdventure222', '1'); // A Chiller Night (2); Dance with them
    setProperty('choiceAdventure204', '2'); // Skip adventure when Zombo is up

    getSneakyForHobos();
    let danceCount = 0;
    sideZoneLoop($location`The Ancient Hobo Burial Ground`, true, function() {
        let done = false;
        if (getProperty('lastEncounter').includes('A Chiller Night')) {
            danceCount++;
            if (danceCount >= 5) {
                setProperty('choiceAdventure208', '1'); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
            }
        }
        if (danceCount >= 5 && getProperty('lastEncounter').includes(`Ah, So That's Where They've All Gone`)) {
            setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
            danceCount = 0;
        }
        if (getProperty('lastEncounter').includes('Welcome To You!')) {
            print('Zombo is up', 'blue');
            done = true;
        }
        return done;
    });
    print('AHBG done', 'blue');
}

export function main(action = 'auto') {
    setAutoAttack(0);
    cliExecute("mood apathetic");
    cliExecute("ccs hobo");

    switch (action) {
        case 'auto':
            runSewer();

            // EE and The Heap can always be done
            runEE();
            runTheHeap();
            runAHBG();
            break;
        case 'sewer':
            runSewer();
            break;
        case 'ee':
            runEE();
            break;
        case 'heap':
            runTheHeap();
            break;
        case 'ahbg':
            runAHBG();
            break;
    }
}
