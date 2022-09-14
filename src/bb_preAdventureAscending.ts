import {
    abort,
    availableAmount,
    canAdventure,
    cliExecute,
    combatRateModifier,
    creatableAmount,
    equip,
    equippedItem,
    familiarEquippedEquipment,
    haveEquipped,
    Item,
    itemType,
    Location,
    myFamiliar,
    myLevel,
    myLocation,
    myMaxmp,
    myMp,
    myTurncount,
    print,
    totalTurnsPlayed,
    useFamiliar,
    userConfirm
} from "kolmafia";
import {
    $effect,
    $familiar,
    $item,
    $location,
    $locations,
    $slot,
    get,
    have
} from "libram";

const WARN = 'orange';
const ERROR = 'red';

function handleFamEquip(): void {
    const fam = myFamiliar();

    if (!haveEquipped($item `tiny stillsuit`)) {
        useFamiliar($familiar `Gelatinous Cubeling`);
        equip($item `tiny stillsuit`);
        useFamiliar(fam);
    }

    if (myLocation())

        if (fam === $familiar `Melodramedary` && !haveEquipped($item `dromedary drinking helmet`)) error('Camel without helmet');

    if (equippedItem($slot `familiar`) === $item `none`) error('no fam item equipped');
}

function handleFam() {
    switch (myFamiliar()) {
        case $familiar `Gelatinous Cubeling`:
            get('cubelingProgress') === 12 && useFamiliar($familiar `Vampire Vintner`) && equip($item `tiny stillsuit`);
            break;
        case $familiar `Vampire Vintner`:
            have($item `1950 Vampire Vintner wine`) && error('Vintner equipped with vintner wine available');
            warn('Vinter equipped. Do the correct combat strategy!');
            break;
    }

    if (get('camelSpit', 0) === 100) warn('Camel ready to spit');

    handleFamEquip();
}

function handleOffhand() {
    const offhand = equippedItem($slot `offhand`);
    const isScrapbook = offhand === $item `familiar scrapbook`;
    const isCMG = offhand === $item `cursed magnifying glass`;

    if (myFamiliar() === $familiar `Grey Goose` && !isScrapbook) warn('Have goose without scrapbook');
    if (myFamiliar() !== $familiar `Melodramedary`) {
        if (get('scrapbookCharges') < 100 && !isScrapbook && myLevel() < 11) error('Scrapbook not equipped with < 100 scraps');
    } else if (myLevel() > 10) {
        if (!isCMG) warn('cursed magnifying glass not equipped');
    } else if (isCMG && get('cursedMagnifyingGlassCount') >= 13) {
        error('Void monster this combat');
    }

    if (myLocation() === $location `The Haunted Kitchen`) equip($item `familiar scrapbook`);
}

function handleAccessory() {
    if (myLocation() !== $location `The Daily Dungeon` && haveEquipped($item `ring of Detect Boring Doors`)) error('Remove boring door ring');
    if (!get('nsTowerDoorKeysUsed').includes('digital key') && (creatableAmount($item `white pixel`) < 30 || !have($item `digital key`)))
        equip($item `Powerful Glove`, $slot `acc1`);
    if (myFamiliar() === $familiar `Grey Goose` && have($item `teacher's pen`) && !haveEquipped($item `teacher's pen`)) error('equip teachers pen');

    if (!haveEquipped($item `Retrospecs`)) {
        if (myLocation() === $location `The Batrat and Ratbat Burrow` ||
            myLocation() === $location `The Black Forest`) {
            error('equip retrospecs');
        }
    }
}

const WEAPON_LOCS = new Map < Item,
    Location[] > ();
WEAPON_LOCS.set($item `industrial fire extinguisher`, $locations `The Batrat and Ratbat Burrow, Cobb's Knob Harem, The Smut Orc Logging Camp`);

function handleWeapon() {
    const locations = WEAPON_LOCS.get(equippedItem($slot `weapon`));
    if (locations && !locations.includes(myLocation())) error(`Unequip ${equippedItem($slot`weapon`)}`);

    if ( /*myLocation() === $location`The Batrat and Ratbat Burrow` ||*/
        myLocation() === $location `Cobb's Knob Harem` ||
        myLocation() === $location `The Defiled Nook` ||
        myLocation() === $location `The Arid, Extra-Dry Desert`) {

        if (!haveEquipped($item `industrial fire extinguisher`)) {
            if (myLocation() === $location `The Defiled Nook`) {
                equip($item `industrial fire extinguisher`, $slot `offhand`);
            } else {
                equip($item `industrial fire extinguisher`);
            }
        }
    }
}

function handleCape() {
    const wash = get('retroCapeWashingInstructions');
    const hero = get('retroCapeSuperhero');
    let badSetup = false;

    if (myLocation() === $location `The Haunted Kitchen`) {
        badSetup = wash !== 'hold' || hero !== 'vampire';
    } else if ($locations `The Defiled Nook, The Defiled Cranny, The Defiled Alcove, The Defiled Niche`.includes(myLocation())) {
        badSetup = wash !== 'kill' || hero !== 'vampire';
    } else {
        badSetup = wash !== 'thrill' || hero !== 'vampire';
    }

    !haveEquipped($item `unwrapped knock-off retro superhero cape`) && error('Retrocape not equipped');
    badSetup && myLevel() < 12 && error('Retrocape not configured correctly.');
}

function handleStillsuit() {
    const famSweat = get('familiarSweat', 0);
    let color;
    if (famSweat >= 23 && !canAdventure($location `The Haunted Library`)) color = ERROR;
    if (famSweat >= 43) color = ERROR;
    color && print(`Distillate is worth ${Math.ceil(famSweat ** .4)} advs`, color);
}

function handleLocation() {
    switch (myLocation()) {
        case $location `The Outskirts of Cobb's Knob`:
            combatRateModifier() < 10 && error('not confrontational enough');
            break;
        case $location `The Dark Neck of the Woods`:
        case $location `The Dark Elbow of the Woods`:
        case $location `The Dark Heart of the Woods`:
        case $location `The Haunted Billiards Room`:
        case $location `The Spooky Forest`:
            combatRateModifier() > -25 && error('not sneaky enough');
            break;
        case $location `The Defiled Nook`:
        case $location `The Defiled Cranny`:
        case $location `The Defiled Alcove`:
        case $location `The Defiled Niche`:
            itemType(equippedItem($slot `weapon`)) !== 'sword' && equip($item `sweet ninja sword`);
            !haveEquipped($item `unwrapped knock-off retro superhero cape`) && equip($item `unwrapped knock-off retro superhero cape`);
            warn('Use Slay the Dead');
            break;
        case $location `The Arid, Extra-Dry Desert`:
            !haveEquipped($item `survival knife`) && equip($item `survival knife`);
            !haveEquipped($item `UV-resistant compass`) && equip($item `UV-resistant compass`);
            break;
        case $location `The Haunted Kitchen`:
            get('manorDrawerCount') === 25 && error('Done in the kitchen');
            break;
    }
}

function handleBack() {
    if (!haveEquipped($item`Jurassic Parka`)) { // eslint-disable-line libram/verify-constants
        equip($item`Jurassic Parka`); // eslint-disable-line libram/verify-constants
    }

    if (myLocation() === $location`The Outskirts of Cobb's Knob`) {
        if (get('parkaMode') !== 'spikolodon') {
            cliExecute('parka spikolodon');
        }

        warn('use spikolodon spikes and then go to friar zone');
    }
}

function error(msg: string) {
    print(msg, ERROR);
}

function warn(msg: string) {
    print(msg, WARN);
}

//TODO: ensure pursuing beard buffs

export function main(): void {
    print('');
    print('-- BEGIN Pre-adventure Check --');
    print('');
    if (!have($effect `Everything Looks Blue`)) {
        if (!have($item `blue rocket`))
            error('Need blue rocket');
        else
            error('use blue rocket');
    }
    if (!have($effect `Everything Looks Red`)) {
        if (!have($item `red rocket`))
            error('Need red rocket');
        else
            error('use red rocket');
    }
    if (!have($effect `Everything Looks Yellow`)) {
        if (!have($item `yellow rocket`))
            error('Need yellow rocket');
        else
            error('YR ready');
    }
    if (myMp() >= myMaxmp() / 2) error('Have alot of mana');
    if (get('cosmicBowlingBallReturnCombats', 0) <= 0) error('Bowling ball ready');
    if ((get('lastCombatEnvironments').match(/u/g) || []).length === 11 && get('_nextColdMedicineConsult', 0) <= totalTurnsPlayed()) error('Breathitin available.');
    if ((get('lastCombatEnvironments').match(/i/g) || []).length === 11 && get('_nextColdMedicineConsult', 0) <= totalTurnsPlayed() && myLevel() < 8) error('Extrovermectin available.');

    handleOffhand();
    handleAccessory();
    handleWeapon();
    handleStillsuit();
    handleCape();
    handleFam();
    handleLocation();
    handleBack();

    print('');
    print('-- END Pre-adventure Check --');
    print('');

    if (!userConfirm('Run next turn?')) {
        abort();
    }
}