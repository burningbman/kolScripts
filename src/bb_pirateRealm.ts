import {
  availableAmount,
  visitUrl,
  abort,
  myAdventures,
  availableChoiceOptions,
  runChoice,
  print,
  useFamiliar,
  myInebriety,
  inebrietyLimit,
  changeMcd,
  adventure,
  restoreHp,
  myMaxhp,
  runTurn,
  equip,
  mallPrice,
  autosellPrice,
  printHtml,
  userConfirm,
  outfit,
} from "kolmafia";

import {
  $location,
  $item,
  get,
  $familiar,
  maximizeCached,
  $items,
  $effect,
  ensureEffect,
  $slot,
  Macro,
} from "libram";
import { setChoice, shrug } from "./lib";

const piratePort = "place.php?whichplace=realm_pirate&action=pr_port";
const CHAR_PANE_REG_EXP =
  /<b>([^:]*):<\/b><\/td><td class=small>([0-9]*)<\/td><\/tr>/g;
const TRASH_REG_EXP = /<img src.*? alt="(.*?)" .*?<b>(\d+).*?<\/td><\/tr>/g;

const MATE_PRIORITIES: { [key: string]: number } = {
  Harquebusier: 100,
  Cuisiner: 10,
  Mixologist: 10,
};

function pickMate(): string {
  const mates = availableChoiceOptions();
  let best: { priority: number; choice: number } = { choice: -1, priority: -1 };

  [1, 2, 3].forEach((choice) => {
    let priority = 0;
    const curMate = mates[choice];
    print(`Mate ${choice}: ${curMate}`);
    Object.keys(MATE_PRIORITIES).forEach((mate) => {
      if (curMate.includes(mate)) {
        priority += MATE_PRIORITIES[mate];
      }
    });
    if (priority > best.priority) {
      best = { priority, choice };
    }
  });

  print(`Picking mate ${mates[best.choice]}`, "green");
  runChoice(best.choice);
  return mates[best.choice];
}

function parseCharPane(): { [key: string]: number } {
  const ret: { [key: string]: number } = {};
  const charPane = visitUrl("charpane.php");
  let curData;
  do {
    curData = CHAR_PANE_REG_EXP.exec(charPane);
    if (curData) {
      ret[curData[1]] = parseInt(curData[2]);
    }
  } while (curData);

  return ret;
}

function setup(): string {
  let mate = "";
  Macro.attack().repeat().setAutoAttack();
  useFamiliar($familiar`Hobo Monkey`);
  changeMcd(0);
  shrug($effect`Pride of the Puffin`);
  shrug($effect`Drescher's Annoying Noise`);

  setChoice(1368, 1); // Fight giant crab

  setChoice(1352, 1); // first lsland
  setChoice(1353, 5); // second island
  setChoice(1355, 1); // Land Ho!
  setChoice(1358, 1); // The Starboard is Bare
  setChoice(1359, 1); // Grog for the Grogless

  setChoice(1361, 1); // Avast, a Mast!
  setChoice(1363, 1); // Who Pirates the Pirates?
  setChoice(1365, 1); // A Sea Monster

  // get the eyepatch if it's not in the inventory
  if (availableAmount($item`PirateRealm eyepatch`) === 0) {
    if (myAdventures() >= 40) {
      visitUrl(piratePort);
    } else {
      abort("Can't visit PirateRealm with less than 40 adventures");
    }
  }

  equip($item`PirateRealm eyepatch`, $slot`acc1`);
  visitUrl(piratePort);

  if (get("lastEncounter") === "Welcome to PirateRealm") {
    runChoice(1); // Head to Groggy's
  }

  if (get("lastEncounter") === "Groggy's Tavern") {
    mate = pickMate();
  }

  if (get("lastEncounter") === "Seaside Curios") {
    runChoice(4); // curious anemometer
  }

  if (get("lastEncounter") === "Dishonest Ed's Ships") {
    runChoice(4); // swift clipper
  }

  if (get("lastEncounter") === "Time to Set Sail!") {
    runChoice(1);
  }

  return mate;
}

function goShopping(loot: { [key: string]: number }): void {
  print(`Before shopping ${JSON.stringify(loot, undefined, 2)}`, "blue");
  let done = false;
  while (loot.Gold >= 10 && !done) {
    if (loot.Grub < 15) {
      runChoice(1);
    } else if (loot.Grog < 15) {
      runChoice(2);
    } else if (loot.Glue < 3) {
      runChoice(3);
    } else if (loot.Gold > 230) {
      runChoice(4);
    } else {
      done = true;
    }

    loot = parseCharPane();
  }

  print(`After shopping ${JSON.stringify(loot, undefined, 2)}`, "green");
  runChoice(6);
}

function runSailingTurn(mate: string): void {
  maximizeCached(["meat drop"], {
    forceEquip: $items`PirateRealm eyepatch, lucky gold ring, Red Roger's red right foot, PirateRealm party hat, Drunkula's wineglass`,
  });
  const LOOT = parseCharPane();
  const haveGlue = LOOT.Glue > 0;

  setChoice(1362, haveGlue ? 2 : 1); // Stormy Weather
  setChoice(1364, haveGlue ? 1 : 2); // An Opportunity for Dastardly Do
  setChoice(1367, haveGlue ? 1 : 2); // The Ship is Wrecked  
  setChoice(1357, LOOT.Gold > 30 ? 3 : 1); // High Tide, Low Morale

  // Smooth Sailing
  if (mate.includes("Cuisiner") && LOOT.Grub) {
    setChoice(1356, 1);
  } else if (mate.includes("Mixologist") && LOOT.Grog) {
    setChoice(1356, 2);
  } else if (mate.includes("Wide-Eyed")) {
    setChoice(1356, 3);
  } else {
    setChoice(1356, LOOT.Grub > LOOT.Grog ? 1 : 2);
  }

  const page = visitUrl("adventure.php?snarfblat=530");

  if (page.includes("SHOP")) {
    goShopping(LOOT);
  } else {
    runTurn();
  }
}

function runIslandTurn(): boolean {
  ensureEffect($effect`Feeling Excited`);
  ensureEffect($effect`The Magical Mojomuscular Melody`);
  maximizeCached(["meat drop"], {
    forceEquip: $items`PirateRealm eyepatch, lucky gold ring, Red Roger's red left foot, PirateRealm party hat, Drunkula's wineglass`,
  });
  restoreHp(myMaxhp());
  adventure($location`PirateRealm Island`, 1);
  return get("lastEncounter") === "Your Empire of Dirt";
}

export function main(): void {
  if (myInebriety() <= inebrietyLimit()) {
    print("Not overdrunk for PirateRealm", "red");
    return;
  }

  const mate = setup();
  let done = false;

  while (!done) {
    const page = visitUrl("place.php?whichplace=realm_pirate");
    if (page.includes("adventure.php?snarfblat=530")) {
      runSailingTurn(mate);
    } else if (page.includes("adventure.php?snarfblat=531")) {
      done = runIslandTurn();
    } else {
      print("Nothing left to do in PirateRealm.", "green");
      done = true;
    }
  }

  let output = "<table><tr><td>#</td><td>Item</td><td>Value</td></tr>";
  if (get("lastEncounter") === "Your Empire of Dirt") {
    const trash_results = runChoice(1);
    let curTrash;
    do {
      curTrash = TRASH_REG_EXP.exec(trash_results);
      if (curTrash) {
        const item = $item`${curTrash[1]}`;
        const value = mallPrice(item) === 2 * autosellPrice(item) ? autosellPrice(item) : mallPrice(item);
        const itemTotal = value * parseInt(curTrash[2]);
        output += `<tr><td>${curTrash[2]}</td><td>${curTrash[1]}</td><td>${itemTotal}</td></tr>`;
      }
    } while (curTrash);
  }

  print("PirateRealm complete", "green");
  printHtml(`${output}</table>`);
}
