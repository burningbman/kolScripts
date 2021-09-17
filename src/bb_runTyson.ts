import {
    outfit, useFamiliar, cliExecute, myAdventures, buy, use, runChoice, visitUrl, mallPrice, toItem, myFullness, fullnessLimit, myInebriety, inebrietyLimit, print, availableAmount, isAccessible, getProperty, itemAmount, abort, putShop, autosell, userConfirm, numericModifier, shopPrice, runCombat,
} from 'kolmafia';
import { $familiar, $item, get, $coinmaster, set, $effect, $location, $monster, Macro, $skill } from 'libram';
import { ensureEffect, getPropertyInt, mapMonster, setChoice } from './lib';

const runVolcano = (): void => {
    // mallbuy a one-day ticket if needed
    if (availableAmount($item`one-day ticket to That 70s Volcano`) === 0) {
        buy(1, $item`one-day ticket to That 70s Volcano`, 350000);
    }

    // ensure access to That 70s Volcano
    if (!isAccessible($coinmaster`Disco GiftCo`)) {
        if (!availableAmount($item`one-day ticket to That 70s Volcano`)) {
            abort('Don\'t have a 70s Volcano ticket.');
        }
        use($item`one-day ticket to That 70s Volcano`);
    }

    // get volcoino from WLF bunker
    if (!get('_volcanoItemRedeemed')) {
        visitUrl('place.php?whichplace=airport_hot&action=airport4_questhub');
        let cheapestCost = 1000000;
        let cheapestOption = -1;
        for (let i = 1; i <= 3; i++) {
            const item = toItem(getPropertyInt('_volcanoItem' + i));
            const itemCost = mallPrice(item);
            const itemCount = getPropertyInt('_volcanoItemCount' + i);
            const cost = itemCount * itemCost;
            print(`Option ${i}: ${itemCount} ${item.name} @ ${itemCost} ea`);
            if (cost !== 0 && cost < cheapestCost) {
                cheapestCost = cost;
                cheapestOption = i;
            }
        }
        if (cheapestOption !== -1) {
            buy(getPropertyInt('_volcanoItemCount' + cheapestOption), toItem(getPropertyInt('_volcanoItem' + cheapestOption)));
            visitUrl('place.php?whichplace=airport_hot&action=airport4_questhub');
            runChoice(cheapestOption);
        }
    }

    // get volcoino from tower
    if (!get('_infernoDiscoVisited')) {
        outfit('Smooth Velvet');
        visitUrl('place.php?whichplace=airport_hot&action=airport4_zone1');
        runChoice(7);
    }

    // mine volcano and nightcap
    if (myInebriety() <= inebrietyLimit()) {
        outfit('volcano');
        cliExecute(`minevolcano ${myAdventures()}`);
    }

    // try to buy a one-day ticket with volcoinos
    if (itemAmount($item`Volcoino`) >= 3) {
        buy($coinmaster`Disco GiftCo`, 1, $item`one-day ticket to That 70s Volcano`);
    }
};

const getDrumMacMPA = (): number => {
    outfit('drum mac farm');
    const meat = 120 * (numericModifier('meat drop') + 100) / 100;
    const drumMac = shopPrice($item`drum machine`);
    const palmFrond = shopPrice($item`palm frond`);
    const waterLily = shopPrice($item`carbonated water lily`);
    const clover = Math.min(mallPrice($item`ten-leaf clover`), mallPrice($item`disassembled clover`));
    return Math.floor((20 * (meat + drumMac + 130 / 6 + (palmFrond + waterLily) / 3) - clover) / 21);
};

const getDistensionAndDogHairPills = (): void => {
    ensureEffect($effect`Transpondent`);
    Macro.skill($skill`Feel Nostalgic`).skill($skill`Feel Envy`).attack().repeat().setAutoAttack();
    mapMonster($location`Domed City of Grimacia`, $monster`whiny survivor`);
    runCombat();
    mapMonster($location`Domed City of Grimacia`, $monster`grizzled survivor`);
    runCombat();
    mapMonster($location`Domed City of Grimacia`, $monster`whiny survivor`);
    runCombat();

    setChoice(536, get('_bb_runTyson_moreDistention') ? 1 : 2);
    use(2, $item`Map to Safety Shelter Grimace Prime`);
    setChoice(536, get('_bb_runTyson_moreDistention') ? 2 : 1);
    use(2, $item`Map to Safety Shelter Grimace Prime`);
    set('_bb_runTyson_moreDistention', !get('_bb_runTyson_moreDistention'));
};

export function main(): void {
    set('logPreferenceChange', false);
    let mode;
    const drumMacMPA = getDrumMacMPA();

    if (drumMacMPA > 1.5 * mallPrice($item`drum machine`)) throw 'Check mall prices';

    if (drumMacMPA < 3450) {
        print('Going volcano mining', 'red');
        set('valueOfAdventure', 3450);
        mode = 'volcano';
    } else {
        set('valueOfAdventure', drumMacMPA);
        print(`Farming drum machines with ${drumMacMPA} MPA`, 'green');
    }

    // cargo shorts
    if (!get('_cargoPocketEmptied')) {
        getDistensionAndDogHairPills();
        cliExecute('mom stats');
        cliExecute('bb_goShopping');
        const emptiedPocketsPref = getProperty('cargoPocketsEmptied');
        const emptiedPockets = emptiedPocketsPref.split(',');

        for (let i = 1; i <= 666; i++) {
            if (!emptiedPockets.includes(i.toString())) {
                cliExecute(`cargo pick ${i}`);
                break;
            }
        }
    }

    // generate all our turns
    if (myFullness() < fullnessLimit()) {
        useFamiliar($familiar`none`);
        cliExecute('CONSUME ALL');
    }

    if (myInebriety() <= inebrietyLimit()) {
        if (mode === 'volcano') {
            runVolcano();
        } else {
            cliExecute('bb_drumMacFarm');

            for (const item of [$item`drum machine`, $item`carbonated water lily`, $item`palm frond`]) {
                putShop(shopPrice(item), 0, availableAmount(item), item);
            }
            autosell(availableAmount($item`hot date`), $item`hot date`);
            putShop(3000, 0, $item`Special Seasoning`);
        }
    }

    // mine volcano and nightcap
    if (myAdventures() === 0 && myInebriety() <= inebrietyLimit()) {
        useFamiliar($familiar`Stooper`);
        cliExecute('CONSUME ALL; CONSUME NIGHTCAP');
    }

    outfit('Rollover');
    set('logPreferenceChange', true);
}
