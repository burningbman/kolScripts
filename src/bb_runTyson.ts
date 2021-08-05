import {
    outfit, useFamiliar, cliExecute, myAdventures, buy, use, runChoice, visitUrl, mallPrice, toItem, myFullness, fullnessLimit, myInebriety, inebrietyLimit, print, availableAmount, isAccessible, getProperty, itemAmount, abort
} from 'kolmafia';
import { $familiar, $item, get, $coinmaster, set } from 'libram';
import { getPropertyInt } from './lib';

export function main(): void {
    set('logPreferenceChange', false);

    // cargo shorts
    if (!get('_cargoPocketEmptied')) {
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

    // gnerate all our turns
    if (myFullness() < fullnessLimit()) {
        useFamiliar($familiar`Stooper`);
        cliExecute('CONSUME ALL');
    }

    // mine volcano and nightcap
    if (myInebriety() <= inebrietyLimit()) {
        outfit('volcano');
        cliExecute(`minevolcano ${myAdventures()}`);
        myAdventures() === 0 && cliExecute('CONSUME NIGHTCAP');
    }

    // try to buy a one-day ticket with volcoinos
    if (itemAmount($item`Volcoino`) >= 3) {
        buy($coinmaster`Disco GiftCo`, 1, $item`one-day ticket to That 70s Volcano`);
    }

    outfit('Rollover');
    set('logPreferenceChange', true);
}
