import {
  cliExecute,
  inebrietyLimit,
  Item,
  myAdventures,
  myDaycount,
  myInebriety,
  print,
  refreshStash,
  stashAmount,
  waitq,
} from "kolmafia";
import { $items, Clan, get, PropertiesManager } from "libram";
import { bb_overdrink } from "./bb_overdrink";
import { bb_sea } from "./bb_sea";

const DELAY = 120;

const garbocheck = () => {
  Clan.join("Alliance from Heck");
  refreshStash();
  const needed: Item[] = [];
  const items = $items`Pantsgiving, haiku katana, Buddy Bjorn, origami pasties, repaid diaper`;

  items.forEach(function (item) {
    if (!stashAmount(item)) {
      needed.push(item);
    }
  });

  return needed;
};

const waitForStashItems = () => {
  let neededItems = garbocheck();
  while (neededItems.length) {
    const now = new Date(Date.now());
    print(
      `${now.getHours()}:${now.getMinutes()}: Missing ${neededItems}. Waiting ${DELAY} secs`,
      "red"
    );
    waitq(DELAY);
    neededItems = garbocheck();
  }
};

const runDayOne = () => {
  if (!get("kingLiberated")) cliExecute("hccs");
  if (!get("kingLiberated")) return;
  if (!get("_fishyPipeUsed")) bb_sea();
  if (
    myInebriety() < inebrietyLimit() ||
    (myInebriety() === inebrietyLimit() && myAdventures() > 0)
  ) {
    waitForStashItems();
    cliExecute("garbo");
  }
  if (myAdventures() === 0) bb_overdrink();
};

export function main(): void {
  if (myDaycount() === 1) runDayOne();
  if (myDaycount() === 2) {
    if (
      myInebriety() < inebrietyLimit() ||
      (myInebriety() === inebrietyLimit() && myAdventures() > 10)
    ) {
      waitForStashItems();
      const props = new PropertiesManager();
      props.set({
        _fishyPipeUsed: true,
        _feelHatredUsed: 3,
        _snokebombUsed: 3,
        _latteRefillsUsed: 3,
        _firedJokestersGun: true,
        _chestXRayUsed: 3,
        _shatteringPunchUsed: 3,
        _gingerbreadMobHitUsed: true,
      });
      cliExecute("garbo ascend -10");
      props.resetAll();
    }
    if (myAdventures() === 10) bb_sea();
    if (myAdventures() !== 0) cliExecute("garbo ascend");
    bb_overdrink();
    cliExecute("hccs_ascend");
    runDayOne();
  }
}
