import { ensureItem, setClan } from "./lib";
import { maximize, myName, useFamiliar } from "kolmafia";
import { $familiar, $item } from "libram";

export function main(): void {
  if (myName().toLowerCase() !== "burningbman") {
    return;
  }

  setClan("Bonus Adventures from Hell");
  useFamiliar($familiar`Trick-or-Treating Tot`);
  ensureItem(1, $item`li'l unicorn costume`);
  maximize(
    "adv, 117 max, 0.1 pvp fights, 90 max, 0.001 rollover effect duration, equip blue LavaCo Lamp, equip sasq watch, switch tot",
    false
  );
}
