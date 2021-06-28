import {
    availableAmount,
    visitUrl,
    haveEquipped,
    equip,
    abort
} from 'kolmafia';

import { $location, $item } from 'libram';

const piratePort = "place.php?whichplace=realm_pirate&action=pr_port";

export function main() {
    let eyepatch = $item`PirateRealm eyepatch`;

    // get the eyepatch if it's not in the inventory
    if (availableAmount(eyepatch) === 0) {
        visitUrl(piratePort);
        main();
        return;
    }

    // equip the eyepatch if it isn't
    if (!haveEquipped(eyepatch)) {
        equip(eyepatch);
    }

    let groggys = visitUrl(piratePort);

    // abort if we don't have at least 40 adventures
    if (groggys.match('It takes around 40 Adventures to truly appreciate a day at PirateRealm.')) {
        abort('Need at least 40 adventures to priate realm.');
    }
}
