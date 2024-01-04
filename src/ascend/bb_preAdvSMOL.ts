import { abort, buy, haveEquipped, myLocation, myMeat, print, userConfirm, myLevel, myTurncount, totalTurnsPlayed, getLocationMonsters, Location, Item, Phylum, Familiar, myFamiliar, Monster, numericModifier, myInebriety, cliExecute, availableAmount, getWorkshed, haveEffect, canAdventure, Effect, toFamiliar, toItem } from "kolmafia";
import { $effect, $familiar, $item, $items, $location, $locations, $monster, $phylum, AutumnAton, DaylightShavings, ensureEffect, get, have } from "libram";
import { ensureItem, shrug } from "../lib";
import { getDefaultFamiliar } from "./lib";

const ML = '.8 ml';

interface Zone {
    fam?: Familiar,
    maximizer?: string[],
    confirmText?: string,
    forceEquip?: Item[],
    targetMonster?: Monster,
    phlyumToBan?: Phylum,
    preventEquip?: Item[],
    nc?: boolean,
    dropChance?: number,
    foodDrop?: boolean,
    boozeDrop?: boolean,
    com?: boolean,
    rwbTarget?: Monster
}

const FRIAR_ZONE_DATA: Zone = {
    nc: true
};

const OVERGROWN_SHRINE_DATA: Zone = {
    forceEquip: [$item`antique machete`]
};

const NC_ONLY: Zone = {
    nc: true
};

const FILTHWORM_ZONE: Zone = {
    forceEquip: [$item`Flash Liquidizer Ultra Dousing Accessory`]
};

const RIFT_ZONE: Zone = {
    targetMonster: $monster`shadow slab`,
    forceEquip: get('_fireExtinguisherCharge') > 20 ? [$item`industrial fire extinguisher`] : undefined,
    dropChance: 10
};

const shipTurns = $location`The Penultimate Fantasy Airship`.turnsSpent;

const ZONE_DATA = new Map<Location, Zone>([
    [$location`The Haunted Kitchen`, {
        phlyumToBan: $phylum`Undead`
    }],
    [$location`Guano Junction`, {
        dropChance: 15
    }],
    [$location`The Beanbat Chamber`, {
        targetMonster: $monster`beanbat`
    }],
    [$location`The Black Forest`, {
        forceEquip: [$item`blackberry galoshes`],
        com: true,
        fam: have($item`reassembled blackbird`) ? (have(toItem('LED Candle')) ? undefined : $familiar`Jill-of-All-Trades`) : $familiar`Reassembled Blackbird`,
        rwbTarget: $monster`black friar`
    }],
    [$location`The Spooky Forest`, {
        nc: $location`The Spooky Forest`.turnsSpent > 5
    }],
    [$location`The Defiled Niche`, {
        targetMonster: $monster`dirty old lihc`,
        phlyumToBan: $phylum`Undead`
    }],
    [$location`The Daily Dungeon`, {
        forceEquip: [$item`ring of Detect Boring Doors`]
    }],
    [$location`The Defiled Alcove`, {
        nc: get('cyrptAlcoveEvilness') > 13,
        confirmText: !have($effect`Ready to Survive`) ? 'Use mayday package' : undefined
    }],
    [$location`The Dark Heart of the Woods`, FRIAR_ZONE_DATA],
    [$location`The Dark Neck of the Woods`, FRIAR_ZONE_DATA],
    [$location`The Dark Elbow of the Woods`, FRIAR_ZONE_DATA],
    [$location`The Batrat and Ratbat Burrow`, {
        dropChance: 15
    }],
    [$location`The Boss Bat's Lair`, {
        targetMonster: $monster`Boss Bat`,
        preventEquip: $location`The Boss Bat's Lair`.turnsSpent > 5 ? [$item`miniature crystal ball`] : undefined
    }],
    [$location`The Hidden Temple`, {
        fam: get('_citizenZone') !== 'The Hidden Temple' && !have($effect`Stone-Faced`) ? $familiar`Patriotic Eagle` : undefined,
        confirmText: (get('_citizenZone') !== 'The Hidden Temple') ? 'Pledge allegiance to the zone' : undefined,
        targetMonster: !have($effect`Stone-Faced`) ? $monster`baa-relief sheep` : undefined,
        dropChance: !have($effect`Stone-Faced`) ? 25 : undefined,
        forceEquip: !have($effect`Stone-Faced`) ? [$item`cursed monkey's paw`] : undefined
    }],
    [$location`The Haunted Billiards Room`, {
        nc: numericModifier('pool skill') + myInebriety() >= 8,
        com: numericModifier('pool skill') + myInebriety() < 8
    }],
    [$location`The Haunted Library`, {
        dropChance: 10,
        targetMonster: $monster`writing desk`,
        phlyumToBan: $phylum`undead`,
        forceEquip: get('banishedMonsters').includes('bookbat') ? undefined : [$item`cursed monkey's paw`]
    }],
    [$location`The Smut Orc Logging Camp`, {
        dropChance: 10
    }],
    [$location`The Goatlet`, {
        targetMonster: $monster`dairy goat`,
        dropChance: 40,
        foodDrop: true,
        forceEquip: [$item`cursed monkey's paw`],
        fam: $familiar`Grey Goose`
    }],
    [$location`The Outskirts of Cobb's Knob`, {
        com: true,
        fam: (get('beGregariousMonster') === $monster`red butler` && !get('banishedPhyla').includes($phylum`Goblin`.toString())) ? $familiar`Patriotic Eagle` : undefined
    }],
    [$location`An Overgrown Shrine (Southeast)`, OVERGROWN_SHRINE_DATA],
    [$location`An Overgrown Shrine (Southwest)`, OVERGROWN_SHRINE_DATA],
    [$location`An Overgrown Shrine (Northeast)`, OVERGROWN_SHRINE_DATA],
    [$location`An Overgrown Shrine (Northwest)`, OVERGROWN_SHRINE_DATA],
    [$location`The Hidden Park`, NC_ONLY],
    [$location`Hippy Camp`, {
        forceEquip: [$item`distressed denim pants`, $item`bejeweled pledge pin`, $item`beer helmet`],
    }],
    [$location`Wartime Hippy Camp`, {
        forceEquip: [$item`distressed denim pants`, $item`bejeweled pledge pin`, $item`beer helmet`],
        nc: true
    }],
    [$location`Vanya's Castle`, {
        forceEquip: get('lastCopyableMonster') === $monster`ninja snowman assassin` && !have($item`ninja carabiner`) ? [$item`continuum transfunctioner`, $item`backup camera`] : [$item`continuum transfunctioner`]
    }],
    [$location`Megalo-City`, {
        forceEquip: [$item`continuum transfunctioner`]
    }],
    [$location`Lair of the Ninja Snowmen`, {
        com: true
    }],
    [$location`The Penultimate Fantasy Airship`, {
        com: shipTurns < 5 || (shipTurns < 10 && have($item`Tissue Paper Immateria`)) || (shipTurns < 15 && have($item`Tin Foil Immateria`)) || (shipTurns < 20 && have($item`Gauze Immateria`)) || (shipTurns < 25 && have($item`Plastic Wrap Immateria`)),
        targetMonster: have($item`Mohawk wig`) && have($item`amulet of extreme plot significance`) && (have($item`titanium assault umbrella`) || have($item`unbreakable umbrella`)) ? $monster`Quiet Healer` : undefined,
        nc: !(shipTurns < 5 || (shipTurns < 10 && have($item`Tissue Paper Immateria`)) || (shipTurns < 15 && have($item`Tin Foil Immateria`)) || (shipTurns < 20 && have($item`Gauze Immateria`)) || (shipTurns < 25 && have($item`Plastic Wrap Immateria`))),
        dropChance: 10
    }],
    [$location`Oil Peak`, {
        maximizer: [ML],
        dropChance: 30
    }],
    [$location`The Hidden Park`, {
        confirmText: get('noncombatForcerActive') ? undefined : 'Force non combat?'
    }],
    [$location`The Hidden Bowling Alley`, {
        dropChance: 40,
        targetMonster: $monster`pygmy bowler`
    }],
    [$location`The Hidden Apartment Building`, {
        targetMonster: $monster`pygmy shaman`
    }],
    [$location`The Hidden Office Building`, {
        targetMonster: $monster`pygmy witch accountant`
    }],
    [$location`The Hidden Hospital`, {
        targetMonster: $monster`pygmy witch surgeon`,
        rwbTarget: $monster`pygmy witch surgeon`
    }],
    [$location`The Haunted Bedroom`, {
        targetMonster: $monster`elegant animated nightstand`
    }],
    [$location`The Haunted Bathroom`, { nc: $location`The Haunted Bathroom`.turnsSpent > 5 }],
    [$location`The Haunted Gallery`, { nc: $location`The Haunted Gallery`.turnsSpent > 5 }],
    [$location`The Haunted Ballroom`, { nc: $location`The Haunted Ballroom`.turnsSpent > 5 }],
    [$location`Next to that Barrel with Something Burning in it`, {
        targetMonster: $monster`batwinged gremlin`,
        confirmText: have($item`seal tooth`) ? undefined : 'Get a seal tooth to stasis.'
    }],
    [$location`Near an Abandoned Refrigerator`, {
        targetMonster: $monster`spider gremlin`,
        confirmText: have($item`seal tooth`) ? undefined : 'Get a seal tooth to stasis.'
    }],
    [$location`Out by that Rusted-Out Car`, {
        targetMonster: $monster`vegetable gremlin`,
        confirmText: have($item`seal tooth`) ? undefined : 'Get a seal tooth to stasis.'
    }],
    [$location`Over Where the Old Tires Are`, {
        targetMonster: $monster`erudite gremlin`,
        confirmText: have($item`seal tooth`) ? undefined : 'Get a seal tooth to stasis.'
    }],
    [$location`The Castle in the Clouds in the Sky (Basement)`, NC_ONLY],
    [$location`The Castle in the Clouds in the Sky (Ground Floor)`, {
        nc: !have($item`electric boning knife`),
        com: have($item`electric boning knife`)
    }],
    [$location`The Castle in the Clouds in the Sky (Top Floor)`, {
        nc: get('questL10Garbage') === 'step9',
        forceEquip: get('questL10Garbage') === 'step9' ? [$item`Mohawk wig`] : []
    }],
    [$location`The Arid, Extra-Dry Desert`, {
        forceEquip: get('banishedMonsters').includes('cactuary') ? [$item`survival knife`, $item`UV-resistant compass`] : [$item`survival knife`, $item`cursed monkey's paw`, $item`UV-resistant compass`],
        confirmText: 'Pickpocket the monster',
        phlyumToBan: $phylum`Bug`
    }],
    [$location`The Battlefield (Frat Uniform)`, {
        dropChance: (get('hippiesDefeated') > 400) ? 5 : undefined,
        phlyumToBan: get('hippiesDefeated') >= 400 ? $phylum`Hippy` : undefined
    }],
    [$location`The Hatching Chamber`, FILTHWORM_ZONE],
    [$location`The Feeding Chamber`, FILTHWORM_ZONE],
    [$location`The Royal Guard Chamber`, FILTHWORM_ZONE],
    [$location`The Filthworm Queen's Chamber`, {
        phlyumToBan: $phylum`Bug`
    }],
    [$location`Shadow Rift (The Misspelled Cemetary)`, RIFT_ZONE],
    [$location`Shadow Rift (The Hidden City)`, RIFT_ZONE],
    [$location`Shadow Rift (The Ancient Buried Pyramid)`, RIFT_ZONE],
    [$location`The Haunted Laundry Room`, {
        dropChance: 15,
        foodDrop: true,
        targetMonster: $monster`cabinet of Dr. Limpieza`,
        rwbTarget: $monster`cabinet of Dr. Limpieza`
    }],
    [$location`The Haunted Wine Cellar`, {
        dropChance: 15,
        boozeDrop: true,
        targetMonster: $monster`possessed wine rack`,
        rwbTarget: $monster`possessed wine rack`
    }],
    [$location`The Haunted Boiler Room`, {
        maximizer: [ML],
        targetMonster: $monster`monstrous boiler`,
        forceEquip: [$item`unstable fulminate`]
    }],
    [$location`The Defiled Nook`, {
        targetMonster: $monster`spiny skelelton`,
        dropChance: 20
    }],
    [$location`A-Boo Peak`, {
        dropChance: 15
    }],
    [$location`The Themthar Hills`, {
        fam: $familiar`Hobo Monkey`,
        forceEquip: [$item`distressed denim pants`, $item`bejeweled pledge pin`, $item`beer helmet`]
    }],
    [$location`The Fungus Plains`, {
        forceEquip: [$item`continuum transfunctioner`]
    }],
    [$location`The Red Zeppelin`, {
        targetMonster: $monster`red butler`,
        phlyumToBan: $phylum`Dude`,
        dropChance: 30
    }],
    [$location`The Enormous Greater-Than Sign`, NC_ONLY],
    [$location`The Dungeons of Doom`, NC_ONLY],
    [$location`The Defiled Cranny`, {
        maximizer: [ML],
        nc: get('cyrptCrannyEvilness') > 37
    }],
    [$location`The Typical Tavern Cellar`, {
        maximizer: [ML],
        nc: true
    }],
    [$location`Inside the Palindome`, {
        nc: !(have($item`photograph of God`) && have($item`photograph of an ostrich egg`) && have($item`photograph of a red nugget`)),
        targetMonster: $monster`Bob Racecar`,
        forceEquip: [$item`Talisman o' Namsilat`],
        phlyumToBan: $phylum`Beast`
    }],
    [$location`Twin Peak`, {
        dropChance: 15,
        nc: true,
        phlyumToBan: $phylum`Dude`
    }],
    [$location`The Upper Chamber`, {
        nc: true // TODO: reconsider this if we can get enough ratchets and have smoke bombs
    }],
    [$location`The Middle Chamber`, {
        dropChance: 20,
        targetMonster: $monster`tomb rat`,
        rwbTarget: $monster`tomb rat`
    }],
    [$location`Cobb's Knob Harem`, {
        targetMonster: $monster`Knob Goblin Harem Girl`
    }],
    [$location`A Mob of Zeppelin Protesters`, {
        maximizer: ['sleaze dmg', 'sleaze spell dmg']
    }]
]);

function upkeepBuffs(): void {
    const zoneData = ZONE_DATA.get(myLocation());
    // ensureEffect($effect`Power Ballad of the Arrowsmith`);
    ensureEffect($effect`Reptilian Fortitude`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Empathy`);

    if ((myLevel() < 12)) {
        ensureEffect($effect`Knowing Smile`);
    }

    if (zoneData?.maximizer?.includes(ML) || (myLevel() >= 12 && get('sidequestArenaCompleted') !== 'fratboy') || (myLevel() < 12)) {
        ensureEffect($effect`Ur-Kel's Aria of Annoyance`);
        ensureEffect($effect`Drescher's Annoying Noise`);
        ensureEffect($effect`Pride of the Puffin`);
    }

    if (zoneData?.nc && !get('noncombatForcerActive')) {
        shrug($effect`Carlweather's Cantata of Confrontation`);
        ensureEffect($effect`Smooth Movements`);
        ensureEffect($effect`The Sonata of Sneakiness`);
    }

    if (zoneData?.com) {
        shrug($effect`The Sonata of Sneakiness`);
        ensureEffect($effect`Carlweather's Cantata of Confrontation`);
        ensureEffect($effect`Musk of the Moose`);
    }

    if (myMeat() > 2000 || zoneData?.dropChance) {
        try {
            ensureEffect($effect`Singer's Faithful Ocelot`);
            ensureEffect($effect`Fat Leon's Phat Loot Lyric`);
        } catch {
            print('Did not get some item boost', 'blue');
        }
    }
}

function getConfirmMessage(): string {
    const zoneData = ZONE_DATA.get(myLocation());
    let confirmString = '';

    if (zoneData?.confirmText) {
        confirmString += zoneData.confirmText + '\n';
    }

    if (get('lastCopyableMonster') === $monster`Green Ops Soldier`) {
        if (!get('spookyVHSTapeMonster') && have($item`Spooky VHS Tape`)) {
            confirmString += 'Use the spooky vhs tape\n';
        }
        if (get('_backUpUses') < 10) {
            if (myLocation().environment !== 'outdoors') {
                confirmString += 'Do not backup GROP in a non outdoor location\n';
            }
            if (get('breathitinCharges') === 0) {
                confirmString += 'No breathitin charges for backing up GROP\n';
            }
        }
    }

    if (get('spookyVHSTapeMonster') && get('spookyVHSTapeMonsterTurn') === totalTurnsPlayed() - 8) {
        confirmString += 'Spooky VHS monster is ready\n';
    }

    const gooseWeight = Math.floor(Math.sqrt($familiar`Grey Goose`.experience));
    if (myFamiliar() === $familiar`Grey Goose` && gooseWeight > 5) {
        confirmString += `${gooseWeight - 5} drones ready to deploy\n`;
    }

    if (AutumnAton.available()) {
        confirmString += 'Fallbot ready for dispatch\n';
    }

    // Cursed magnifying glass
    if (get('_voidFreeFights') < 5 && !zoneData?.nc && !zoneData?.dropChance && !haveEquipped($item`cursed magnifying glass`)) {
        confirmString += 'Equip magnifying glass?\n';
    } else if (get('cursedMagnifyingGlassCount') === 13 && haveEquipped($item`cursed magnifying glass`)) {
        confirmString += 'Void free fight this turn\n';
    }

    if (!have($effect`Everything Looks Yellow`) && myTurncount() > 10) {
        confirmString += 'YR ready\n';
    }

    if (DaylightShavings.buffAvailable() && DaylightShavings.nextBuff() !== $effect`Friendly Chops` && !haveEquipped($item`Daylight Shavings Helmet`) && get('sidequestNunsCompleted') !== 'fratboy') {
        confirmString += 'Daylight shavings helmet buff available\n';
    }

    // June Cleaver
    if (!have($effect`Glowing Blue`) && !zoneData?.dropChance && !haveEquipped($item`June cleaver`)) {
        confirmString += 'Equip June cleaver?\n';
    }

    if (zoneData?.rwbTarget) {
        const rwbTarget = zoneData.rwbTarget;
        if (get('rwbMonster') !== rwbTarget) {
            if (have($effect`Everything Looks Red, White and Blue`)) {
                confirmString += `Supposed to RWB ${rwbTarget}, but still have ELRWB. Go somewhere else?\n`;
            }
            if (myFamiliar() !== $familiar`Patriotic Eagle`) {
                confirmString += `Supposed to RWB ${rwbTarget}. Use Eagle?\n`;
            }
        }
    }

    if (haveEffect($effect`Everything Looks Red, White and Blue`) === 1) {
        confirmString += 'Losing ELRWB this turn.\n';
    }

    if (zoneData?.targetMonster && get('_monkeyPawWishesUsed') === 0 && !haveEquipped($item`cursed monkey's paw`)) {
        confirmString += 'Equip monkey paw for banishing?\n';
    }

    if (zoneData?.targetMonster && have($item`waffle`) && Object.entries(getLocationMonsters(myLocation())).length <= 3) {
        confirmString += 'Consider using waffle for your target monster\n';
    }

    if (myLocation() === $location`The Battlefield (Frat Uniform)` && get('hippiesDefeated') > 400 && have($item`Spooky VHS Tape`)) {
        confirmString += 'Use spooky vhs tape on GROPs.\n';
    }

    if (get('cosmicBowlingBallReturnCombats') === 1) {
        confirmString += 'Bowling ball available next combat (CLEESH + banish?)\n';
    }

    if (zoneData?.phlyumToBan && !get('banishedPhyla').includes(zoneData?.phlyumToBan.toString()) && myFamiliar() !== $familiar`Patriotic Eagle`) {
        confirmString += `Should be trying to banish ${zoneData?.phlyumToBan}\n`;
    }

    if (get('gooseDronesRemaining') >= 7 && !(have($item`star`) || have($item`Richard's star key`))) {
        confirmString += 'Have enough drones for camel toe\n';
    }

    const allowedFams = [$familiar`Patriotic Eagle`];

    myLocation() === $location`The Black Forest` && !have($item`reassembled blackbird`) && allowedFams.push($familiar`Reassembled Blackbird`);
    $locations`The Typical Tavern Cellar, The Defiled Cranny`.includes(myLocation()) && allowedFams.push($familiar`Purse Rat`);
    $locations`The Themthar Hills, The Fungus Plains`.includes(myLocation()) && allowedFams.push($familiar`Hobo Monkey`);
    $locations`Vanya's Castle, The Defiled Alcove`.includes(myLocation()) && allowedFams.push($familiar`Oily Woim`);
    get('gooseDronesRemaining') > 0 && allowedFams.push($familiar`Grey Goose`);
    ($familiar`Shorter-Order Cook`.dropsToday < 3 || $locations`A Crowd of (Stat) Adventurers, A Crowd of (Element) Adventurers, Fastest Adventurer Contest, The Hedge Maze, Tower Level 1, Tower Level 2`.includes(myLocation())) && allowedFams.push($familiar`Shorter-Order Cook`);
    zoneData?.dropChance && allowedFams.push($familiar`Jill-of-All-Trades`);

    if (!allowedFams.includes(myFamiliar())) {
        const suggestedFam = getDefaultFamiliar();
        myFamiliar() !== suggestedFam && (confirmString += `${suggestedFam} is suggested fam\n`);
    }

    if (myLocation() === $location`The Defiled Cranny`) {
        confirmString += 'Cast Be Gregarious on swarm of ghoul whelps\n';
    }

    if (get('_monsterHabitatsFightsLeft', 0) === 1 && get('_monsterHabitatsRecalled', 0) < 3) {
        confirmString += 'Cast Habitat\n';
    }

    switch (myLocation()) {
        case $location`Hero's Field`:
            get('breathitinCharges') <= 0 && (confirmString += 'No breathitin charges\n');
            break;
        case $location`The Battlefield (Frat Uniform)`:
            if (get('hippiesDefeated') >= 400) {
                get('breathitinCharges') <= 0 && (confirmString += 'No breathitin charges\n');
            }
            break;
    }

    return confirmString;
}

function getAbortMessage(): string {
    let abortString = '';
    const zoneData = ZONE_DATA.get(myLocation());

    if (zoneData?.preventEquip) {
        zoneData.preventEquip.forEach((equip) => haveEquipped(equip) && (abortString += `Unequip ${equip}\n`));
    }

    if (zoneData?.nc && !get('noncombatForcerActive') && numericModifier('combat rate') > -25) {
        abortString += 'Reduce combat rate\n';
    }

    if (zoneData?.com && numericModifier('combat rate') < (have($effect`Feeling Lonely`) ? 5 : 10)) {
        abortString += 'Increase combat rate\n';
    }

    if (get('lastCopyableMonster') === $monster`ninja snowman assassin` && !have($item`ninja carabiner`) && !haveEquipped($item`backup camera`)) {
        abortString += `Equip backup camera for NSA\n`;
    }

    // use the hard-coded fam by default
    if (zoneData?.fam && myFamiliar() !== zoneData.fam) {
        abortString += `Should be using ${zoneData.fam} in ${myLocation()}\n`;
    }

    if (get('_coldMedicineConsults') < 5) {
        if (totalTurnsPlayed() >= get('_nextColdMedicineConsult') && (get('lastCombatEnvironments').split('u').length - 1) >= 11) {
            abortString += 'Get your breathitin!\n';
        }

        if (getWorkshed() === $item`cold medicine cabinet`) {
            if (get('_nextColdMedicineConsult') > totalTurnsPlayed() + 11 && myLocation().environment === 'underground') {
                abortString += 'Do not start underground turns yet.\n';
            }
        }
    }

    if (zoneData?.forceEquip) {
        zoneData.forceEquip.forEach((item) => {
            !haveEquipped(item) && (abortString += `Equip ${item}\n`);
        });
    }

    switch (myLocation()) {
        case $location`The Hatching Chamber`:
            get('banishedPhyla').includes('bug') && (abortString += 'Bugs are banished\n');
            break;
        case $location`The Hidden Bowling Alley`:
            !have($item`Bowl of Scorpions`) && (abortString += 'Get bowl of scorpions\n');
            break;
        case $location`A Mob of Zeppelin Protesters`:
            (get('zeppelinProtestors') < 80 && !have($effect`Lucky!`)) && (abortString += 'Use a clover.\n');
            break;
        case $location`Shadow Rift (The Misspelled Cemetary)`:
        case $location`Shadow Rift (The Hidden City)`:
        case $location`Shadow Rift (The Ancient Buried Pyramid)`:
            (DaylightShavings.buffAvailable() && DaylightShavings.nextBuff() === $effect`Friendly Chops` && !haveEquipped($item`Daylight Shavings Helmet`)) && (abortString += 'Equip the shavings helmet\n');
            !have($effect`Shadow Affinity`) && (abortString += 'Call Rufus\n');
            break;
        case $location`The Hidden Hospital`: {
            const toEquip = $items`surgical apron, bloodied surgical dungarees, surgical mask, head mirror, half-size scalpel`.filter((item) => {
                have(item) && !haveEquipped(item);
            });
            toEquip.length && (abortString += `Equip ${toEquip.toString()}\n`);
            break;
        }
        case $location`The Themthar Hills`:
            get('breathitinCharges') > 0 && (abortString += 'Get rid of breathitin charges first\n');
            break;
        case $location`The Batrat and Ratbat Burrow`:
            get('questL11Shen') === 'unstarted' || get('questL11Shen') === 'started' && (abortString += 'Talk to Shen first.\n');
            break;
        case $location`The Castle in the Clouds in the Sky (Top Floor)`:
            (get('questL11Shen') !== 'step5' && get('questL11Shen') !== 'finished') && (abortString += 'Get Shen quest first.\n');
            break;
    }

    return abortString;
}

export function main(): void {
    ensureItem(1, $item`yellow rocket`);
    if (myTurncount() === 0) {
        ensureItem(1, $item`red rocket`);
        ensureItem(1, $item`blue rocket`);
        userConfirm('fire red and blue rockets this combat');
    }

    // if (!have($item`Arr, M80`)) {
    //     if (myMeat() > 90 && !have($item`grungy bandana`)) {
    //         buy($item`Arr, M80`);
    //         print(`Use Arr, M80 in combat`, 'green');
    //     }
    // } else if (myTurncount() > 100) {
    //     userConfirm(`Don't forget to be Arr,M80ing when you can`);
    // }

    if (have($item`star chart`) && availableAmount($item`star`) >= 8 && availableAmount($item`line`) >= 7) {
        cliExecute('acquire Richard\'s star key');
        !have($item`Richard's star key`) && abort('Make the star key');
    }

    upkeepBuffs();

    const abortMessage = getAbortMessage();
    abortMessage && abort(abortMessage);

    const confirmMessage = getConfirmMessage();
    if (confirmMessage) {
        userConfirm(`${confirmMessage}Abort?`) && abort(confirmMessage);
    }
}