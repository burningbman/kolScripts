import {
  adv1,
  cliExecute,
  closetAmount,
  equip,
  haveEffect,
  itemAmount,
  maximize,
  myAdventures,
  myMaxhp,
  mySpleenUse,
  print,
  putCloset,
  restoreHp,
  restoreMp,
  retrieveItem,
  runChoice,
  spleenLimit,
  use,
  useFamiliar,
  visit,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $skill,
  adventureMacro,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { setChoice, shrug, tryUse } from "./lib";

function wrapZone(zoneFunction: () => void, action: string) {
  const startAdventureCount = myAdventures();

  zoneFunction();

  const usedAdventures = startAdventureCount - myAdventures();
  print(`It took ${usedAdventures} to ${action}`, "green");

  return usedAdventures;
}

const FREE_RUN_MACRO = Macro.externalIf(
  get("lassoTraining") !== "expertly",
  Macro.item($item`sea lasso`)
)
  .trySkill($skill`Feel Hatred`)
  .trySkill($skill`Snokebomb`)
  .trySkill($skill`Throw Latte on Opponent`)
  .skill($skill`Curse of Weaksauce`)
  .skill($skill`Micrometeorite`)
  .skill($skill`Saucegeyser`)
  .repeat();

function refillLatteIfNeeded() {
  if (get("_latteBanishUsed")) {
    cliExecute("latte refill cinnamon pumpkin vanilla");
  }
}

function ensureLassos(count: number) {
  if (get("lassoTraining") !== "expertly") {
    retrieveItem($item`sea lasso`, count);
  }
}

function freeGrandpa() {
  setChoice(1220, 2);
  setChoice(302, 1);
  setChoice(303, 1);
  setChoice(304, 2);
  setChoice(305, 1);
  gearUp("-combat, +equip latte lovers member's mug,");

  while (!get("lastEncounter").includes("You've Hit Bottom")) {
    ensureLassos(1);
    nonCombat();
    adventureMacro($location`The Marinara Trench`, FREE_RUN_MACRO);
    refillLatteIfNeeded();
  }
}

function gearUp(maximizeStr: string) {
  const pants = get("lassoTraining") === "expertly" ? "" : "+equip sea chaps,";
  maximize(
    `${maximizeStr} +equip sea cowboy hat, +equip old SCUBA tank, ${pants} +equip mafia thumb ring, +equip lucky gold ring, +equip mr. cheengs spectacles`,
    false
  );
}

function nonCombat() {
  shrug($effect`Carlweather's Cantata of Confrontation`);
  ensureEffect($effect`Invisible Avatar`);
  ensureEffect($effect`Smooth Movements`);
  get("_feelLonelyUsed") < 3 && ensureEffect($effect`Feeling Lonely`);
  ensureEffect($effect`The Sonata of Sneakiness`);
}

function combat() {
  shrug($effect`Invisible Avatar`);
  shrug($effect`Feeling Lonely`);
  shrug($effect`The Sonata of Sneakiness`);
  ensureEffect($effect`Musk of the Moose`);
  ensureEffect($effect`Carlweather's Cantata of Confrontation`);
}

function getTrailMap() {
  let tentIndex = 1;
  gearUp("+combat");
  setChoice(313, tentIndex);
  setChoice(314, tentIndex);
  setChoice(315, tentIndex);

  while (!have($item`Mer-kin trailmap`)) {
    ensureLassos(1);
    retrieveItem(2, $item`New Age healing crystal`);

    if (have($item`Mer-kin lockkey`)) {
      gearUp("-combat");
      nonCombat();
    } else {
      combat();
    }

    adventureMacro(
      $location`The Mer-Kin Outpost`,
      Macro.externalIf(
        get("lassoTraining") !== "expertly",
        Macro.item($item`sea lasso`)
      )
        .item([$item`New Age healing crystal`, $item`New Age hurting crystal`])
        .repeat()
    );

    if (get("lastEncounter").includes("Intent")) {
      tentIndex++;
      setChoice(313, tentIndex);
      setChoice(314, tentIndex);
      setChoice(315, tentIndex);
    }

    tryUse(1, $item`Mer-kin stashbox`);
    putCloset($item`sand dollar`, itemAmount($item`sand dollar`));
  }

  use($item`Mer-kin trailmap`);
}

function freeBigBrother() {
  setChoice(299, 1);
  gearUp("-combat, +equip latte lovers member's mug,");

  while (!get("lastEncounter").includes("Down at the Hatch")) {
    ensureLassos(1);
    nonCombat();
    adventureMacro(
      $location`The Wreck of the Edgar Fitzsimmons`,
      FREE_RUN_MACRO
    );
    refillLatteIfNeeded();
  }
}

function freeLittleBrother() {
  maximize(
    `+equip sea cowboy hat, +equip old SCUBA tank, +equip sea chaps, +equip mafia thumb ring, +equip lucky gold ring, +equip Powerful Glove`,
    false
  );
  restoreHp(myMaxhp());

  Macro.while_(
    `!monstername "Neptune flytrap"`,
    Macro.item($item`sea lasso`, $item`New Age healing crystal`).trySkill(
      $skill`Macrometeorite`
    )
  )
    .if_(
      `monstername "Neptune flytrap"`,
      new Macro()
        .trySkill($skill`Transcendent Olfaction`)
        .item($item`sea lasso`, $item`New Age healing crystal`)
        .item([$item`New Age healing crystal`, $item`New Age hurting crystal`])
        .repeat()
    )
    .setAutoAttack();

  while (!have($item`wriggling flytrap pellet`)) {
    ensureLassos(5);
    retrieveItem(10, $item`New Age healing crystal`);
    adv1($location`An Octopus's Garden`);
  }
}

function getLotsOfFishy() {
  if (!get("_freePillKeeperUsed")) {
    print("Using free pill keeper to get fishy", "green");
    cliExecute("pillkeeper semirare");
  } else if (mySpleenUse() < spleenLimit() - 3) {
    print("Using 3 spleen and pill keeper to get fishy", "green");
    cliExecute("pillkeeper semirare");
  } else if (get("currentMojoFilters") === 0) {
    print("Using 3 mojo filters and pill keeper to get fishy", "green");
    use($item`mojo filter`, 3);
    cliExecute("pillkeeper semirare");
  }

  adv1($location`The Brinier Deepers`);
}

function getSeahorse() {
  retrieveItem($item`sea cowbell`, 3);
  retrieveItem($item`sea lasso`, 1);
  maximize(
    `+equip mer-kin gladiator mask, +equip mafia thumb ring, +equip Lil' doctor bag, +equip mafia middle finger ring`,
    false
  );
  while (!get("seahorseName")) {
    retrieveItem(2, $item`New Age healing crystal`);
    adventureMacro(
      $location`The Coral Corral`,
      Macro.if_(
        'monstername "Wild seahorse"',
        Macro.item([$item`sea cowbell`, $item`sea cowbell`])
          .item([$item`sea cowbell`, $item`sea lasso`])
          .abort()
      )
        .trySkill($skill`Show them your ring`)
        .trySkill($skill`Reflex Hammer`)
        .item([$item`New Age healing crystal`, $item`New Age hurting crystal`])
        .repeat()
    );
  }
}

function setup() {
  // setup fam and breathing gear
  useFamiliar($familiar`Red-Nosed Snapper`);
  equip($item`ittah bittah hookah`);
  equip($item`Mer-kin gladiator mask`);
  retrieveItem(1, $item`sea chaps`);
  retrieveItem(1, $item`sea cowboy hat`);
  if (!have($item`old SCUBA tank`)) {
    visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
    visitUrl(
      "place.php?whichplace=sea_oldman&preaction=buytank&action=oldman_oldman",
      true
    );
  }
  cliExecute("ccs garbo");
}

function getFishy() {
  // get initial fishy
  if (!haveEffect($effect`Fishy`)) {
    use($item`fishy pipe`);
    if (!haveEffect($effect`Fishy`)) throw "Did not get fishy from pipe.";
  }

  if (haveEffect($effect`Fishy`) <= 10) {
    getLotsOfFishy();
  }
}

export function main(): void {
  let adventuresUsed = 0;
  setup();
  getFishy();

  if (get("questS02Monkees") === "unstarted") {
    adventuresUsed += wrapZone(freeLittleBrother, "free little brother");
    use($item`wriggling flytrap pellet`);
    visitUrl("monkeycastle.php?who=1");
  }

  if (get("questS02Monkees") === "started") {
    use($item`wriggling flytrap pellet`);
    visitUrl("monkeycastle.php?who=1");
  }

  if (get("questS02Monkees") === "step1") {
    adventuresUsed += wrapZone(freeBigBrother, "free big brother");
    visitUrl("monkeycastle.php?who=2");
    visitUrl("monkeycastle.php?who=1");
  }

  if (get("questS02Monkees") === "step4") {
    adventuresUsed += wrapZone(freeGrandpa, "free grandpa");
    visitUrl("monkeycastle.php?action=grandpastory&topic=grandma");
  }

  if (get("questS02Monkees") === "step5") {
    visitUrl("monkeycastle.php?action=grandpastory&topic=grandma");
  }

  if (
    get("questS02Monkees") === "step6" ||
    get("questS02Monkees") === "step7"
  ) {
    adventuresUsed += wrapZone(getTrailMap, "get the trail map");
    visitUrl("monkeycastle.php?action=grandpastory&topic=currents");
  }

  if (get("corralUnlocked")) {
    adventuresUsed += wrapZone(getSeahorse, "get the sea horse");
  }

  if (get("seahorseName")) {
    maximize(
      "hp, mp, +outfit Clothing of Loathing, +equip old SCUBA tank",
      false
    );
    restoreHp(myMaxhp());
    restoreMp(1200);
    retrieveItem($item`warbear whosit`, 12);
    visitUrl("sea_merkin.php?action=temple");
    runChoice(1);
    runChoice(1);
    runChoice(1);
    // TODO fight
    runChoice(1);
  }

  print(`Used a total of ${adventuresUsed} adventures.`, "green");
}
