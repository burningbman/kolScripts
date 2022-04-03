import {
  abort,
  cliExecute,
  dadSeaMonkeeWeakness,
  eat,
  familiarWeight,
  haveEffect,
  Item,
  itemAmount,
  Location,
  mallPrice,
  maximize,
  myAdventures,
  myBasestat,
  myDaycount,
  myFamiliar,
  myMaxhp,
  print,
  putCloset,
  restoreHp,
  restoreMp,
  retrieveItem,
  runChoice,
  setAutoAttack,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  weightAdjustment,
} from "kolmafia";
import {
  $effect,
  $element,
  $familiar,
  $item,
  $items,
  $location,
  $phylum,
  $skill,
  $stat,
  adventureMacro,
  get,
  have,
  Macro,
  maximizeCached,
  Mood,
  Snapper,
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

const DAD_COMBAT = new Map();
DAD_COMBAT.set($element`hot`, $skill`Awesome Balls of Fire`);
DAD_COMBAT.set($element`cold`, $skill`Snowclone`);
DAD_COMBAT.set($element`stench`, $skill`Eggsplosion`);
DAD_COMBAT.set($element`sleaze`, $skill`Grease Lightning`);
DAD_COMBAT.set($element`spooky`, $skill`Raise Backup Dancer`);
DAD_COMBAT.set($element`none`, $skill`Shrap`);

function adventure(location: Location, macro: Macro) {
  putCloset($item`sand dollar`, itemAmount($item`sand dollar`));
  restoreHp(myMaxhp());
  restoreMp(50);
  MOOD_BASE.execute();
  ensureLassos(1);
  adventureMacro(location, macro);
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

function haveFreeRuns() {
  return (
    banderReady() ||
    get("_feelHatredUsed") < 3 ||
    get("_snokebombUsed") < 3 ||
    !get("_latteBanishUsed") ||
    get("_latteRefillsUsed") < 3
  );
}

function getFreeRuns(): Macro {
  refillLatteIfNeeded();
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

  gearUp(["-combat"], { freeRun: true });
  ensureLassos(1);
  nonCombat();
  adventure($location`The Marinara Trench`, getFreeRuns());

  if (get("lastEncounter").includes("You've Hit Bottom")) {
    visitUrl("monkeycastle.php?action=grandpastory&topic=grandma");
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
    const tentIndex = parseInt(get("choiceAdventure313")) + 1;
    setChoice(313, tentIndex);
    setChoice(314, tentIndex);
    setChoice(315, tentIndex);
  }

  tryUse(1, $item`Mer-kin stashbox`);
  tryUse(1, $item`Mer-kin trailmap`);
  visitUrl("monkeycastle.php?action=grandpastory&topic=currents");
}

function freeBigBrother() {
  gearUp(["-combat"], { freeRun: true });
  nonCombat();
  adventure($location`The Wreck of the Edgar Fitzsimmons`, getFreeRuns());

  if (get("lastEncounter").includes("Down at the Hatch")) {
    visitUrl("monkeycastle.php?who=2");
  }
}

function freeLittleBrother() {
  gearUp(["meat drop"], {
    freeRun: true,
    freeKill: true,
  });
  ensureLassos(1);
  ensureItem(3, $item`New Age healing crystal`);
  adventure(
    $location`An Octopus's Garden`,
    Macro.if_(`!monstername "Neptune flytrap"`, Macro.step(getFreeRuns())).if_(
      `monstername "Neptune flytrap"`,
      new Macro()
        .trySkill($skill`Transcendent Olfaction`)
        .item($item`sea lasso`)
        .step(getFreeKills())
        .item([$item`New Age healing crystal`, $item`New Age hurting crystal`])
        .repeat()
    )
  );
}

function getSeahorse() {
  retrieveItem($item`sea cowbell`, 3);

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

function setup() {
  if (myAdventures() < 10) {
    eat(10 - myAdventures(), $item`magical sausage`);
  }
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

  setChoice(299, 1); // free Big

  // tent searching
  setChoice(313, 1);
  setChoice(314, 1);
  setChoice(315, 1);

  if (!haveEffect($effect`Fishy`)) {
    use($item`fishy pipe`);
    if (!haveEffect($effect`Fishy`)) throw "Did not get fishy from pipe.";
  }
}

function fightDad() {
  retrieveItem($item`warbear whosit`, 12);
  if (myBasestat($stat`Moxie`) < 150 || myBasestat($stat`Muscle`) < 150) {
    if (
      get("getawayCampsiteUnlocked") &&
      haveEffect($effect`That's Just Cloud-Talk, Man`) === 0
    ) {
      visitUrl("place.php?whichplace=campaway&action=campaway_sky");
    }
    setChoice(1322, 1); // start the party quest
    const moxLower = myBasestat($stat`Moxie`) < myBasestat($stat`Muscle`);
    useFamiliar($familiar`Hovering Sombrero`);
    maximizeCached(
      [
        `${moxLower ? 150 : 100} moxie experience percent`,
        `${moxLower ? 100 : 150} muscle experience percent`,
        "myst",
      ],
      {
        forceEquip: $items`makeshift garbage shirt`,
      }
    );
    useSkill($skill`Get Big`);
    useSkill($skill`Song of Bravado`);
    useSkill($skill`Stevedave's Shanty of Superiority`);
    useSkill($skill`Visit your Favorite Bird`);
    eat($item`magical sausage`);

    while (
      (myBasestat($stat`Moxie`) < 150 || myBasestat($stat`Muscle`) < 150) &&
      get("_neverendingPartyFreeTurns") < 10
    ) {
      adventureMacro(
        $location`The Neverending Party`,
        Macro.trySkill($skill`Feel Pride`)
          .skill($skill`Saucegeyser`)
          .repeat()
      );
    }
  }
  useFamiliar($familiar`Red-Nosed Snapper`);
  maximize(
    `hp, mp, +outfit Clothing of Loathing, +equip old SCUBA tank, +equip ${getFamEquip()}`,
    false
  );
  restoreHp(myMaxhp());
  eat($item`magical sausage`);
  restoreMp(1200);
  setAutoAttack(0);
  visitUrl("sea_merkin.php?action=temple");
  runChoice(1);
  runChoice(1);

  cliExecute("ccs dad_monkee");

  try {
    runChoice(1);
  } catch (e) {
    print("fighting dad");
  }

  let page;
  let round = 1;
  do {
    const skill = DAD_COMBAT.get(dadSeaMonkeeWeakness(round));
    page = visitUrl(`fight.php?action=skill&whichskill=${skill.id}`);
    round++;
  } while (page.includes(`You're fighting Dad Sea Monkee`));
}

const setSnapperTracking = (questStatus: string) => {
  const phylum =
    "unstarted" === questStatus ? $phylum`Plant` : $phylum`Mer-kin`;

  if (Snapper.getTrackedPhylum() !== phylum) {
    Snapper.trackPhylum(phylum);
  }

  return;
};

export function main(): void {
  let stopMsg;
  const advMap: { [key: string]: number } = {};
  setup();

  while (!stopMsg) {
    const startAdventures = myAdventures();
    const status = get("questS02Monkees");
    setSnapperTracking(status);
    switch (status) {
      case "unstarted":
        stopMsg = freeLittleBrother();
        break;
      case "started":
        use($item`wriggling flytrap pellet`);
        visitUrl("monkeycastle.php?who=1");
        break;
      case "step1":
        stopMsg = freeBigBrother();
        break;
      case "step3":
        visitUrl("monkeycastle.php?who=1");
        break;
      case "step4":
        stopMsg = freeGrandpa();
        break;
      case "step6":
      case "step7":
        if (!get("corralUnlocked")) {
          stopMsg = getTrailMap();
        } else if (!get("seahorseName")) {
          stopMsg = getSeahorse();
        } else {
          stopMsg = fightDad();
        }
        break;
    }

    advMap[status] = advMap[status] || 0;
    advMap[status] += startAdventures - myAdventures();

    if (!haveFreeRuns()) {
      stopMsg = "No more free runs.";
    }
    if (!haveEffect($effect`Fishy`)) {
      stopMsg = "Lost fishy effect";
    }
    if (myAdventures() === 0) {
      stopMsg = "No more adventures";
    }
  }

  stopMsg && print(stopMsg, "red");
  print(JSON.stringify(advMap, undefined, 2), "blue");
}

// meat drop, 10 item drop, 240 max, adventure underwater, equip das boot, -equip broken champagne
// meat drop, 10 item drop, 234 max, -item drop penalty, adventure underwater, equip das boot, -equip broken champagne
