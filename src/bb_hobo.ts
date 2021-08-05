import { useFamiliar, setProperty, getProperty, abort, visitUrl, print, equip, combatRateModifier, myHp, restoreHp, myName, myMp, eat, retrieveItem, myAdventures, setAutoAttack, cliExecute, runChoice, myMaxhp, userConfirm, availableAmount, closetAmount, putCloset, equippedItem, itemAmount, haveEffect, useSkill } from 'kolmafia';

import { ensureEffect, shrug, adventureHere, getPropertyInt, getPropertyIntInit, incrementProperty, setPropertyInt, setChoice, sausageFightGuaranteed, lastAdventureText, ensurePotionEffect } from './lib';

import { $familiar, $location, $item, $slot, $effect, Macro, $items, get, adventureMacro, $skill, set } from 'libram';

const MACRO_KILL = Macro.skill($skill`saucegeyser`).repeat();

const TRASH_PROP = '_BobSanders.TrashCount';

type scoboParts = {
    boots: number;
    eyes: number;
    guts: number;
    skulls: number;
    crotches: number;
    skins: number;
}

export function getRichardCounts(): scoboParts {
    const richard = visitUrl('clan_hobopolis.php?place=3&action=talkrichard&whichtalk=3');
    //TODO: account for commas in the number
    const bootsMatch = richard.match('Richard has <b>(\\d+)</b> pairs? of charred hobo');
    const boots = (bootsMatch !== null) ? parseInt(bootsMatch[1]) : 0;
    const eyesMatch = richard.match('Richard has <b>(\\d+)</b> pairs? of frozen hobo');
    const eyes = (eyesMatch !== null) ? parseInt(eyesMatch[1]) : 0;
    const gutsMatch = richard.match('Richard has <b>(\\d+)</b> piles? of stinking hobo');
    const guts = (gutsMatch !== null) ? parseInt(gutsMatch[1]) : 0;
    const skullsMatch = richard.match('Richard has <b>(\\d+)</b> creepy hobo skull');
    const skulls = (skullsMatch !== null) ? parseInt(skullsMatch[1]) : 0;
    const crotchesMatch = richard.match('Richard has <b>(\\d+)</b> hobo crotch');
    const crotches = (crotchesMatch !== null) ? parseInt(crotchesMatch[1]) : 0;
    const skinsMatch = richard.match('Richard has <b>(\\d+)</b> hobo skin');
    const skins = (skinsMatch !== null) ? parseInt(skinsMatch[1]) : 0;

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
    };
}

function fightSausageIfGuaranteed() {
    if (sausageFightGuaranteed()) {
        print('Fighting a Kramco in the Noob Cave');
        const currentOffhand = equippedItem($slot`off-hand`);
        equip($item`Kramco Sausage-o-Matic™`);
        adventureMacro($location`Noob Cave`, Macro.skill($skill`saucegeyser`));

        //Equip whatever we had here
        equip(currentOffhand);
    }
}

const getSneakyForHobos = (sewers = false, bb = false): void => {
    useFamiliar($familiar`Shorter-Order Cook`);
    equip($slot`familiar`, $item`blue plate`);
    equip($item`Xiblaxian stealth cowl`);
    equip($item`chalk chlamys`);
    equip($slot`shirt`, $item`camouflage T-shirt`);
    sewers ? equip($item`gatorskin umbrella`) : equip($item`rusted-out shootin' iron`);
    sewers ? equip($item`hobo code binder`) : equip($item`familiar scrapbook`);
    bb ? equip($item`Jeans of Loathing`) : equip($item`Xiblaxian stealth trouser`);
    equip($slot`acc1`, $item`lucky gold ring`);
    equip($slot`acc2`, $item`mafia thumb ring`);
    equip($slot`acc3`, $item`Mr. Cheeng's spectacles`);

    ensureEffect($effect`Smooth Movements`);
    ensureEffect($effect`The Sonata of Sneakiness`);
    shrug($effect`Carlweather's Cantata of Confrontation`);

    if (getPropertyInt('_feelLonelyUsed') < 3) {
        ensureEffect($effect`Feeling Lonely`);
    }
    if (getPropertyInt('_powerfulGloveBatteryPowerUsed') <= 90) {
        ensureEffect($effect`Invisible Avatar`);
    }

    const desiredNonCombat = bb ? -26 : -27;
    if (combatRateModifier() > desiredNonCombat) {
        abort('Not sneaky enough.');
    }
};

export function getConfrontationalForHobos() {
    useFamiliar($familiar`Jumpsuited Hound Dog`);
    equip($item`fiberglass fedora`);
    equip($item`Misty Cloak`);
    equip($slot`shirt`, $item`"Remember the Trees" Shirt`);
    equip($slot`off-hand`, $item`none`);
    equip($item`Staff of Simmering Hatred`);
    equip($item`Spelunker's khakis`);
    equip($slot`acc1`, $item`lucky gold ring`);
    equip($slot`acc2`, $item`mafia thumb ring`);
    equip($slot`acc3`, $item`Mr. Cheeng's spectacles`);

    ensureEffect($effect`Musk of Moose`);
    ensureEffect($effect`Carlweather's Cantata of Confrontation`);
    shrug($effect`The Sonata of Sneakiness`);

    if (combatRateModifier() < 25)
        abort('Not confrontational enough.');
}

export function getHoboCountsRe(regex: RegExp): number {
    const logs = visitUrl('clan_raidlogs.php').replace(/a tirevalanch/gm, '1 tirevalanch');//TODO: maybe look for "(x turn"
    let match;
    let total = 0;

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

    const raidLogs = visitUrl('clan_raidlogs.php').split('<br>');

    raidLogs.forEach(function(raidLog: string) {
        const grateCheck = raidLog.match(/(grate.*\()(\d*).*/)
        if (grateCheck) {
            grateCount += parseInt(grateCheck[2]);
            return;
        }

        const valveCheck = raidLog.match(/(level.*\()(\d*).*/);
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
    let checkGravesAndValues = true;

    while (!throughSewers()) {
        if (checkGravesAndValues) {
            const sewerStatus = calculateGratesAndValues();

            if (sewerStatus.grates < 20) {
                set("choiceAdventure198", 3);
            } else {
                set("choiceAdventure198", 1);
            }

            if (sewerStatus.valves < 20) {
                set("choiceAdventure197", 3);
            } else {
                set("choiceAdventure197", 1);
            }

            checkGravesAndValues = sewerStatus.grates < 20 && sewerStatus.valves < 20;
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
            .trySkill($skill`Shattering Punch`)
            .trySkill($skill`Feel Hatred`)
            .trySkill($skill`Snokebomb`)
            .trySkill($skill`Use the force`)
            .trySkill($skill`Chest X-Ray`)
            .trySkill($skill`Reflex Hammer`)
            .item([$item`tattered scrap of paper`, $item`tattered scrap of paper`]).repeat()
        );
    }

    const sewerStatus = calculateGratesAndValues();
    print('Valves: ' + sewerStatus.valves + ' Grates: ' + sewerStatus.grates, 'green');
    print('Through the sewers.', 'green');
}

function sideZoneLoop(location: Location, sneaky: boolean, macro: Macro, callback: Function) {
    let shouldBreak = false;
    sneaky ? getSneakyForHobos(false, location === $location`Burnbarrel Blvd.`) : getConfrontationalForHobos();

    while (!shouldBreak && myAdventures() !== 0) {
        if (myMp() < 100)
            eat($item`magical sausage`);
        if (myHp() < myMaxhp())
            restoreHp(myMaxhp());

        fightSausageIfGuaranteed();

        adventureMacro(location, macro);

        if (haveEffect($effect`Beaten Up`)) {
            abort('Got beaten up. Something is wrong.');
        }

        // closet all hobo nickels so LGR doesn't grab them
        putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);

        shouldBreak = callback();
    }

    if (myAdventures() === 0) {
        print('No more adventures', 'red');
    }
}

const MAX_DIVERTS = 21;
function runEE(totalIcicles = 50) {
    print(`Running EE going for ${totalIcicles} before yodel`);
    setProperty('choiceAdventure273', '1'); // The Frigid Air; Pry open the freezer
    setProperty('choiceAdventure217', '1'); // There Goes Fritz!; Yodel a little
    setProperty('choiceAdventure292', '2'); // Cold Comfort; I’ll have the salad. I mean, I’ll leave.
    setProperty('choiceAdventure202', '2'); // Frosty; Skip adventure

    // TODO: update icicles and diverts each loop
    let icicles = getHoboCountsRe(/water pipes \((\d+) turns?\)/gm);
    let diverts = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);
    const bigYodelDone = getHoboCountsRe(new RegExp('\>' + myName() + ' \(\#\d*\) yodeled like crazy \\((\\d+) turns?\\)', 'gm')) > 0;

    if (bigYodelDone) {
        print("Big yodel already done in EE. Looking elsewhere.", "blue");
        return;
    }

    // do diverts first unless they are already done
    if (diverts < MAX_DIVERTS)
        setProperty('choiceAdventure215', '2'); // Piping Cold; Divert
    else
        setProperty('choiceAdventure215', '3'); // Piping Cold; Go all CLUE on the third Pipe

    if (icicles > totalIcicles) {
        print("Desired icicle account achieved. Looking for big yodel.", "blue");
        setProperty('choiceAdventure217', '3'); // There Goes Fritz!; Yodel your heart out
    }

    print(`Current status - diverts: ${diverts} icicles: ${icicles} targeted icicles: ${totalIcicles}`);
    print("Starting EE", "blue");

    sideZoneLoop($location`Exposure Esplanade`, true, MACRO_KILL, function() {
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

    print("Done in EE", "blue");
}

function runTheHeap(playingWithOthers = true) {
    setProperty('choiceAdventure214', '1'); // You vs. The Volcano; Kick stuff
    setProperty('choiceAdventure295', '1'); // Juicy!; Buy
    setProperty('choiceAdventure203', '2'); // Deep Enough to Dive; Skip

    if (getPropertyIntInit(TRASH_PROP, 0) >= 5) {
        setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
    } else {
        setProperty('choiceAdventure216', '2'); // The Compostal Service; Begone'
    }

    if (playingWithOthers)
        setProperty('choiceAdventure218', '0'); // I Refuse; abort
    else
        setProperty('choiceAdventure218', '1'); // I Refuse; Explore the junkpile

    print("Starting Heap", "green");

    sideZoneLoop($location`The Heap`, true, MACRO_KILL, function() {
        if (getProperty('lastEncounter').includes('You vs. The Volcano')) {
            incrementProperty(TRASH_PROP);//TODO: replace with myName()
            if (getPropertyInt(TRASH_PROP) >= 5) {
                setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
            }
        }
        if (getPropertyInt(TRASH_PROP) >= 5 && getProperty('lastEncounter').includes('The Compostal Service')) {
            setProperty('choiceAdventure216', '2'); // The Compostal Service; Begone'
            setPropertyInt(TRASH_PROP, 0);
        }

        if (getProperty('lastEncounter').includes('Deep Enough to Dive')) {
            print("Oscus is up.", "green");
        }

        return getProperty('lastEncounter').includes('Deep Enough to Dive');
    });

    print("Done in Heap", "green");
}

function runAHBG(danceCount = 0) {
    setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
    setProperty('choiceAdventure220', '2'); // Returning to the Tomb; Disturb not ye these bones
    setProperty('choiceAdventure293', '2'); // Flowers for You; Flee this creepy scene
    setProperty('choiceAdventure221', '1'); // A Chiller Night (1); Study the hobos' dance moves
    setProperty('choiceAdventure222', '1'); // A Chiller Night (2); Dance with them
    setProperty('choiceAdventure204', '2'); // Skip adventure when Zombo is up

    if (danceCount >= 5) {
        setProperty('choiceAdventure208', '1'); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
    }

    getSneakyForHobos();
    retrieveItem(500, $item`New Age healing crystal`);
    sideZoneLoop($location`The Ancient Hobo Burial Ground`, true, Macro.item([$item`New Age healing crystal`, $item`New Age hurting crystal`]), function() {
        let done = false;
        if (getProperty('lastEncounter').includes('A Chiller Night')) {
            danceCount++;
            if (danceCount >= 5) {
                setProperty('choiceAdventure208', '1'); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
            }
        }
        if (danceCount >= 5 && getProperty('lastEncounter').includes('Ah, So That\'s Where They\'ve All Gone')) {
            setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
            danceCount = 0;
        }
        if (getProperty('lastEncounter').includes('Welcome To You!')) {
            print('Zombo is up', 'blue');
            done = true;
        }
        print('Dance count: ' + danceCount, 'blue');
        return done;
    });
    print('Done in AHBG', 'blue');
}

function runPLD(minFlimflams = 10) {
    const diverts = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);
    if (diverts < 21) {
        if (!userConfirm('Do AHBG before 21 water diverts?', 10000, false)) return;
    }

    let img = /purplelightdistrict(\d+).gif/.exec(visitUrl("clan_hobopolis.php?place=8"));
    let flimflams = getHoboCountsRe(/flimflammed some hobos \((\d+) turns?\)/gm);

    if ((diverts + flimflams) >= 21) {
        print('Starting barfights.', 'purple');
        setProperty('choiceAdventure223', '1'); // Getting Clubbed; Try to get inside
    }
    else {
        print('Flimflamming the crowd.', 'purple');
        setProperty('choiceAdventure223', '3'); // Getting Clubbed; Try to flimflam the crowd
    }

    setProperty('choiceAdventure224', '2'); // Exclusive!; Pick several fights
    setProperty('choiceAdventure294', '1'); // Maybe It's a Sexy Snake! Take a Chance?

    retrieveItem(5, $item`hobo nickel`);

    sideZoneLoop($location`The Purple Light District`, false, Macro.abort(), () => {
        const lastEncounter = get('lastEncounter');
        if (lastEncounter.includes('Getting Clubbed') || lastEncounter.includes('Exclusive!')) {
            img = /purplelightdistrict(\d+).gif/.exec(visitUrl("clan_hobopolis.php?place=8"));

            if (get('choiceAdventure223') === 3) { // Flimflamming the crowd
                flimflams++;

                if (flimflams >= minFlimflams) {
                    print('Switching to barfights.', 'purple');
                    set('choiceAdventure223', 1); // Getting Clubbed; Try to get inside
                }
            }

            else if (get('choiceAdventure223') === 1 &&
                flimflams < minFlimflams &&
                img != null && parseInt(img[1]) >= 9) {

                print('Switching to get flimflams.', 'purple');
                set('choiceAdventure223', 3); // Getting Clubbed; Try to flimflam the crowd
            }
        }

        // always be ready for the lewd playing card
        retrieveItem(5, $item`hobo nickel`);
    });

    print(`Done in PLD. At ${getHoboCountsRe(/flimflammed some hobos \((\d+) turns?\)/gm)} flimflams.`, 'purple');
}

function lastAdventureWasSuccessfulCombat(): boolean {
    return lastAdventureText().includes(myName() + ' wins the fight!')
}

function tiresToKills(tires: number): number {
    if (tires === -1) tires = 35;
    return (tires ^ 2 * 0.1) + (0.7 * tires);
}

function runBB(tiresAlreadyStacked = 0, stack1 = -1, stack2 = -1) {
    print(`Running BB with ${tiresAlreadyStacked} on the stack, ${stack1} in stack 1 and ${stack2} in stack 2`);
    //TODO: store counts in new property or whatever storage mafia uses.
    //TODO: Real calculation for the last stack.
    setProperty('choiceAdventure206', '2'); // Getting Tired; Toss the tire on the fire gently
    setProperty('choiceAdventure207', '2'); // Hot Dog! I Mean... Door!; Leave the door be
    setProperty('choiceAdventure213', '2'); // Piping Hot; Leave the valve alone
    setProperty('choiceAdventure291', '2'); // A Tight Squeeze; No, thanks

    let kills = getHoboCountsRe(/defeated\s+Hot\s+hobo\s+x\s+(\d+)/gm);
    let tireCount = tiresAlreadyStacked > 0 ? tiresAlreadyStacked : getHoboCountsRe(/on the fire \((\d+) turns?\)/gm) % 34;//Assume we follow 34 tires.  May need to adjust
    let tirevalanches = getHoboCountsRe(/started ((\d+)) tirevalanch/gm);
    interface something {
        [key: number]: number
    }
    const stackKills: something = { 1: 0, 2: 0 };
    let tiresToThrow = 34;

    //TODO: handle if we specified stack sizes but haven't thrown violent?
    if (tirevalanches >= 1) {
        stackKills[1] = tiresToKills(stack1);
    }
    if (tirevalanches > 1) { // if we have more than 2, you're on your own?
        stackKills[2] = tiresToKills(stack2);
    }
    print('tirevalanches: ' + tirevalanches, 'red');
    print(`Stack1Kills: ${stackKills[1]} Stack2Kills: ${stackKills[2]}`, 'red');

    if (tiresAlreadyStacked >= tiresToThrow) {
        setProperty('choiceAdventure206', '1'); // Getting Tired; Toss the tire on the fire violently
    }

    const ensureHotRes = () => {
        ensurePotionEffect($effect`Oiled-Up`, $item`pec oil`);
        ensurePotionEffect($effect`Spiro Gyro`, $item`programmable turtle`);
        ensurePotionEffect($effect`Ancient Protected`, $item`Ancient Protector soda`);
        ensurePotionEffect($effect`Frost Tea`, $item`cuppa Frost tea`);
    };

    ensureHotRes();

    sideZoneLoop($location`Burnbarrel Blvd.`, true, MACRO_KILL, function() {
        const lastEncounter = getProperty('lastEncounter');
        if (lastEncounter.includes('Getting Tired')) {
            if (getPropertyInt('choiceAdventure206') === 1) {
                tirevalanches++;
                stackKills[tirevalanches] = tiresToKills(tireCount + 1);
                print(`Stack1Kills: ${stackKills[1]} Stack2Kills: ${stackKills[2]}`, 'red');
                setProperty('choiceAdventure206', '2'); // Getting Tired; Toss the tire on the fire gently
                tireCount = 0;
            } else {
                tireCount++;
                print(`Tires on the stack: ` + tireCount, 'red');
                if (tireCount >= tiresToThrow) {
                    print(`Going to throw violently.`, 'red');
                    setProperty('choiceAdventure206', '1'); // Getting Tired; Toss the tire on the fire violently
                }
            }
        }

        if (stackKills[2] > 0) {
            print(`Stack1Kills: ${stackKills[1]} Stack2Kills: ${stackKills[2]}`, 'red');
            const hobosLeft = 500 - (stackKills[2] + stackKills[1] + kills);
            let tiresNeeded = 0;
            print('Hobos left: ' + hobosLeft + ' tiresNeeded: ' + tiresNeeded);
            while ((hobosLeft + tiresToKills(tiresNeeded)) < 500) {
                tiresNeeded++;
            }
            print(`Kills: ${kills} Updated tires needed to finish: ${tiresNeeded}`, 'red');
            tiresToThrow = tiresNeeded;
        }

        if (lastAdventureWasSuccessfulCombat()) {
            kills++;
        }

        if (lastEncounter.includes('Home, Home in the Range')) {
            print('Ol\' Scratch is up.');
            return true;
        }

        ensureHotRes();
        return false;
    });

    print(`Done in BB. Tires on the stack: ${tireCount}`, 'red');
}

export function main(input: string): void {
    setAutoAttack(0);
    cliExecute('mood hobo');
    cliExecute('ccs hobo');
    cliExecute('boombox food');
    cliExecute('mcd 0');
    useSkill($skill`Spirit of Nothing`); // Don't be an idiot

    const actions = input.split(' ');

    switch (actions[0]) {
        case 'sewer':
            set(TRASH_PROP, 0);
            runSewer();
            break;
        case 'ee':
            runEE(parseInt(actions[1]));
            break;
        case 'heap':
            runTheHeap();
            break;
        case 'ahbg':
            runAHBG(actions[1] ? parseInt(actions[1]) : 0);
            break;
        case 'pld':
            runPLD();
            break;
        case 'bb':
            const numTires = actions[1] ? parseInt(actions[1]) : 0;
            const stack1Count = actions[2] ? parseInt(actions[2]) : -1;
            const stack2Count = actions[3] ? parseInt(actions[3]) : -1;
            runBB(numTires, stack1Count, stack2Count);
            break;
        default:
            abort('no option passed');
    }
}
