import { Item, putShop, availableAmount, cliExecute } from "kolmafia";
import { $item } from "libram";
import { getItemPrice } from "./lib";

function shopIt(item: Item, min: number) {
  const price = Math.max(min, getItemPrice(item));
  putShop(price, 0, availableAmount(item), item);
}

export function main(): void {
  shopIt($item`battery (AAA)`, 10800);
  shopIt($item`pocket wish`, 49975);
  shopIt($item`Extrovermectin™`, 49400);
  shopIt($item`blood-drive sticker`, 132500);
  shopIt($item`cold wad`, 949);
  shopIt($item`11-leaf clover`, 24000);
  shopIt($item`bubbling tempura batter`, 21000);
  cliExecute('philter');
}
