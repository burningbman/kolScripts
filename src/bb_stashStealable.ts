import {
  batchOpen,
  batchClose,
  getInventory,
  putCloset,
  toItem,
  autosellPrice,
} from "kolmafia";

export function main(): void {
  const invItems = getInventory();

  batchOpen();
  for (const itemName in invItems) {
    const item = toItem(itemName);
    if (
      item.tradeable &&
      item.discardable &&
      !item.quest &&
      !item.gift &&
      autosellPrice(item) > 0
    ) {
      putCloset(item, invItems[itemName]);
    }
  }
  batchClose();
}
