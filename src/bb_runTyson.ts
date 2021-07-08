import {
    outfit, useFamiliar, cliExecute, myAdventures, buy, use, runChoice, visitUrl, mallPrice, toItem, myFullness, fullnessLimit, myInebriety, inebrietyLimit, print, availableAmount, isAccessible
} from "kolmafia";
import { $familiar, $item, get, $coinmaster } from "libram";
import { getPropertyInt } from "./lib";

export function main() {
    // TODO cargo shorts

    // mallbuy a one-day ticket if needed
    if (availableAmount($item`one-day ticket to That 70s Volcano`) === 0) {
        buy(1, $item`one-day ticket to That 70s Volcano`, 300000);
    }

    // ensure access to That 70s Volcano
    if (!isAccessible($coinmaster`Disco GiftCo`)) {
        use($item`one-day ticket to That 70s Volcano`);
    }

    // get volcoino from WLF bunker
    if (!get('_volcanoItemRedeemed')) {
        visitUrl('place.php?whichplace=airport_hot&action=airport4_questhub');
        let cheapestCost = 1000000;
        let cheapestOption = -1;
        for (let i = 1; i <= 3; i++) {
            let itemCost = mallPrice(toItem(getPropertyInt('_volcanoItem' + i)));
            let itemCount = getPropertyInt('_volcanoItemCount' + i);
            let cost = itemCount * itemCost;
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
        cliExecute("CONSUME ALL");
    }

    // mine volcano and nightcap
    if (myInebriety() <= inebrietyLimit()) {
        outfit('volcano');
        cliExecute(`minevolcano ${myAdventures()}`);
        cliExecute("CONSUME NIGHTCAP");
    }

    // try to buy a one-day ticket with volcoinos
    buy($coinmaster`Disco GiftCo`, 1, $item`one-day ticket to That 70s Volcano`);

    outfit("Rollover");
}
