import {
  useFamiliar,
  getProperty,
  abort,
  visitUrl,
  print,
  equip,
  combatRateModifier,
  myHp,
  restoreHp,
  myName,
  myMp,
  eat,
  retrieveItem,
  myAdventures,
  setAutoAttack,
  cliExecute,
  myMaxhp,
  userConfirm,
  equippedItem,
  haveEffect,
  useSkill,
  adv1,
  takeCloset,
  outfit,
  maximize,
  myBasestat,
  myThrall,
  myClass,
  getClanName,
  familiarWeight,
  weightAdjustment,
  stashAmount,
  takeStash,
  putStash,
  use,
  Location,
  Item,
  mallPrice,
  getClanId,
  bjornifyFamiliar,
  handlingChoice,
  runChoice,
  haveEquipped,
  Slot,
  numericModifier,
  restoreMp,
  myLevel,
  visit,
  count,
  itemAmount,
  myDaycount,
  toClass,
  putCloset,
} from "kolmafia";

import {
  ensureEffect,
  shrug,
  sausageFightGuaranteed,
  lastAdventureText,
  setClan,
  setChoice,
  getEffect,
  myFamiliarWeight,
  grabColdMedicine,
  isDrunk,
  ensureItem,
  waitForStashItems,
  returnItems,
  lastAdventureWasSuccessfulCombat,
  pullIfPossible,
  isGreyYou,
} from "./lib";

import {
  $familiar,
  $location,
  $item,
  $slot,
  $effect,
  Macro,
  $items,
  get,
  $skill,
  set,
  $stat,
  $class,
  maximizeCached,
  $phylum,
  Mood,
  SongBoom,
  Pantogram,
  Modifiers,
  have,
  Clan,
  MaximizeOptions,
  adventureMacro,
  adventureMacroAuto,
  ascend,
  Path,
  Paths,
  Lifestyle,
  $monster,
  uneffect,
  $path,
} from "libram";

import {
  createRiderMode,
  pickRider
} from "libram/dist/resources/2010/CrownOfThrones";
import {
  bb_overdrink
} from "./bb_overdrink";
import {
  getClass, withProperty
} from "libram/dist/property";
import {
  bubbleUp,
  FAM_MOOD,
  HOBO_MOOD
} from "./hobo/mood";
import {
  MACRO_KILL,
  SEWER_MACRO
} from "./hobo/combat";
import { parse } from "path";

const maxCached = (objectives: string[], options ? : Partial < MaximizeOptions > | undefined) => {
  options = options || {};
  options.forceEquip = options.forceEquip || [];
  if (isDrunk()) {
    if (!options.forceEquip.includes($item `Drunkula's wineglass`)) {
      options.forceEquip.push($item `Drunkula's wineglass`);
    }
    options.forceEquip.push(myBasestat($stat `Moxie`) > 150 ? $item `Jeans of Loathing` : $item `The Ghoul King's ghoulottes`);
  }
  maximizeCached(objectives, options);
  have($item `Buddy Bjorn`) && bjornifyFamiliar(bjornFam);
};

const MPA = 6000;
const TRASH_PROP = "_bb_hobo.TrashCount";
const DANCE_PROP = "_bb_hobo.DanceCount";
const TIRE_COUNT = 32;
const getBonusEquip = () => {
  const bonusEquip = new Map();
  bonusEquip.set($item `garbage sticker`, 100);
  bonusEquip.set($item `lucky gold ring`, 255);
  bonusEquip.set($item `Mr. Cheeng's spectacles`, 400);
  bonusEquip.set($item `mafia thumb ring`, MPA * .05);
  bonusEquip.set($item `carnivorous potted plant`, MPA * .04);
  bonusEquip.set($item `pantogram pants`, 100);
  bonusEquip.set($item`June cleaver`, 250);
  bonusEquip.set($item`tiny stillsuit`, 9); // just under familiar weight of amulet coin
  bonusEquip.set($item `designer sweatpants`, get("sweat", 0) < 25 * (3 - get("_sweatOutSomeBoozeUsed", 0)) ? 500 : mallPrice($item `sweat-ade`) / 50 / 2);
  have($item `Buddy Bjorn`) && bonusEquip.set($item `Buddy Bjorn`, pickRider('hobo')?.meatVal());
  have($item `Pantsgiving`) && bonusEquip.set($item `Pantsgiving`, get("_pantsgivingCount") < 50 ? 500 : 0);
  return bonusEquip;
};

let bjornFam = $familiar `Frozen Gravy Fairy`;
const handleBjorn = () => {
  createRiderMode('hobo', () => (0), false, false);
  const bestRider = pickRider('hobo');
  bjornFam = bestRider ? bestRider.familiar : bjornFam;
};

enum Part {
  boots = 1,
    eyes = 2,
    guts = 3,
    skulls = 4,
    crotches = 5,
    skins = 6,
    none = 7,
}

const PART_ORDER = [
  Part.boots,
  Part.eyes,
  Part.guts,
  Part.skulls,
  Part.crotches,
  Part.skins,
];

const partToSkill = {
  [Part.boots]: $skill `Spirit of Cayenne`,
  [Part.eyes]: $skill `Spirit of Peppermint`,
  [Part.guts]: $skill `Spirit of Garlic`,
  [Part.skulls]: $skill `Spirit of Wormwood`,
  [Part.crotches]: $skill `Spirit of Bacon Grease`,
  [Part.skins]: $skill `Spirit of Nothing`,
  [Part.none]: $skill `Spirit of Nothing`,
};

type scoboParts = {
  [Part.boots]: number;
  [Part.eyes]: number;
  [Part.guts]: number;
  [Part.skulls]: number;
  [Part.crotches]: number;
  [Part.skins]: number;
  [Part.none]: number;
};

const setFamiliar = (): void => {
  if (isDrunk()) {
    useFamiliar($familiar `Stooper`);
  } else {
    // set snapper to track hobos
    useFamiliar($familiar `Red-Nosed Snapper`);
    if (get("redSnapperPhylum") !== $phylum `hobo`) {
      visitUrl("familiar.php?action=guideme&pwd");
      visitUrl("choice.php?pwd&whichchoice=1396&option=1&cat=hobo");
    }
  }

  equip($item `miniature crystal ball`);
};

const getRichardCounts = (): scoboParts => {
  const richard = visitUrl(
    "clan_hobopolis.php?place=3&action=talkrichard&whichtalk=3"
  );
  //TODO: account for commas in the number
  const bootsMatch = richard.match(
    "Richard has <b>(\\d+)</b> pairs? of charred hobo"
  );
  const boots = bootsMatch !== null ? parseInt(bootsMatch[1]) : 0;
  const eyesMatch = richard.match(
    "Richard has <b>(\\d+)</b> pairs? of frozen hobo"
  );
  const eyes = eyesMatch !== null ? parseInt(eyesMatch[1]) : 0;
  const gutsMatch = richard.match(
    "Richard has <b>(\\d+)</b> piles? of stinking hobo"
  );
  const guts = gutsMatch !== null ? parseInt(gutsMatch[1]) : 0;
  const skullsMatch = richard.match(
    "Richard has <b>(\\d+)</b> creepy hobo skull"
  );
  const skulls = skullsMatch !== null ? parseInt(skullsMatch[1]) : 0;
  const crotchesMatch = richard.match("Richard has <b>(\\d+)</b> hobo crotch");
  const crotches = crotchesMatch !== null ? parseInt(crotchesMatch[1]) : 0;
  const skinsMatch = richard.match("Richard has <b>(\\d+)</b> hobo skin");
  const skins = skinsMatch !== null ? parseInt(skinsMatch[1]) : 0;

  return {
    [Part.boots]: boots,
    [Part.eyes]: eyes,
    [Part.guts]: guts,
    [Part.skulls]: skulls,
    [Part.crotches]: crotches,
    [Part.skins]: skins,
    [Part.none]: -1,
  };
};

const upkeepHpAndMp = (): void => {
  if (myMp() < 100) {
    if (get('_sausagesEaten', 0) < 23 && !isGreyYou()) {
      eat($item `magical sausage`);
    } else {
      restoreMp(200);
    }
  }
  if (myHp() < myMaxhp()) restoreHp(myMaxhp());
};

function fightSausageIfGuaranteed(macro: Macro): void {
  if (sausageFightGuaranteed() && !isDrunk()) {
    print("Fighting a Kramco in the Noob Cave");
    const currentOffhand = equippedItem($slot `off-hand`);
    MACRO_KILL.setAutoAttack();
    equip($item `Kramco Sausage-o-Matic™`);
    adv1($location `Noob Cave`, -1, "");

    //Equip whatever we had here
    equip(currentOffhand);
    macro.setAutoAttack();
  }
}

const equipSneaky = ({
  sewers = false,
  physical = false
}): void => {
  let forceEquip: Item[] = [];

  const bonusEquip = getBonusEquip();

  if (sewers) {
    bonusEquip.set($item `hobo code binder`, 1000);
    bonusEquip.set($item `gatorskin umbrella`, 1000);
    forceEquip = forceEquip.concat(...$items `hobo code binder, gatorskin umbrella`);
    (have($item `Greatest American Pants`) || haveEquipped($item `Greatest American Pants`)) && forceEquip.push($item `Greatest American Pants`);
  }
  if (physical) {
    if (isDrunk() || myClass() !== $class `Seal Clubber`) {
      forceEquip.push($item `Fourth of May Cosplay Saber`);
    }
  }
  if (isDrunk()) {
    bonusEquip.set($item `Drunkula's wineglass`, 1000);
  }
  maxCached(["-combat 25 min", '.01 mp regen'], {
    forceEquip,
    bonusEquip
  });
};

const upkeepDmgWhileDrunk = () => {
  if (isDrunk()) {
    ensureEffect($effect `Carol of the Bulls`);
    ensureEffect($effect `Song of the North`);
    ensureEffect($effect `Frenzied, Bloody`);
  }
};

let USE_BANDER = true;
const getSneakyForHobos = ({
  sewers = false,
  physical = false
}): void => {

  get('_horsery', '') !== 'dark horse' && cliExecute('horsery -combat');
  shrug($effect `Hippy Stench`);
  if (!isGreyYou()) {
    ensureEffect($effect `Smooth Movements`);
    ensureEffect($effect `The Sonata of Sneakiness`);
    shrug($effect `Carlweather's Cantata of Confrontation`);
  } else {
    ensureEffect($effect `Shifted Phase`);
    ensureEffect($effect `Darkened Photons`);
  }
  upkeepDmgWhileDrunk();

  if (!isGreyYou() && get("_feelLonelyUsed") < 3) {
    ensureEffect($effect `Feeling Lonely`);
  }

  if (sewers) {
    if (USE_BANDER) {
      maxCached(["familiar weight"], {
        forceEquip: $items `hobo code binder, gatorskin umbrella`,
      });
    }
    if (get("_banderRunaways") >= Math.floor((familiarWeight($familiar `Pair of Stomping Boots`) + weightAdjustment()) / 5)) {
      USE_BANDER = false;
      equipSneaky({
        sewers,
        physical
      });
    }
  } else {
    equipSneaky({
      sewers,
      physical
    });
  }

  const desiredMod = isGreyYou() ? -20 : -25;
  if ((!sewers || !USE_BANDER) && combatRateModifier() > desiredMod) {
    throw new Error("Not sneaky enough.");
  }
};

const getConfrontationalForHobos = () => {
  maxCached(['combat'], {
    bonusEquip: getBonusEquip()
  });

  ensureItem(1, $item `sombrero-mounted sparkler`);
  get('_horsery', '') === 'dark horse' && cliExecute('horsery regen');
  ensureEffect($effect `Musk of the Moose`);
  ensureEffect($effect `Carlweather's Cantata of Confrontation`);
  ensureEffect($effect `Hippy Stench`);
  shrug($effect `The Sonata of Sneakiness`);
  upkeepDmgWhileDrunk();

  if (combatRateModifier() < 25) throw new Error("Not confrontational enough.");
};

const getHoboCountsRe = function (regex: RegExp): number {
  const logs = visitUrl("clan_raidlogs.php").replace(
    /a tirevalanch/gm,
    "1 tirevalanch"
  ); //TODO: maybe look for "(x turn"
  let match;
  let total = 0;

  if (regex != null)
    while ((match = regex.exec(logs)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === regex.lastIndex) regex.lastIndex++;
      total += parseInt(match[1]);
    }

  return total;
};

function calculateGratesAndValues(): {
  grates: number;valves: number
} {
  // let grateCount = 0;
  // let valveCount = 0;

  // const raidLogs = visitUrl('clan_raidlogs.php').split('<br>');

  // raidLogs.forEach(function(raidLog: string) {
  //     const grateCheck = raidLog.match(/(grate.*\()(\d*).*/);
  //     if (grateCheck) {
  //         grateCount += parseInt(grateCheck[2]);
  //         return;
  //     }

  //     const valveCheck = raidLog.match(/(level.*\()(\d*).*/);
  //     if (valveCheck) {
  //         valveCount += parseInt(valveCheck[2]);
  //     }
  // });

  return {
    grates: 20,
    valves: 20,
  };
}

function throughSewers() {
  return visitUrl("clan_hobopolis.php").includes("clan_hobopolis.php?place=2");
}

const getSewerItems = () => {
  if (isGreyYou()) return true;
  return (
    !$items `unfortunate dumplings, sewer wad, bottle of Ooze-O, gatorskin umbrella`.some(
      (i) => !retrieveItem(1, i)
    ) && retrieveItem(3, $item `oil of oiliness`)
  );
};

function runSewer() {
  print("Starting sewers.", "green");
  let checkGravesAndValues = true;

  while (myAdventures() > 10 && !throughSewers()) {
    FAM_MOOD.execute();

    fightSausageIfGuaranteed(MACRO_KILL);
    if (!getSewerItems()) throw "Unable to get sewer items";

    upkeepHpAndMp();
    getSneakyForHobos({
      sewers: true
    });

    have($item `gatorskin umbrella`) && equip($item `gatorskin umbrella`, $slot `weapon`);
    equip($item `hobo code binder`);

    if (checkGravesAndValues) {
      const sewerStatus = calculateGratesAndValues();

      setChoice(198, sewerStatus.grates !== 20 ? 3 : 1);
      setChoice(197, sewerStatus.valves !== 20 ? 3 : 1);

      // stop checking grates and valves count each loop once we have 20 of each
      checkGravesAndValues =
        sewerStatus.grates !== 20 && sewerStatus.valves !== 20;
    }

    // setup equipment for banishes and free kills
    if (get("_feelHatredUsed") === 3 && get("_snokebombUsed") === 3) {
      if (get("_reflexHammerUsed") < 3)
        equip($slot `acc3`, $item `Lil' Doctor™ bag`);
      else if (get("_saberForceUses") < 5)
        equip($item `Fourth of May Cosplay Saber`);
      else if (get("_chestXRayUsed") < 3)
        equip($slot `acc3`, $item `Lil' Doctor™ bag`);
    }

    if (
      get("_banderRunaways") <
      Math.floor(
        (familiarWeight($familiar `Pair of Stomping Boots`) +
          weightAdjustment()) /
        5
      )
    ) {
      useFamiliar($familiar `Pair of Stomping Boots`);
      Macro.trySkill($skill `Release the Boots`)
        .step("runaway")
        .setAutoAttack();
    } else {
      useFamiliar($familiar `Shorter-Order Cook`);
      SEWER_MACRO.setAutoAttack();
    }

    HOBO_MOOD.execute();
    adv1($location `A Maze of Sewer Tunnels`, -1, "");
  }

  // const sewerStatus = calculateGratesAndValues();
  // print(
  //   "Valves: " + sewerStatus.valves + " Grates: " + sewerStatus.grates,
  //   "green"
  // );
  print("Through the sewers.", "green");
}

function handleCleaver() {
  if (get("_juneCleaverFightsLeft") <= 0) {
    equip($slot`weapon`, $item`June cleaver`);
    withProperty("recoveryScript", "", () => {
      adventureMacro($location`Noob Cave`, Macro.abort());
      if (["Poetic Justice", "Lost and Found"].includes(get("lastEncounter"))) {
        uneffect($effect`Beaten Up`);
      }
    });
  }
}

function getStopAdventureCount() {
  return isGreyYou() ? 40 : 0;
}

function sideZoneLoop(
  location: Location,
  sneaky: boolean,
  macro: Macro,
  callback: () => {
    done: boolean;macro ? : Macro
  }
) {
  let done = false;
  const upkeepCombat = () => {
    if (location !== $location `Hobopolis Town Square`) {
      const physical = [
        $location `Burnbarrel Blvd.`,
        $location `The Ancient Hobo Burial Ground`,
      ].includes(location);

      if (sneaky) {
        getSneakyForHobos({
          sewers: false,
          physical,
        });
      } else getConfrontationalForHobos();
    }
  };

  while (!done && myAdventures() > getStopAdventureCount()) {
    let attempts = 0;
    while (!HOBO_MOOD.execute() && attempts < 10) {
      HOBO_MOOD.moreMp(100);
      attempts++;
    }
    upkeepCombat();
    upkeepHpAndMp();

    fightSausageIfGuaranteed(macro);
    grabColdMedicine();

    adventureMacroAuto(location, macro);
    putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
    
    handleCleaver();

    let tempMacro;
    ({
      done,
      macro: tempMacro
    } = callback());

    // update the used macro
    if (tempMacro) macro = tempMacro;
  }
}

const isScratchReady = (): boolean => {
  const scratchPage = visitUrl("clan_hobopolis.php?place=4") || "";
  const scratchIndex = scratchPage.match(/burnbarrelblvd(.*)\.gif/);
  return Boolean(scratchIndex && parseInt(scratchIndex[1]) === 10);
};

let _ignoreClosingBB = false;
const ignoreClosingBB = (): boolean => {
  if (_ignoreClosingBB) {
    return _ignoreClosingBB;
  }
  _ignoreClosingBB = userConfirm(
    "Ready for big yodel, but scratch is up. Keep running in EE?"
  );
  return _ignoreClosingBB;
};

const MAX_DIVERTS = 21;
const DEFAULT_ICICLES = 30;

function runEE(totalIcicles = DEFAULT_ICICLES) {
  print(`Running EE going for ${totalIcicles} before yodel`, "blue");
  setChoice(273, 1); // The Frigid Air; Pry open the freezer
  setChoice(217, 1); // There Goes Fritz!; Yodel a little
  setChoice(292, 2); // Cold Comfort; I’ll have the salad. I mean, I’ll leave.
  setChoice(202, 2); // Frosty; Skip adventure

  const scratchReady = isScratchReady();

  const bigYodelDone =
    getHoboCountsRe(
      new RegExp(
        ">" + myName() + " (#d*) yodeled like crazy \\((\\d+) turns?\\)",
        "gm"
      )
    ) > 0;
  if (bigYodelDone) {
    print("Big yodel already done in EE.", "blue");
    return;
  }

  let icicles = getHoboCountsRe(/water pipes \((\d+) turns?\)/gm);
  let diverts = getHoboCountsRe(
    /cold water out of Exposure Esplanade \((\d+) turns?\)/gm
  );

  // Divert if still need any; otherwise make icicles
  setChoice(215, diverts < MAX_DIVERTS ? 2 : 3);

  if (icicles >= totalIcicles) {
    if (!isScratchReady && !ignoreClosingBB()) {
      print("Icicles done. Time to wrap up BB before big yodel.", "cold");
    }
    print("Desired icicle account achieved. Looking for big yodel.", "blue");
    setChoice(217, 3); // There Goes Fritz!; Yodel your heart out
  }

  print(
    `Status - Diverts: ${diverts} Icicles: ${icicles}/${totalIcicles}`,
    "blue"
  );

  sideZoneLoop($location `Exposure Esplanade`, true, MACRO_KILL, function () {
    let done = false;
    if (get("lastEncounter").includes("Piping Cold")) {
      if (get("choiceAdventure215") === 3) {
        // making icicles
        icicles++;
        if (icicles >= totalIcicles) {
          setChoice(217, 3); // big yodel
          if (!scratchReady && !ignoreClosingBB()) {
            print("Icicles done. Time to wrap up BB before big yodel.", "cold");
            done = true;
          }
        }
      } else if (get("choiceAdventure215") === 2) {
        // diverting
        diverts++;
        if (diverts >= MAX_DIVERTS) {
          setChoice(215, 3); // make icicles
        }
      }
    }

    if (
      get("lastEncounter").includes("There Goes Fritz!") &&
      get("choiceAdventure217") === 3
    ) {
      print("Big yodel done.", "blue");
      done = true;
    } else if (get("lastEncounter").includes("Bumpity Bump Bump")) {
      print("Frosty is up.", "blue");
      done = true;
    } else {
      print(`Icicles: ${icicles}/${totalIcicles} Diverts: ${diverts}`, "blue");
    }

    return {
      done
    };
  });
}

function tiresToKills(tires: number): number {
  if (tires === -1) tires = 35;
  return tires * tires * 0.1 + 0.7 * tires;
}

function runBB(onStack = 0, stack1 = 0, stack2 = 0) {
  if (!isGreyYou()) {
    HOBO_MOOD.skill($skill `Silent Hunter`);
    HOBO_MOOD.skill($skill `Cletus's Canticle of Celerity`);
  }
  //TODO: store counts in new property or whatever storage mafia uses.
  setChoice(206, 2); // Getting Tired; Toss the tire on the fire gently
  setChoice(207, 2); // Hot Dog! I Mean... Door!; Leave the door be
  setChoice(213, 2); // Piping Hot; Leave the valve alone
  setChoice(291, 1); // A Tight Squeeze; Buy some squeeze (5 nickels)
  setChoice(201, 2); // Home, Home in the Range; Get out of the kitchen

  let kills = getHoboCountsRe(/defeated\s+Hot\s+hobo\s+x\s+(\d+)/gm);
  let tireCount =
    onStack > 0 ?
    onStack :
    getHoboCountsRe(/on the fire \((\d+) turns?\)/gm) % TIRE_COUNT;
  let tirevalanches = getHoboCountsRe(/started ((\d+)) tirevalanch/gm);

  const stackKills: {
    [key: number]: number
  } = {
    1: 0,
    2: 0
  };
  let tiresToThrow = TIRE_COUNT;

  if (tirevalanches >= 1) {
    stack1 = stack1 || TIRE_COUNT;
    stackKills[1] = tiresToKills(stack1);
  }
  if (tirevalanches > 1) {
    stack2 = stack2 || TIRE_COUNT;
    stackKills[2] = tiresToKills(stack2);
  }

  print(
    `Running BB with ${tireCount} on the stack, ${stack1} in stack 1 and ${stack2} in stack 2`,
    "red"
  );

  if (tireCount >= tiresToThrow) {
    setChoice(206, 1); // Getting Tired; Toss the tire on the fire violently
  }

  const changeTireStackPrefIfNeeded = () => {
    if (tireCount >= tiresToThrow) {
      print("Going to throw violently.", "red");
      setChoice(206, 1); // Getting Tired; Toss the tire on the fire violently
    }
  };

  const calculateThirdTireStack = () => {
    if (stackKills[2] > 0) {
      kills = getHoboCountsRe(/defeated\s+Hot\s+hobo\s+x\s+(\d+)/gm);
      const hobosLeft = 500 - stackKills[2] - stackKills[1] - kills;
      let tiresNeeded = 0;
      while (tiresToKills(tiresNeeded) < hobosLeft) {
        tiresNeeded++;
      }
      tiresToThrow = tiresNeeded;
      changeTireStackPrefIfNeeded();
    }
  };

  calculateThirdTireStack();

  sideZoneLoop($location `Burnbarrel Blvd.`, true, MACRO_KILL, function () {
    let done = false;
    kills = getHoboCountsRe(/defeated\s+Hot\s+hobo\s+x\s+(\d+)/gm);

    const lastEncounter = get("lastEncounter");
    if (lastEncounter.includes("Getting Tired")) {
      if (get("choiceAdventure206") === 1) {
        tirevalanches++;
        stackKills[tirevalanches] = tiresToKills(tireCount);
        setChoice(206, 2); // Getting Tired; Toss the tire on the fire gently
        tireCount = 0;
      } else {
        tireCount++;
        changeTireStackPrefIfNeeded();
      }
    }

    // re-calculate tires needed if last adventure was hobo fought or tire stacking
    if (
      !lastEncounter.includes("Home, Home in the Range") &&
      !lastEncounter.includes("Hot Dog") &&
      !lastEncounter.includes("Piping Hot") &&
      !lastEncounter.includes("A Tight Squeeze")
    ) {
      calculateThirdTireStack();
    }

    if (lastEncounter.includes("Home, Home in the Range")) {
      print("Ol' Scratch is up.");
      done = true;
    } else {
      print(`Stack: ${tirevalanches + 1} Tires: ${tireCount}/${tiresToThrow}`, "red");
    }

    return {
      done
    };
  });

  print(`Done in BB. Tires on the stack: ${tireCount}`, "red");
}

const getNeededPart = (parts: scoboParts, desiredCount: number, noSkins:boolean): Part => {
  let desiredPart;
  if (isDrunk()) {
    if (parts[Part.skins] < desiredCount) {
      desiredPart = Part.skins;
    }
  } else {
    desiredPart = PART_ORDER.find((part, index) => {
      const nextPart = PART_ORDER[index + 1] || Part.skins;
      const numParts = parts[part];

      if (part !== Part.skins) {
        return numParts < desiredCount && (nextPart === Part.skins || numParts <= parts[Part.crotches]);
      }

      return numParts < desiredCount;
    });
  }

  if (!desiredPart || (desiredPart === Part.skins && noSkins)) {
    desiredPart = Part.none;
  }

  print(
    `Needed part is ${Part[desiredPart]}. Have ${parts[desiredPart]} Need ${desiredCount}`,
    "blue"
  );
  useSkill(partToSkill[desiredPart]);
  return desiredPart;
};

type tsArg = {
  getFood: boolean; hoboKills: number | undefined; noSkins: boolean;
};

const prepForSkins = (skinsLeft: number): Macro => {
  while (haveEffect($effect `Carol of the Bulls`) < skinsLeft) {
    if (myMp() < 130 && !isGreyYou()) eat($item `magical sausage`);
    useSkill($skill `Carol of the Bulls`);
    useSkill($skill `Song of the North`);
    useSkill($skill `Blood Frenzy`);
  }

  maxCached(["10 weapon dmg percent", "muscle"]);
  return Macro.attack().repeat();
};

const runTS = ({
  getFood = false,
  hoboKills = 90,
  noSkins = false
}: tsArg): void => {
  let part: Part;
  let stopAfterFood: boolean;
  let macro = Macro.skill($skill `Stuffed Mortar Shell`, $skill `Micrometeorite`);
  let parts = getRichardCounts();

  if (myClass().primestat !== $stat `Mysticality` && !isDrunk()) {
    HOBO_MOOD.skill($skill `Song of Sauce`);
  }

  const getDressed = () => {
    const forceEquip: Item[] = [];
    isDrunk() && forceEquip.push($item `Fourth of May Cosplay Saber`);
    getFood && forceEquip.push($item`hobo code binder`);
    const reqs = getFood ? ['-12 combat'] : [];
    maxCached(reqs.concat(part === Part.skins ? ['weapon dmg percent', '.01 mp regen'] : ['.5 spell dmg percent', '.01 mp regen']), {
      forceEquip,
      bonusEquip: getBonusEquip(),
      preventEquip: $items `carnivorous potted plant` // don't get hobo parts if plant eats them
    });
  };

  if (getFood) print("Looking for food in hobopolis.", "blue");

  print(`Generating up to ${hoboKills} of each hobo par, ${getFood ? '' : 'not'} getting food, ${noSkins ? 'not' : ''} getting skins. `, "blue");

  part = getNeededPart(parts, hoboKills, noSkins);
  if (part === Part.none) {
    print("Done getting parts", "blue");
    return;
  } else if (part === Part.skins) {
    macro = prepForSkins(hoboKills - parts[part]);
  }

  if (getFood) {
    stopAfterFood = userConfirm("Stop after getting food?");
    takeCloset($item `hobo nickel`, 40);
    equip($item `hobo code binder`);

    setChoice(272, 1); // Enter the Marketplace
    setChoice(231, 1); // Hobo Marketplace #1; Food Court
    setChoice(232, 1); // Hobo Marketplace #2; Food Court
    setChoice(233, 1); // Food Court #1; Food
    setChoice(234, 1); // Food Court #2; Food
    setChoice(235, 1); // Food #1; Muscle Food
    setChoice(236, 1); // Food #2; Muscle Food
    setChoice(237, 1); // Muscle Food; Eat it

    setChoice(240, 1); // Food #1; Muscle Booze
    setChoice(241, 1); // Food #2; Muscle Booze
    setChoice(242, 1); // Muscle Booze; Drink it
    setChoice(243, 1); // Muscle Booze; Drink it
  } else {
    print("Not getting food in hobopolis.", "blue");
    setChoice(272, 2); // Leave the Marketplace
  }

  getDressed();

  sideZoneLoop($location `Hobopolis Town Square`, true, macro, () => {
    let done = false;
    if (getProperty("lastEncounter").includes("Big Merv's Protein Shakes")) {
      // Switch to getting booze
      setChoice(233, 2); // Food Court #1; Booze
      setChoice(234, 2); // Food Court #2; Booze
      print("Got food. Looking for booze.", "blue");
    } else if (
      getProperty("lastEncounter").includes(
        "Arthur Finn's World-Record Homebrew Stout"
      )
    ) {
      setChoice(272, 2); // Leave the Marketplace
      print("Got booze. Ignoring marketplace for now.", "blue");
      getFood = false;
      if (stopAfterFood) return {
        done: true
      };
    }

    if (lastAdventureWasSuccessfulCombat()) {
      parts = getRichardCounts();

      if (!lastAdventureText().includes('Richard takes a')) {
        throw new Error('Did not get a part this combat');
      }

      const oldPart = part;
      part = getNeededPart(parts, hoboKills, noSkins);
      if (part === Part.none) {
        print("Done getting parts.", "blue");
        done = true;
      }
      if (part === Part.skins && oldPart !== Part.skins) {
        macro = prepForSkins(hoboKills - parts[part]);
        macro.setAutoAttack();
      }
    }

    getDressed();

    if (getFood) takeCloset($item `hobo nickel`, 20);

    return {
      done,
      macro
    };
  });
};

const bossesReady = () => {
  const esplanade = visitUrl('clan_hobopolis.php?place=5');
  const burnbarrel = visitUrl('clan_hobopolis.php?place=4');
  return esplanade.includes('exposureesplanade10.gif') && burnbarrel.includes('burnbarrelblvd10.gif');
};

const fightBoss = ({
  location,
  macro,
  item,
  choice
}: {
  location: Location,
  macro: Macro,
  item: Item,
  choice: number
}) => {
  upkeepHpAndMp();
  setChoice(choice, 1);
  adventureMacroAuto(location, macro);
  validateBossDrops(item);
  setChoice(choice, 2);
};

function prepFrosty() {
  if (!bossesReady()) {
    throw new Error('Bosses not ready for killing.');
  }

  const curClan = getClanName();
  if (get("expressCardUsed")) {
    throw new Error("Already used PYEC.");
  }

  setClan("Alliance From Heck");
  if (stashAmount($item `Platinum Yendorian Express Card`) < 1) {
    throw new Error("PYEC not currently available.");
  }
  takeStash(1, $item `Platinum Yendorian Express Card`);

  setClan("Bonus Adventures from Hell");

  useFamiliar($familiar `Jumpsuited Hound Dog`);

  maximizeCached(['item drop, all res'], {
    forceEquip: $items `Fourth of May Cosplay Saber`,
    preventEquip: $items `broken champagne bottle`
  });

  // init (Ol' Scratch)
  ensureEffect($effect `Springy Fusilli`);
  ensureEffect($effect `Song of Slowness`);
  ensureEffect($effect `Resting Beach Face`);

  // passive damage
  ensureEffect($effect `Permanent Halloween`);
  ensureEffect($effect `Boner Battalion`);
  ensureEffect($effect `Feeling Nervous`);
  ensureEffect($effect `Frigidalmatian`);
  ensureEffect($effect `Mathematically Precise`);
  ensureEffect($effect `Bendin' Hell`);

  // combat items
  retrieveItem(40, $item `electronics kit`);

  // hp
  getEffect($effect `Starry-Eyed`);
  ensureEffect($effect `Triple-Sized`);
  getEffect($effect `Lack of Body-Building`);
  ensureEffect($effect `Plump and Chubby`);
  ensureEffect($effect `Blood Bubble`);

  // res
  getEffect($effect `Cold as Nice`);
  ensureEffect($effect `Feeling Peaceful`);
  ensureEffect($effect `Oiled-Up`);
  ensureEffect($effect `Spiro Gyro`);
  ensureEffect($effect `Ancient Protected`);

  // item drop
  cliExecute("synthesize collection");
  ensureEffect($effect `Fat Leon's Phat Loot Lyric`);
  ensureEffect($effect `Disco Leer`);
  ensureEffect($effect `The Spirit of Taking`);
  ensureEffect($effect `Singer's Faithful Ocelot`);
  ensureEffect($effect `Blood Bond`);
  ensureEffect($effect `Leash of Linguini`);
  ensureEffect($effect `Empathy`);
  getEffect($effect `Quadrilled`);
  getEffect($effect `Uncucumbered`);
  getEffect($effect `Do I Know You From Somewhere?`);
  getEffect($effect `Hustlin'`);
  // ensureEffect($effect `Bubble Vision`);
  ensureEffect($effect `Polka Face`);
  ensureEffect($effect `Steely-Eyed Squint`);

  if (
    myClass() === $class `Pastamancer` &&
    myThrall().skill !== $skill `Bind Spice Ghost`
  ) {
    useSkill($skill `Bind Spice Ghost`);
  }

  use($item `Platinum Yendorian Express Card`);
  setClan("Alliance From Heck");
  putStash(1, $item `Platinum Yendorian Express Card`);
  setClan(curClan);

  if (numericModifier('Item Drop') < 1000) {
    throw new Error('Did not get 1000 item drop');
  }

  // Frosty
  fightBoss({
    location: $location `Exposure Esplanade`,
    macro: Macro.attack().repeat(),
    item: $item `Frosty's frosty mug`,
    choice: 202
  });
  // Scratch
  fightBoss({
    location: $location `Burnbarrel Blvd.`,
    macro: Macro.item($item `electronics kit`).repeat(),
    item: $item `Ol' Scratch's salad fork`,
    choice: 201
  });
  // Chester
  fightBoss({
    location: $location`The Purple Light District`,
    macro: Macro
      .skill($skill`Curse of Weaksauce`)
      .skill($skill`Micrometeorite`)
      .skill($skill`Entangling Noodles`)
      .skill($skill`Saucegeyser`).repeat(),
    item: $item`extra-greasy slider`,
    choice: 205
  });
  // Oscus
  fightBoss({
    location: $location`The Heap`,
    macro: Macro
      .skill($skill`Curse of Weaksauce`)
      .skill($skill`Micrometeorite`)
      .skill($skill`Entangling Noodles`)
      .skill($skill`Saucegeyser`).repeat(),
    item: $item`jar of fermented pickle juice`,
    choice: 203
  });
  // Zombo
  fightBoss({
    location: $location `The Ancient Hobo Burial Ground`,
    macro: Macro
      .item([$item `electronics kit`, $item `electronics kit`])
      .item([$item `electronics kit`, $item `electronics kit`])
      .attack().repeat(),
    item: $item `voodoo snuff`,
    choice: 204
  });
  // re-equip what Zombo knocked off
  maximizeCached(['item drop, all res'], {
    forceEquip: $items `Fourth of May Cosplay Saber`,
    preventEquip: $items `broken champagne bottle`
  });
}

const validateBossDrops = (item: Item) => {
  if (lastAdventureText().includes(`You acquire an item: ${item.plural} (10)`)) {
    throw new Error(`Did not get 10 ${item}`);
  }
};

const getFromStash = (items: Item[]) => {
  if (isGreyYou()) {
    return [];
  }
  set('bb_forceGarbo', true);
  const clan = getClanId();
  waitForStashItems(items);
  items.forEach((item) => {
    takeStash(item, 1);
  });
  Clan.join(clan);
  return items;
};

const getHoboGearFromStash = (items: Item[]) => {
  !have($item `Buddy Bjorn`) && items.push($item `Buddy Bjorn`);
  get('_pantsgivingCount') < 50 && items.push($item `Pantsgiving`);
  getFromStash(items);
  handleBjorn();
};

function runTheHeap(playingWithOthers = false) {
  set("choiceAdventure214", 1); // You vs. The Volcano; Kick stuff
  set("choiceAdventure295", 1); // Juicy!; Buy
  set("choiceAdventure203", 2); // Deep Enough to Dive; Skip

  if (get(TRASH_PROP, 0) >= 5) {
    set("choiceAdventure216", 1); // The Compostal Service; Be Green
  } else {
    set("choiceAdventure216", 2); // The Compostal Service; Begone'
  }

  if (playingWithOthers) set("choiceAdventure218", 0);
  // I Refuse; abort
  else set("choiceAdventure218", 1); // I Refuse; Explore the junkpile

  print("Starting Heap", "green");

  sideZoneLoop($location `The Heap`, true, MACRO_KILL, function () {
    const lastEncounter = get("lastEncounter");
    const done = lastEncounter.includes("Deep Enough to Dive");
    if (lastEncounter.includes("You vs. The Volcano")) {
      set(TRASH_PROP, get(TRASH_PROP, 0) + 1); //TODO: replace with myName()
      if (get(TRASH_PROP, 0) >= 5) {
        set("choiceAdventure216", 1); // The Compostal Service; Be Green
      }
    } else if (
      get(TRASH_PROP, 0) >= 5 &&
      lastEncounter.includes("The Compostal Service")
    ) {
      set("choiceAdventure216", 2); // The Compostal Service; Begone'
      set(TRASH_PROP, 0);
    } else if (done) {
      print("Oscus is up.", "green");
    }

    return {
      done
    };
  });

  print("Done in Heap", "green");
}

function runPLD(maxFlimFlams = 10) {
  const diverts = getHoboCountsRe(
    /cold water out of Exposure Esplanade \((\d+) turns?\)/gm
  );
  if (diverts < 21) {
    if (!userConfirm("Do AHBG before 21 water diverts?", 10000, false)) return;
  }

  let img = /purplelightdistrict(\d+).gif/.exec(
    visitUrl("clan_hobopolis.php?place=8")
  );
  let flimflams = getHoboCountsRe(/flimflammed some hobos \((\d+) turns?\)/gm);

  if (
    diverts + flimflams >= 21 &&
    img != null &&
    parseInt(img[1]) < 9 &&
    flimflams < maxFlimFlams
  ) {
    print("Starting barfights.", "purple");
    set("choiceAdventure223", 1); // Getting Clubbed; Try to get inside
  } else {
    print("Flimflamming the crowd.", "purple");
    set("choiceAdventure223", 3); // Getting Clubbed; Try to flimflam the crowd
  }

  set("choiceAdventure224", 2); // Exclusive!; Pick several fights
  set("choiceAdventure294", 1); // Maybe It's a Sexy Snake! Take a Chance?
  set("choiceAdventure205", 2); // Don't fight Chester

  sideZoneLoop($location `The Purple Light District`, false, MACRO_KILL, () => {
    const lastEncounter = get("lastEncounter");
    let done = false;

    if (
      lastEncounter.includes("Getting Clubbed") ||
      lastEncounter.includes("Exclusive!")
    ) {
      img = /purplelightdistrict(\d+).gif/.exec(
        visitUrl("clan_hobopolis.php?place=8")
      );

      if (get("choiceAdventure223") === 3) {
        // Flimflamming the crowd
        flimflams++;

        if (flimflams >= maxFlimFlams) {
          print("Switching to barfights.", "purple");
          set("choiceAdventure223", 1); // Getting Clubbed; Try to get inside
        }
      } else if (
        get("choiceAdventure223") === 1 &&
        flimflams < maxFlimFlams &&
        img != null &&
        parseInt(img[1]) >= 9
      ) {
        print("Switching to get flimflams.", "purple");
        set("choiceAdventure223", 3); // Getting Clubbed; Try to flimflam the crowd
      }
    } else if (lastEncounter.match(/Van, Damn/)) {
      print("Chester is up.", "purple");
      done = true;
    }

    return {
      done
    };
  });

  print(
    `Done in PLD. At ${getHoboCountsRe(
      /flimflammed some hobos \((\d+) turns?\)/gm
    )} flimflams.`,
    "purple"
  );
}

function runAHBG(danceCount = 0) {
  set("choiceAdventure208", 2); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
  set("choiceAdventure220", 2); // Returning to the Tomb; Disturb not ye these bones
  set("choiceAdventure293", 2); // Flowers for You; Flee this creepy scene
  set("choiceAdventure221", 1); // A Chiller Night (1); Study the hobos' dance moves
  set("choiceAdventure222", 1); // A Chiller Night (2); Dance with them
  set("choiceAdventure204", 2); // Skip adventure when Zombo is up

  // if danceCount not passed, check the property
  if (danceCount === 0) {
    danceCount = get(DANCE_PROP, 0);
  }

  if (danceCount >= 5) {
    set("choiceAdventure208", 1); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
  }

  const upkeepWeaponDamage = () => {
    if (isGreyYou()) return;
    if (myMp() < 130) eat($item `magical sausage`);
    ensureEffect($effect `Carol of the Bulls`);
    ensureEffect($effect `Song of the North`);
  };

  upkeepWeaponDamage();

  sideZoneLoop(
    $location `The Ancient Hobo Burial Ground`,
    true,
    Macro.attack().repeat(),
    function () {
      let done = false;
      const lastEncounter = get("lastEncounter");
      if (lastEncounter.includes("A Chiller Night")) {
        danceCount++;
        if (danceCount >= 5) {
          set("choiceAdventure208", 1); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
        }
      } else if (
        danceCount >= 5 &&
        lastEncounter.includes("Ah, So That's Where They've All Gone")
      ) {
        set("choiceAdventure208", 2); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
        danceCount = 0;
      } else if (lastEncounter.includes("Welcome To You!")) {
        print("Zombo is up", "blue");
        done = true;
      }

      set(DANCE_PROP, danceCount);

      if (!done) {
        upkeepWeaponDamage();
      }

      return {
        done
      };
    }
  );
  print("Done in AHBG", "blue");
}

function parseArgs(args: string): { getFood: boolean, hoboKills: number, noSkins: boolean } {
  const hoboKills = args.match(/(\d+)/);
  return {
    getFood: args.includes('food'),
    hoboKills: hoboKills ? parseInt(hoboKills[1]) : 0,
    noSkins: args.includes('noskin')
      };
}

function runOption(actions: string[], stashItems: Item[]) {
  switch (actions[0]) {
    case "frosty":
      prepFrosty();
      break;
    case "clan":
      setClan(actions[1]);
      break;
    case "sewer":
      stashItems = getFromStash($items`Greatest American Pants`);
      set(TRASH_PROP, 0);
      set(DANCE_PROP, 0);
      runSewer();
      break;
    case "ee":
      // TODO: check for not doing big yodel close to end of ascension
      getHoboGearFromStash(stashItems);
      runEE(actions[1] ? parseInt(actions[1]) : DEFAULT_ICICLES);
      break;
    case "bb": {
      getHoboGearFromStash(stashItems);
      const numTires = actions[1] ? parseInt(actions[1]) : 0;
      const stack1Count = actions[2] ? parseInt(actions[2]) : 0;
      const stack2Count = actions[3] ? parseInt(actions[3]) : 0;
      runBB(numTires, stack1Count, stack2Count);
      break;
    }
    case 'heap':
      getHoboGearFromStash(stashItems);
      runTheHeap();
      break;
    case 'pld':
      getHoboGearFromStash(stashItems);
      runPLD();
      break;
    case 'ahbg':
      getHoboGearFromStash(stashItems);
      runAHBG();
      break;
    case "ts":
      getHoboGearFromStash(stashItems);
      runTS(parseArgs(actions.join(' ')));
      break;
    case 'garbo':
      set('valueOfAdventure', 6500);
      // waitForStashItems();
      cliExecute('garbo nobarf ascend');
      break;
    case 'overdrink':
      bb_overdrink('hobo');
      break;
    case 'scobo': {
      const scobos = actions[1] ? parseInt(actions[1]) : 36;
      visitUrl(`/clan_hobopolis.php?preaction=simulacrum&place=3&qty=${scobos}`, true);
      break;
    }
    case 'ascend': {
      if (!isDrunk()) {
        throw new Error('Not drunk. Not ready to ascend.');
      }
      cliExecute('hccs_pre');
      if (myDaycount() === 2) {
        if (userConfirm('Ascend into CS?')) {
          ascend($path`Community Service`, $class`Pastamancer`, Lifestyle.normal, 'blender', $item`astral six-pack`, $item`astral trousers`);
          cliExecute('hccs');
        } else {
          ascend($path`Grey You`, toClass('Grey Goo'), Lifestyle.softcore, 'blender');
          // Clear intro adventure
          set("choiceAdventure1464", 1);
          if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
            runChoice(-1);
          pullIfPossible(1, $item`lucky gold ring`, 0);
          pullIfPossible(1, $item`mafia thumb ring`, 0);
          pullIfPossible(1, $item`Mr. Cheeng's spectacles`, 0);
          pullIfPossible(1, $item`carnivorous potted plant`, 0);
          pullIfPossible(1, $item`ten-leaf clover`, 25000);
          pullIfPossible(1, $item`hobo code binder`, 0);
          Clan.join('Bonus Adventures from Hell');
          cliExecute('loopgyou');
          print('Ready for some goo hobo action.');
        }
      } else {
        ascend($path`none`, $class`Seal Clubber`, Lifestyle.casual, 'platypus', $item`astral six-pack`,);
      }
      break;
    }
    default:
      throw new Error("no option passed");
  }
}

function adventurePrep() {
  Clan.join('Freeland');
  setAutoAttack(0);
  cliExecute("mood apathetic");
  cliExecute("ccs hobo");
  SongBoom.setSong('Food Vibrations');
  cliExecute("mcd 0");
  !isGreyYou() && useSkill($skill`Spirit of Nothing`); // Don't be an idiot
  setFamiliar();
  setChoice(1387, 3); // saber force item drop

  isDrunk() && HOBO_MOOD.effect($effect`Plump and Chubby`);

  if (!Pantogram.havePants()) {
    ensureItem(1, $item`bubblin' crude`);
    ensureItem(1, $item`ten-leaf clover`);
    if (!Pantogram.makePants('Muscle', 'Hot Resistance: 2', 'MP Regen Max: 15', 'Drops Items: true', 'Spell Damage Percent: 20')) {
      throw new Error('Failed making pantogram pants');
    }
  }

  bubbleUp();
}

export function main(input: string): void {
  if (['Alliance From Heck', 'Bonus Adventures from Hell'].includes(getClanName())) {
    print(`Currently in ${getClanName()}. That is a problem.`, 'red');
    return;
  }
  const stashItems: Item[] = [];
  const actions = input.split(" ");
  try {

    if (['clan', 'garbo', 'overdrink', 'ascend'].includes(input[0])) {
      adventurePrep();
    }

    runOption(actions, stashItems);

    setAutoAttack(0);
    if (myAdventures() === 0) print("No more adventures", "red");
    print(`${23 - get("_sausagesEaten")} sausages left today.`, "purple");
    print(
      `${11 - get("_freeBeachWalksUsed")} free beach walks left today`,
      "orangered"
    );
  } catch (e) {
    let msg = e;
    if (e instanceof Error) {
      msg = e.message;
    }
    print(`${msg}. Aborting.`, 'red');
  } finally {
    if (handlingChoice()) {
      runChoice(-1);
    }
    if (stashItems.length) {
      Slot.all().forEach((slot) => {
        stashItems.includes(equippedItem(slot)) && equip(slot, $item `none`);
      });
      returnItems(stashItems);
    }
  }
}