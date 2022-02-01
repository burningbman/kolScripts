import {
  abort,
  cliExecute,
  familiarWeight,
  haveEffect,
  itemAmount,
  mallPrice,
  maximize,
  myAdventures,
  myDaycount,
  myFamiliar,
  myMaxhp,
  print,
  putCloset,
  restoreHp,
  restoreMp,
  retrieveItem,
  use,
  useFamiliar,
  visitUrl,
  weightAdjustment,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  $stats,
  adventureMacro,
  get,
  have,
  Macro,
  maximizeCached,
  Mood,
} from "libram";
import {
  ensureItem,
  getFreeKills,
  haveFreeKills,
  setChoice,
  shrug,
  tryUse,
} from "./lib";

const MOOD_BASE = new Mood();
MOOD_BASE.effect($effect`Empathy`);
MOOD_BASE.effect($effect`Blood Bond`);
MOOD_BASE.effect($effect`Leash of Linguini`);
MOOD_BASE.effect($effect`Blood Bubble`);

const MOOD_NON_COMBAT = new Mood();
MOOD_NON_COMBAT.effect($effect`Invisible Avatar`);
MOOD_NON_COMBAT.effect($effect`Smooth Movements`);
MOOD_NON_COMBAT.effect($effect`Feeling Lonely`);
MOOD_NON_COMBAT.effect($effect`The Sonata of Sneakiness`);

const MOOD_COMBAT = new Mood();
MOOD_COMBAT.effect($effect`Musk of the Moose`);
MOOD_COMBAT.effect($effect`Carlweather's Cantata of Confrontation`);

function adventure(location: Location, macro: Macro) {
  if (!haveEffect($effect`Fishy`)) {
    throw "Lost fishy effect";
  }
  if (myAdventures() === 0) {
    throw "No more adventures";
  }
  putCloset($item`sand dollar`, itemAmount($item`sand dollar`));
  restoreHp(myMaxhp());
  restoreMp(50);
  MOOD_BASE.execute();
  ensureLassos(1);
  adventureMacro(location, macro);
}

function wrapZone(zoneFunction: () => void, action: string) {
  const startAdventureCount = myAdventures();
  zoneFunction();

  const usedAdventures = startAdventureCount - myAdventures();
  print(`It took ${usedAdventures} to ${action}`, "green");

  return usedAdventures;
}

const haveBootRuns = () =>
  get("_banderRunaways") <
  Math.floor(
    (familiarWeight($familiar`Pair of Stomping Boots`) + weightAdjustment()) / 5
  );

const banderReady = () =>
  myFamiliar() === $familiar`Pair of Stomping Boots` && haveBootRuns();

const getFamEquip = () =>
  banderReady() ? $item`das boot` : $item`ittah bittah hookah`;

function getFreeRuns(): Macro {
  if (
    !banderReady() &&
    get("_feelHatredUsed") === 3 &&
    get("_snokebombUsed") === 3
  ) {
    if (get("_latteBanishUsed")) {
      if (get("_latteRefillsUsed") === 3) {
        throw new Error("No more free runs avaiable.");
      } else {
        refillLatteIfNeeded();
      }
    }
  }

  return Macro.externalIf(
    get("lassoTraining") !== "expertly",
    Macro.item($item`sea lasso`)
  )
    .externalIf(banderReady(), Macro.step("runaway"))
    .trySkill($skill`Feel Hatred`)
    .trySkill($skill`Snokebomb`)
    .trySkill($skill`Throw Latte on Opponent`)
    .abort();
}

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
  setChoice(302, 1);
  setChoice(303, 1);
  setChoice(
    304,
    mallPrice($item`bubbling tempura batter`) > get("valueOfAdventure") ? 1 : 2
  ); // conjure tempura batter
  setChoice(305, 2); // don't bother with globe of deep sauce

  while (!get("lastEncounter").includes("You've Hit Bottom")) {
    gearUp(["-combat"], { freeRun: true });
    ensureLassos(1);
    nonCombat();
    adventure($location`The Marinara Trench`, getFreeRuns());
  }
}

function gearUp(
  maximize: string[],
  options?: { forceEquip?: Item[]; freeRun?: boolean; freeKill?: boolean }
) {
  const forceEquip = options?.forceEquip || [];
  const bonusEquip = new Map<Item, number>();
  bonusEquip.set($item`mafia thumb ring`, 500);
  bonusEquip.set($item`lucky gold ring`, 500);
  bonusEquip.set($item`Mr. Cheeng's spectacles`, 500);

  if (get("lassoTraining") !== "expertly") {
    forceEquip.push($item`sea chaps`);
    forceEquip.push($item`sea cowboy hat`);
    forceEquip.push($item`old SCUBA tank`);
  } else {
    forceEquip.push($item`Mer-kin gladiator mask`);
  }

  let fam = $familiar`Red-Nosed Snapper`;
  if (options?.freeKill) {
    forceEquip.push(...$items`The Jokester's gun, Lil' Doctor™ bag`);
    bonusEquip.set($item`The Jokester's gun`, 5000);
  }
  if (options?.freeRun) {
    if (haveBootRuns()) {
      fam = $familiar`Pair of Stomping Boots`;
      maximize.push("2 familiar weight");
      forceEquip.push($item`das boot`);
    } else {
      forceEquip.push(...$items`latte lovers member's mug, Lil' Doctor™ bag`);
    }
  }

  useFamiliar(fam);

  maximizeCached(maximize, {
    forceEquip,
    bonusEquip,
  });
}

function nonCombat() {
  shrug($effect`Carlweather's Cantata of Confrontation`);
  MOOD_NON_COMBAT.execute();
}

function combat() {
  shrug($effect`Invisible Avatar`);
  shrug($effect`Feeling Lonely`);
  shrug($effect`The Sonata of Sneakiness`);
  MOOD_COMBAT.execute();
}

function getTrailMap() {
  let tentIndex = 1;
  setChoice(313, tentIndex);
  setChoice(314, tentIndex);
  setChoice(315, tentIndex);

  while (!have($item`Mer-kin trailmap`)) {
    ensureLassos(1);
    retrieveItem(3, $item`New Age healing crystal`);

    if (have($item`Mer-kin lockkey`)) {
      gearUp(["-combat"], { freeRun: true });
      nonCombat();
    } else {
      gearUp(["+combat"], { freeKill: true });
      combat();
    }

    if (!haveFreeKills() && myDaycount() === 1) {
      abort("No more free kills during first day.");
    }

    adventure(
      $location`The Mer-Kin Outpost`,
      Macro.externalIf(
        get("lassoTraining") !== "expertly",
        Macro.item($item`sea lasso`)
      )
        .externalIf(have($item`Mer-kin lockkey`), Macro.step(getFreeRuns()))
        .externalIf(!have($item`Mer-kin lockkey`), Macro.step(getFreeKills()))
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
  }

  use($item`Mer-kin trailmap`);
}

function freeBigBrother() {
  while (!get("lastEncounter").includes("Down at the Hatch")) {
    gearUp(["-combat"], { freeRun: true });
    nonCombat();
    adventure($location`The Wreck of the Edgar Fitzsimmons`, getFreeRuns());
  }
}

function freeLittleBrother() {
  while (!have($item`wriggling flytrap pellet`)) {
    gearUp(["meat drop"], {
      freeRun: true,
      freeKill: true,
    });
    ensureLassos(1);
    ensureItem(3, $item`New Age healing crystal`);
    adventure(
      $location`An Octopus's Garden`,
      Macro.if_(
        `!monstername "Neptune flytrap"`,
        Macro.step(getFreeRuns())
      ).if_(
        `monstername "Neptune flytrap"`,
        new Macro()
          .trySkill($skill`Transcendent Olfaction`)
          .item($item`sea lasso`)
          .step(getFreeKills())
          .item([
            $item`New Age healing crystal`,
            $item`New Age hurting crystal`,
          ])
          .repeat()
      )
    );
  }
}

function getSeahorse() {
  retrieveItem($item`sea cowbell`, 3);

  while (!get("seahorseName")) {
    gearUp(["item drop"], {
      freeRun: true,
      freeKill: true,
      forceEquip: $items`mafia middle finger ring`,
    });
    retrieveItem(3, $item`New Age healing crystal`);
    retrieveItem($item`sea lasso`, 1);
    adventure(
      $location`The Coral Corral`,
      Macro.if_(
        'monstername "Wild seahorse"',
        Macro.item([$item`sea cowbell`, $item`sea cowbell`])
          .item([$item`sea cowbell`, $item`sea lasso`])
          .abort()
      )
        .trySkill($skill`Show them your ring`)
        .trySkill($skill`Reflex Hammer`)
        .step(getFreeKills())
        .step(getFreeRuns())
        .item([$item`New Age healing crystal`, $item`New Age hurting crystal`])
        .repeat()
    );
  }
}

function setup() {
  // setup fam and breathing gear
  if (!have($item`old SCUBA tank`)) {
    visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
    visitUrl(
      "place.php?whichplace=sea_oldman&preaction=buytank&action=oldman_oldman",
      true
    );
  }
  cliExecute("ccs garbo");
  cliExecute("mood apathetic");

  setChoice(299, 1); // free Big Brother
}

function getFishy() {
  // get initial fishy
  if (!haveEffect($effect`Fishy`)) {
    use($item`fishy pipe`);
    if (!haveEffect($effect`Fishy`)) throw "Did not get fishy from pipe.";
  }

  // if (haveEffect($effect`Fishy`) <= 10) {
  //   getLotsOfFishy();
  // }
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
    !get("corralUnlocked") &&
    (get("questS02Monkees") === "step6" || get("questS02Monkees") === "step7")
  ) {
    adventuresUsed += wrapZone(getTrailMap, "get the trail map");
    visitUrl("monkeycastle.php?action=grandpastory&topic=currents");
  }

  if (get("corralUnlocked")) {
    adventuresUsed += wrapZone(getSeahorse, "get the sea horse");
  }

  if (get("seahorseName")) {
    if (!$stats`Mysticality,Moxie,Muscle`.find((stat) => stat < 150)) {
      maximize(
        `hp, mp, +outfit Clothing of Loathing, +equip old SCUBA tank, +equip ${getFamEquip()}`,
        false
      );
      restoreHp(myMaxhp());
      restoreMp(1200);
      retrieveItem($item`warbear whosit`, 12);
      print("ready for dad", "green");
      // visitUrl("sea_merkin.php?action=temple");
      // runChoice(1);
      // runChoice(1);
      // runChoice(1);
      // // TODO fight
      // runChoice(1);
    }
  }

  print(`Used a total of ${adventuresUsed} adventures.`, "green");
}
