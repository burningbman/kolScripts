import { useFamiliar, outfit, abort, visitUrl, print, retrieveItem, haveEffect, use, adventure, itemDropModifier, myHp, useSkill, myAdventures, myMp, eat, runChoice, isBanished, equip } from 'kolmafia';
import { $familiar, $item, $effect, $location, $skill, get, adventureMacro, Macro, $monster, $slot, set } from 'libram';
import { ensureEffect, setChoice } from './lib';


let flags = {
    weakOutfit: false
}

function gearUp(): boolean {
    useFamiliar($familiar`Jumpsuited Hound Dog`);

    // call breakfast cli
    // put batteries and pocket wishes in mall


    let drumMacOutfit, drumMacWeakOutfit = false;
    try {
        if (!flags.weakOutfit) {
            drumMacOutfit = outfit('drum mac farm')
        } else {
            drumMacWeakOutfit = outfit('drum mac farm weak')
        }
    } catch {
        flags.weakOutfit = true;
        drumMacWeakOutfit = outfit('drum mac farm weak')
    }

    return drumMacOutfit || drumMacWeakOutfit;
}

function validateIceHouseBanish() {
    let monster = visitUrl('museum.php?action=icehouse').match(/perfectly-preserved (.*),/);
    return monster && monster[1];
}

function upkeepUltrahydrated() {
    let ultrahydratedCount = haveEffect($effect`Ultrahydrated`);
    if (ultrahydratedCount <= 0) {
        use($item`disassembled clover`);
        adventure($location`Oasis`, 1);
    }
}

function upkeepBuffs() {
    ensureEffect($effect`Phat Loot`, 1);
    ensureEffect($effect`Polka of Plenty`, 1);
    ensureEffect($effect`Singer's Faithful Ocelot`, 1);
    ensureEffect($effect`Leash of Linguini`, 1);
    ensureEffect($effect`Empathy`, 1);
    ensureEffect($effect`Blood Bond`, 1);
}

export function main() {
    if (!gearUp()) {
        abort('Could not equip outfit.');
    }

    let iceHouseMonster = validateIceHouseBanish();
    if (!iceHouseMonster || iceHouseMonster !== 'swarm of scarab beatles') {
        abort('Please banish swarm of scarab beatles in the ice house.');
    }

    if (!retrieveItem($item`human musk`)) {
        abort('Could not get human musk');
    }

    setChoice(1387, 3); // set saber to banish

    set('cloverProtectActive', false);

    while (myAdventures() > 1) {
        if (!retrieveItem($item`Daily Affirmation: Be a Mind Master`)) {
            abort('Could not get Daily Affirmation: Be a Mind Master');
        }

        if (myMp() < 100) {
            eat($item`magical sausage`);
        }

        upkeepUltrahydrated();
        upkeepBuffs();

        if (myHp() < 100) {
            useSkill($skill`Cannelloni Cocoon`);
        }

        gearUp();
        if (!isBanished($monster`rolling stone`)) {
            if (get('_feelHatredUsed') === 3 && get('_snokebombUsed') === 3 && get('_saberForceUses') === 5) {
                // equip mafia ring
                if (!get('_mafiaMiddleFingerRingUsed')) {
                    equip($slot`acc1`, $item`mafia middle finger ring`);
                }
                // equip doctor bag
                else if (get('_reflexHammerUsed') < 3) {
                    equip($slot`acc1`, $item`Lil' Doctor™ bag`);
                }
            }
        }

        if (itemDropModifier() < 235) {
            abort('Not enough item drop to guarantee drum machines.');
        }

        adventureMacro($location`Oasis`, Macro.step('pickpocket')
            .if_('monstername "oasis monster"', Macro.item($item`human musk`).abort())
            .if_('monstername "rolling stone"', Macro.trySkill($skill`Feel Hatred`)
                .trySkill($skill`Snokebomb`)
                .trySkill($skill`Use the force`)
                .trySkill($skill`Show them your ring`)
                .trySkill($skill`Reflex Hammer`)
                .item($item`Daily Affirmation: Be a Mind Master`).abort())
            .attack()
        );
    }

    set('cloverProtectActive', true);
}
