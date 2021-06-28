import {
    availableAmount,
    buy,
    equip,
    takeCloset,
    itemAmount,
    putCloset,
    adventure
} from 'kolmafia';

import { $location, $item } from 'libram';

function getItem(itemName: string) {
    let item = $item`${itemName}`;
    if (availableAmount(item) === 0) {
        buy(1, item);
    } else if (itemAmount(item) < 1) {
        takeCloset(item);
    }
}

export function main() {
    getItem('pick-o-matic lockpicks');
    getItem('eleven-foot pole');
    getItem('ring of detect boring doors');
    equip($item`ring of detect boring doors`);
    adventure(5, $location`The Daily Dungeon`);
    putCloset($item`pick-o-matic lockpicks`);
}
