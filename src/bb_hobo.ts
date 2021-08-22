import { useFamiliar, setProperty, getProperty, abort, visitUrl, print, equip, combatRateModifier, myHp, restoreHp, myName, myMp, eat, retrieveItem, myAdventures, setAutoAttack, cliExecute, myMaxhp, userConfirm, putCloset, equippedItem, itemAmount, haveEffect, useSkill, adv1, takeCloset, outfit, maximize, myInebriety, inebrietyLimit, myFamiliar, availableAmount } from 'kolmafia';

import { ensureEffect, shrug, getPropertyInt, getPropertyIntInit, incrementProperty, setPropertyInt, setChoice, sausageFightGuaranteed, lastAdventureText, ensurePotionEffect, setClan, inSemirareWindow } from './lib';

import { $familiar, $location, $item, $slot, $effect, Macro, $items, get, $skill, set } from 'libram';

const MACRO_KILL = Macro.skill($skill`Saucegeyser`).repeat();
const SR_LOCATIONS = [$location`Burnbarrel Blvd.`, $location`Exposure Esplanade`, $location`The Ancient Hobo Burial Ground`, $location`The Purple Light District`];

const TRASH_PROP = '_BobSanders.TrashCount';
const DANCE_PROP = '_bb_hobo.DanceCount';

enum Part {
    boots = 1,
    eyes = 2,
    guts = 3,
    skulls = 4,
    crotches = 5,
    skins = 6,
    none = 7
}

const PART_ORDER = [Part.boots, Part.eyes, Part.guts, Part.skulls, Part.crotches, Part.skins];

const partToSkill = {
    [Part.boots]: $skill`Spirit of Cayenne`,
    [Part.eyes]: $skill`Spirit of Peppermint`,
    [Part.guts]: $skill`Spirit of Garlic`,
    [Part.skulls]: $skill`Spirit of Wormwood`,
    [Part.crotches]: $skill`Spirit of Bacon Grease`,
    [Part.skins]: $skill`Spirit of Nothing`,
    [Part.none]: $skill`Spirit of Nothing`
};

type scoboParts = {
    [Part.boots]: number;
    [Part.eyes]: number;
    [Part.guts]: number;
    [Part.skulls]: number;
    [Part.crotches]: number;
    [Part.skins]: number;
    [Part.none]: number
}

const setFamiliar = (): void => {
    if (myFamiliar() === $familiar`Stooper` && myInebriety() >= inebrietyLimit()) return;

    // set snapper to track hobos
    useFamiliar($familiar`Red-Nosed Snapper`);
    if (get('redSnapperPhylum') !== 'hobo') {
        visitUrl('familiar.php?action=guideme&pwd'); visitUrl('choice.php?pwd&whichchoice=1396&option=1&cat=hobo');
    }
};

const getRichardCounts = (): scoboParts => {
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

    return {
        [Part.boots]: boots,
        [Part.eyes]: eyes,
        [Part.guts]: guts,
        [Part.skulls]: skulls,
        [Part.crotches]: crotches,
        [Part.skins]: skins,
        [Part.none]: -1
    };
};

const upkeepHpAndMp = (): void => {
    if (myMp() < 100)
        eat($item`magical sausage`);
    if (myHp() < myMaxhp())
        restoreHp(myMaxhp());
};

function fightSausageIfGuaranteed(): void {
    if (sausageFightGuaranteed()) {
        print('Fighting a Kramco in the Noob Cave');
        const currentOffhand = equippedItem($slot`off-hand`);
        equip($item`Kramco Sausage-o-Matic™`);
        adv1($location`Noob Cave`, -1, '');

        //Equip whatever we had here
        equip(currentOffhand);
    }
}

const getSneakyForHobos = (sewers = false, useJeans = false): void => {
    equip($item`Xiblaxian stealth cowl`);
    equip($item`chalk chlamys`);
    equip($slot`shirt`, $item`camouflage T-shirt`);
    sewers ? equip($item`gatorskin umbrella`) : equip($item`rusted-out shootin' iron`);
    sewers ? equip($item`hobo code binder`) : equip($item`familiar scrapbook`);
    useJeans ? equip($item`Jeans of Loathing`) : equip($item`Xiblaxian stealth trousers`);
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

    const desiredNonCombat = useJeans || sewers ? -26 : -27;
    if (combatRateModifier() > desiredNonCombat) {
        abort('Not sneaky enough.');
    }
};

const getConfrontationalForHobos = () => {
    equip($item`fiberglass fedora`);
    equip($item`Misty Cloak`);
    equip($slot`shirt`, $item`"Remember the Trees" Shirt`);
    equip($slot`off-hand`, $item`none`);
    equip($item`Staff of Simmering Hatred`);
    equip($item`Spelunker's khakis`);
    equip($slot`acc1`, $item`lucky gold ring`);
    equip($slot`acc2`, $item`mafia thumb ring`);
    equip($slot`acc3`, $item`Mr. Cheeng's spectacles`);

    ensureEffect($effect`Musk of the Moose`);
    ensureEffect($effect`Carlweather's Cantata of Confrontation`);
    shrug($effect`The Sonata of Sneakiness`);

    if (combatRateModifier() < 25)
        abort('Not confrontational enough.');
};

const getHoboCountsRe = function(regex: RegExp): number {
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
};

function calculateGratesAndValues(): { grates: number, valves: number } {
    let grateCount = 0;
    let valveCount = 0;

    const raidLogs = visitUrl('clan_raidlogs.php').split('<br>');

    raidLogs.forEach(function(raidLog: string) {
        const grateCheck = raidLog.match(/(grate.*\()(\d*).*/);
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
    };
}

function throughSewers() {
    return visitUrl('clan_hobopolis.php').includes('clan_hobopolis.php?place=2');
}

const getSewerItems = () => {
    return (
        !$items`unfortunate dumplings, sewer wad, bottle of Ooze-O, gatorskin umbrella`.some(i => !retrieveItem(1, i)) &&
        retrieveItem(3, $item`oil of oiliness`)
    );
};

function runSewer() {
    print('Starting sewers.', 'green');
    let checkGravesAndValues = true;

    Macro.step('pickpocket')
        .trySkill($skill`Feel Hatred`)
        .trySkill($skill`Snokebomb`)
        .trySkill($skill`Reflex Hammer`)
        .trySkill($skill`Use the Force`)
        .trySkill($skill`Chest X-Ray`)
        .trySkill($skill`Shattering Punch`)
        .item([$item`green smoke bomb`, $item`green smoke bomb`]).setAutoAttack();

    while (!throughSewers()) {
        upkeepHpAndMp();
        getSneakyForHobos(true);
        fightSausageIfGuaranteed();

        if (!getSewerItems()) throw 'Unable to get sewer items';

        if (checkGravesAndValues) {
            const sewerStatus = calculateGratesAndValues();

            set('choiceAdventure198', sewerStatus.grates < 20 ? 3 : 1);
            set('choiceAdventure197', sewerStatus.valves < 20 ? 3 : 1);

            // stop checking grates and valves count each loop once we have 20 of each
            checkGravesAndValues = sewerStatus.grates < 20 && sewerStatus.valves < 20;
        }

        // setup equipment for banishes and free kills
        if (get('_feelHatredUsed') === 3 && get('_snokebombUsed') === 3) {
            if (get('_reflexHammerUsed') < 3) equip($slot`acc3`, $item`Lil' Doctor™ bag`);
            else if (get('_saberForceUses') < 5) equip($item`Fourth of May Cosplay Saber`);
            else if (get('_chestXRayUsed') < 3) equip($slot`acc3`, $item`Lil' Doctor™ bag`); else retrieveItem(4, $item`green smoke bomb`);
        }

        adv1($location`A Maze of Sewer Tunnels`, -1, '');
    }

    const sewerStatus = calculateGratesAndValues();
    print('Valves: ' + sewerStatus.valves + ' Grates: ' + sewerStatus.grates, 'green');
    print('Through the sewers.', 'green');
}

const handleNickels = (location: Location) => {
    // closet nickels if not in SR window or not in good SR drop location
    if (!inSemirareWindow() || !SR_LOCATIONS.includes(location))
        putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
    else if (availableAmount($item`hobo nickel`) < 5)
        takeCloset(5 - availableAmount($item`hobo nickel`), $item`hobo nickel`);
};

function sideZoneLoop(location: Location, sneaky: boolean, macro: Macro, callback: () => boolean) {
    let shouldBreak = false;
    const upkeepCombat = () => {
        if (location !== $location`Hobopolis Town Square`) {
            const useJeans = [$location`Burnbarrel Blvd.`, $location`Exposure Esplanade`].includes(location);
            sneaky ? getSneakyForHobos(false, useJeans) : getConfrontationalForHobos();
        }
    };

    macro.setAutoAttack();
    handleNickels(location);

    while (!shouldBreak && myAdventures() !== 0) {
        upkeepCombat();
        upkeepHpAndMp();

        fightSausageIfGuaranteed();

        adv1(location, -1, '');

        // handle nickels before callback so TS can uncloset 20 nickels if needed
        handleNickels(location);
        shouldBreak = callback();
    }
}

const MAX_DIVERTS = 21;
function runEE(totalIcicles = 50) {
    print('Starting EE', 'blue');
    print(`Running EE going for ${totalIcicles} before yodel`, 'blue');
    set('choiceAdventure273', 1); // The Frigid Air; Pry open the freezer
    set('choiceAdventure217', 1); // There Goes Fritz!; Yodel a little
    set('choiceAdventure292', 2); // Cold Comfort; I’ll have the salad. I mean, I’ll leave.
    set('choiceAdventure202', 2); // Frosty; Skip adventure

    const bigYodelDone = getHoboCountsRe(new RegExp('>' + myName() + ' (#d*) yodeled like crazy \\((\\d+) turns?\\)', 'gm')) > 0;
    if (bigYodelDone) { print('Big yodel already done in EE.', 'blue'); return; }

    // TODO: update icicles and diverts each loop
    let icicles = getHoboCountsRe(/water pipes \((\d+) turns?\)/gm);
    let diverts = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);

    // Divert if still need any; otherwise make icicles
    set('choiceAdventure215', diverts < MAX_DIVERTS ? 2 : 3);

    if (icicles >= totalIcicles) {
        print('Desired icicle account achieved. Looking for big yodel.', 'blue');
        set('choiceAdventure217', 3); // There Goes Fritz!; Yodel your heart out
    }

    print(`Status - Diverts: ${diverts} Icicles: ${icicles}/${totalIcicles}`, 'blue');

    sideZoneLoop($location`Exposure Esplanade`, true, MACRO_KILL, function() {
        let done = false;
        if (get('lastEncounter').includes('Piping Cold')) {
            if (get('choiceAdventure215') === 3) { // making icicles
                icicles++;
                if (icicles >= totalIcicles) {
                    set('choiceAdventure217', 3); // big yodel
                }
            }
            else if (get('choiceAdventure215') === 2) { // diverting
                diverts++;
                if (diverts >= MAX_DIVERTS) {
                    set('choiceAdventure215', 3); // make icicles
                }
            }

            print('Icicle count: ' + icicles + ' Diverts: ' + diverts, 'blue');
        }

        if (get('lastEncounter').includes('There Goes Fritz!') &&
            get('choiceAdventure217') === 3) {
            print('Big yodel done.', 'blue');
            done = true;
        }

        if (get('lastEncounter').includes('Bumpity Bump Bump')) {
            print('Frosty is up.', 'blue');
            done = true;
        }

        return done;
    });
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

    print('Starting Heap', 'green');

    sideZoneLoop($location`The Heap`, true, MACRO_KILL, function() {
        const atOscus = getProperty('lastEncounter').includes('Deep Enough to Dive');
        if (getProperty('lastEncounter').includes('You vs. The Volcano')) {
            incrementProperty(TRASH_PROP);//TODO: replace with myName()
            if (getPropertyInt(TRASH_PROP) >= 5) {
                setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
            }
        }
        else if (getPropertyInt(TRASH_PROP) >= 5 && getProperty('lastEncounter').includes('The Compostal Service')) {
            setProperty('choiceAdventure216', '2'); // The Compostal Service; Begone'
            setPropertyInt(TRASH_PROP, 0);
        }

        else if (atOscus) {
            print('Oscus is up.', 'green');
        }

        return atOscus;
    });

    print('Done in Heap', 'green');
}

function runAHBG(danceCount = 0) {
    setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
    setProperty('choiceAdventure220', '2'); // Returning to the Tomb; Disturb not ye these bones
    setProperty('choiceAdventure293', '2'); // Flowers for You; Flee this creepy scene
    setProperty('choiceAdventure221', '1'); // A Chiller Night (1); Study the hobos' dance moves
    setProperty('choiceAdventure222', '1'); // A Chiller Night (2); Dance with them
    setProperty('choiceAdventure204', '2'); // Skip adventure when Zombo is up

    // if danceCount not passed, check the property
    if (danceCount === 0) {
        danceCount = get(DANCE_PROP, 0);
    }

    if (danceCount >= 5) {
        setProperty('choiceAdventure208', '1'); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
    }

    retrieveItem(500, $item`New Age healing crystal`);
    sideZoneLoop($location`The Ancient Hobo Burial Ground`, true, Macro.item([$item`New Age healing crystal`, $item`New Age hurting crystal`]).repeat(), function() {
        let done = false;
        const lastEncounter = getProperty('lastEncounter');
        if (lastEncounter.includes('A Chiller Night')) {
            danceCount++;
            if (danceCount >= 5) {
                setProperty('choiceAdventure208', '1'); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
            }
        }
        else if (danceCount >= 5 && lastEncounter.includes('Ah, So That\'s Where They\'ve All Gone')) {
            setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
            danceCount = 0;
        }
        else if (lastEncounter.includes('Welcome To You!')) {
            print('Zombo is up', 'blue');
            done = true;
        }
        print('Dance count: ' + danceCount, 'blue');
        set(DANCE_PROP, danceCount);
        return done;
    });
    print('Done in AHBG', 'blue');
}

function runPLD(maxFlimFlams = 10) {
    const diverts = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);
    if (diverts < 21) {
        if (!userConfirm('Do AHBG before 21 water diverts?', 10000, false)) return;
    }

    let img = /purplelightdistrict(\d+).gif/.exec(visitUrl('clan_hobopolis.php?place=8'));
    let flimflams = getHoboCountsRe(/flimflammed some hobos \((\d+) turns?\)/gm);

    if ((diverts + flimflams) >= 21 && img != null && parseInt(img[1]) < 9 && flimflams < maxFlimFlams) {
        print('Starting barfights.', 'purple');
        setProperty('choiceAdventure223', '1'); // Getting Clubbed; Try to get inside
    }
    else {
        print('Flimflamming the crowd.', 'purple');
        setProperty('choiceAdventure223', '3'); // Getting Clubbed; Try to flimflam the crowd
    }

    set('choiceAdventure224', 2); // Exclusive!; Pick several fights
    set('choiceAdventure294', 1); // Maybe It's a Sexy Snake! Take a Chance?
    set('choiceAdventure205', 2); // Don't fight Chester

    sideZoneLoop($location`The Purple Light District`, false, MACRO_KILL, () => {
        const lastEncounter = get('lastEncounter');
        let done = false;

        if (lastEncounter.includes('Getting Clubbed') || lastEncounter.includes('Exclusive!')) {
            img = /purplelightdistrict(\d+).gif/.exec(visitUrl('clan_hobopolis.php?place=8'));

            if (get('choiceAdventure223') === 3) { // Flimflamming the crowd
                flimflams++;

                if (flimflams >= maxFlimFlams) {
                    print('Switching to barfights.', 'purple');
                    set('choiceAdventure223', 1); // Getting Clubbed; Try to get inside
                }
            }

            else if (get('choiceAdventure223') === 1 &&
                flimflams < maxFlimFlams &&
                img != null && parseInt(img[1]) >= 9) {

                print('Switching to get flimflams.', 'purple');
                set('choiceAdventure223', 3); // Getting Clubbed; Try to flimflam the crowd
            }
        }

        else if (lastEncounter.match(/Van, Damn/)) {
            print('Chester is up.', 'purple');
            done = true;
        }

        return done;
    });

    print(`Done in PLD. At ${getHoboCountsRe(/flimflammed some hobos \((\d+) turns?\)/gm)} flimflams.`, 'purple');
}

function lastAdventureWasSuccessfulCombat(): boolean {
    return lastAdventureText().includes(myName() + ' wins the fight!');
}

function tiresToKills(tires: number): number {
    if (tires === -1) tires = 35;
    return (tires * tires * 0.1) + (0.7 * tires);
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
        ensurePotionEffect($effect`Ancient Protected`, $item`Ancient Protector Soda`);
        ensurePotionEffect($effect`Frost Tea`, $item`cuppa Frost tea`);
    };

    ensureHotRes();

    sideZoneLoop($location`Burnbarrel Blvd.`, true, MACRO_KILL, function() {
        const lastEncounter = getProperty('lastEncounter');
        if (lastEncounter.includes('Getting Tired')) {
            if (getPropertyInt('choiceAdventure206') === 1) {
                tirevalanches++;
                stackKills[tirevalanches] = tiresToKills(tireCount + 1);
                setProperty('choiceAdventure206', '2'); // Getting Tired; Toss the tire on the fire gently
                tireCount = 0;
            } else {
                tireCount++;
                print('Tires on the stack: ' + tireCount, 'red');
                if (tireCount >= tiresToThrow) {
                    print('Going to throw violently.', 'red');
                    setProperty('choiceAdventure206', '1'); // Getting Tired; Toss the tire on the fire violently
                }
            }
        }

        if (stackKills[2] > 0) {
            const hobosLeft = 500 - (stackKills[2] + stackKills[1] + kills);
            let tiresNeeded = 0;
            while ((hobosLeft + tiresToKills(tiresNeeded)) < 500) {
                tiresNeeded++;
            }
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

const getNeededPart = (parts: scoboParts, desiredCount: number): Part => {
    let desiredPart = Part.none;
    for (const part of PART_ORDER) {
        if (parts[part] < desiredCount) {
            desiredPart = part;
            break;
        }
    }

    print(`Needed part is ${Part[desiredPart]}. Have ${parts[desiredPart]} Need ${desiredCount}`, 'blue');
    useSkill(partToSkill[desiredPart]);
    return desiredPart;
};

type tsArg = { getFood: boolean, input: string, hoboKills: number | undefined }

const prepForSkins = (skinsLeft: number): Macro => {
    while (haveEffect($effect`Carol of the Bulls`) < skinsLeft) {
        if (myMp() < 130) eat($item`magical sausage`);
        ensureEffect($effect`Carol of the Bulls`, skinsLeft);
        ensureEffect($effect`Song of the North`, skinsLeft);
    }
    ensureEffect($effect`Confidence of the Votive`, skinsLeft);
    ensureEffect($effect`Baconstoned`, skinsLeft);
    if (!outfit('hobo_physical')) { throw new Error('Can\'t equip physical outfit'); }
    return Macro.attack().repeat();
};

const runTS = ({ getFood = false, input = 'untuned', hoboKills }: tsArg): void => {
    let part: Part;
    let stopAfterFood: boolean;
    let macro = Macro.skill($skill`Stuffed Mortar Shell`, $skill`Entangling Noodles`);
    let parts = getRichardCounts();
    const getSpecificParts = input !== 'untuned';

    if (getFood) print('Looking for food in hobopolis.', 'blue');

    if (!getSpecificParts) {
        if (hoboKills) print(`Generating random parts for ${hoboKills} turns.`, 'blue');
        else print('Generating random parts until out of adventures.', 'blue');
    }
    else print(`Generating up to ${hoboKills} of each hobo part.`, 'blue');

    outfit('hobo_ts');

    if (!getSpecificParts) {
        useSkill($skill`Spirit of Nothing`);
    } else if (hoboKills) {
        part = getNeededPart(parts, hoboKills);
        if (part === Part.none) { print('Done getting parts', 'blue'); return; }
        else if (part === Part.skins) { macro = prepForSkins(hoboKills - parts[part]); }
    }

    if (getFood) {
        stopAfterFood = userConfirm('Stop after getting food?');
        takeCloset($item`hobo nickel`, 40);
        equip($item`hobo code binder`);

        setChoice(272, 1); // Enter the Marketplace
        setChoice(231, 1); // Hobo Marketplace #1; Food Court
        setChoice(232, 1); // Hobo Marketplace #2; Food Court
        setChoice(233, 1); // Food Court #1; Food
        setChoice(234, 1); // Food Court #2; Food
        setChoice(235, 1); // Food #1; Muscle Booze
        setChoice(236, 1); // Food #2; Muscle Booze
        setChoice(237, 1); // Muscle Food; Eat it

        setChoice(240, 1); // Food #1; Muscle Booze
        setChoice(241, 1); // Food #2; Muscle Booze
        setChoice(242, 1); // Muscle Booze; Drink it
    } else {
        print('Not getting food in hobopolis.', 'blue');
        setChoice(272, 2); // Leave the Marketplace
    }

    let hobosKilled = 0;
    sideZoneLoop($location`Hobopolis Town Square`, true, macro, () => {
        let done = false;
        if (getProperty('lastEncounter').includes('Big Merv\'s Protein Shakes')) {
            // Switch to getting booze
            setChoice(233, 2); // Food Court #1; Booze
            setChoice(234, 2); // Food Court #2; Booze
            print('Got food. Looking for booze.', 'blue');
        }

        else if (getProperty('lastEncounter').includes('Arthur Finn\'s World-Record Homebrew Stout')) {
            setChoice(272, 2); // Leave the Marketplace
            print('Got booze. Ignoring marketplace for now.', 'blue');
            getFood = false;
            outfit('hobo_ts');
            if (stopAfterFood) return true;
        }

        if (lastAdventureWasSuccessfulCombat()) {
            hobosKilled++;

            if (getSpecificParts && hoboKills) {
                parts = getRichardCounts();
                const oldPart = part;
                part = getNeededPart(parts, hoboKills);
                if (part === Part.none) { print('Done getting parts.', 'blue'); done = true; }
                if (part === Part.skins && oldPart !== Part.skins) { print('Need to get skins. Re-run the script.', 'blue'); done = true; }
            } else if (hoboKills)
                done = hobosKilled >= hoboKills;
        }
        if (getFood) takeCloset($item`hobo nickel`, 20);

        return done;
    });
};

export function main(input: string): void {
    setAutoAttack(0);
    cliExecute('mood hobo');
    cliExecute('ccs hobo');
    cliExecute('boombox food');
    cliExecute('mcd 0');
    useSkill($skill`Spirit of Nothing`); // Don't be an idiot
    setFamiliar();
    setChoice(1387, 3); // saber force item drop

    const actions = input.split(' ');

    if (haveEffect($effect`Blood Bubble`) < 1.04 * myAdventures()) {
        maximize('hp', false);
        useSkill($skill`Cannelloni Cocoon`);

        while (haveEffect($effect`Blood Bubble`) < 1.04 * myAdventures()) {
            useSkill($skill`Blood Bubble`, Math.floor(myHp() / 30) - 1);
            useSkill($skill`Cannelloni Cocoon`);
        }
    }

    switch (actions[0]) {
        case 'clan':
            setClan(input.substring('clan '.length));
            break;
        case 'sewer':
            set(TRASH_PROP, 0);
            runSewer();
            break;
        case 'ee':
            runEE(actions[1] ? parseInt(actions[1]) : 50);
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
        case 'bb': {
            const numTires = actions[1] ? parseInt(actions[1]) : 0;
            const stack1Count = actions[2] ? parseInt(actions[2]) : -1;
            const stack2Count = actions[3] ? parseInt(actions[3]) : -1;
            runBB(numTires, stack1Count, stack2Count);
            break;
        }
        case 'ts':
            runTS({
                getFood: actions[1] === 'true',
                input: actions[2],
                hoboKills: actions[3] ? parseInt(actions[3]) : undefined
            });
            break;
        default:
            abort('no option passed');
    }

    setAutoAttack(0);
    if (myAdventures() === 0) print('No more adventures', 'red');
    print(`${23 - get('_sausagesEaten')} sausages left today.`, 'purple');
    print(`${11 - get('_freeBeachWalksUsed')} free beach walks left today`, 'orangered');
}
