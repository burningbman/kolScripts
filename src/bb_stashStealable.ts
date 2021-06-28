import {
    batchOpen,
    batchClose,
    getInventory,
    putCloset,
    toItem,
    autosellPrice,
    itemAmount
} from 'kolmafia';

export function main() {
    let stealableItems = new Map();
    let invItems = getInventory();

    batchOpen();
    for (let itemName in invItems) {
        let item = toItem(itemName);
        if (item.tradeable && item.discardable && !item.quest && !item.gift && autosellPrice(item) > 0) {
            putCloset(item, invItems[itemName]);
        }
    }
    batchClose();
}
