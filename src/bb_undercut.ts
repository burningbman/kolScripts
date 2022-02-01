import {
  autosellPrice,
  getShop,
  historicalAge,
  historicalPrice,
  mallPrice,
  print,
  repriceShop,
  shopPrice,
  toItem,
} from "kolmafia";

export function main(): void {
  // update old mall prices
  for (const it in getShop()) {
    const item = toItem(it);
    if (historicalPrice(item) == 0 || historicalAge(item) > 1) {
      mallPrice(item);
    }
  }

  for (const it in getShop()) {
    const item = toItem(it);
    const minPrice = Math.max(autosellPrice(item) * 2, 100);
    let price = historicalPrice(item);
    if (price <= 0) {
      print(`${item} ${shopPrice(item)} -> skipped (no mall price)`);
      continue;
    }
    price = Math.max(price, minPrice);
    if (shopPrice(item) != price) {
      print(`${item} ${shopPrice(item)} -> ${price}`);
      repriceShop(price, item);
    }
  }
}
