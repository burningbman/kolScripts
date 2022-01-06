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
  putCloset,
  equippedItem,
  itemAmount,
  haveEffect,
  useSkill,
  adv1,
  takeCloset,
  outfit,
  maximize,
  availableAmount,
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
} from "kolmafia";

import {
  ensureEffect,
  shrug,
  sausageFightGuaranteed,
  lastAdventureText,
  setClan,
  inSemirareWindow,
  setChoice,
  getEffect,
  myFamiliarWeight,
  grabColdMedicine,
  isDrunk,
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
} from "libram";

const MACRO_KILL = Macro.externalIf(isDrunk(), Macro.attack().repeat())
  // .skill($skill`Curse of Weaksauce`)
  // .skill($skill`Micrometeorite`)
  // .skill($skill`Entangling Noodles`)
  .skill($skill`Saucegeyser`)
  .repeat();
const SR_LOCATIONS = [
  $location`Burnbarrel Blvd.`,
  $location`Exposure Esplanade`,
  $location`The Ancient Hobo Burial Ground`,
  $location`The Purple Light District`,
];

const TRASH_PROP = "_bb_hobo.TrashCount";
const DANCE_PROP = "_bb_hobo.DanceCount";
const TIRE_COUNT = 32;

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
  [Part.boots]: $skill`Spirit of Cayenne`,
  [Part.eyes]: $skill`Spirit of Peppermint`,
  [Part.guts]: $skill`Spirit of Garlic`,
  [Part.skulls]: $skill`Spirit of Wormwood`,
  [Part.crotches]: $skill`Spirit of Bacon Grease`,
  [Part.skins]: $skill`Spirit of Nothing`,
  [Part.none]: $skill`Spirit of Nothing`,
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
    useFamiliar($familiar`Stooper`);
  } else {
    // set snapper to track hobos
    useFamiliar($familiar`Red-Nosed Snapper`);
    if (get("redSnapperPhylum") !== $phylum`hobo`) {
      visitUrl("familiar.php?action=guideme&pwd");
      visitUrl("choice.php?pwd&whichchoice=1396&option=1&cat=hobo");
    }
  }

  equip($item`miniature crystal ball`);
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
  if (myMp() < 100) eat($item`magical sausage`);
  if (myHp() < myMaxhp()) restoreHp(myMaxhp());
};

function fightSausageIfGuaranteed(macro: Macro): void {
  if (sausageFightGuaranteed() && !isDrunk()) {
    print("Fighting a Kramco in the Noob Cave");
    const currentOffhand = equippedItem($slot`off-hand`);
    MACRO_KILL.setAutoAttack();
    equip($item`Kramco Sausage-o-Matic™`);
    adv1($location`Noob Cave`, -1, "");

    //Equip whatever we had here
    equip(currentOffhand);
    macro.setAutoAttack();
  }
}

const equipSneaky = ({ sewers = false, physical = false }): void => {
  let forceEquip = $items`lucky gold ring, mafia thumb ring, Mr. Cheeng's spectacles`;
  let bonusEquip = new Map();

  if (sewers) {
    forceEquip = forceEquip.concat(
      $items`hobo code binder, gatorskin umbrella`
    );
  } else {
    bonusEquip = new Map([[$item`garbage sticker`, 100]]);
  }

  if (isDrunk()) {
    forceEquip.push($item`Drunkula's wineglass`);
  }

  if (physical) {
    if (isDrunk()) {
      forceEquip.push($item`Fourth of May Cosplay Saber`);
    } else {
      forceEquip.push(
        myBasestat($stat`Moxie`) >= 150
          ? $item`Jeans of Loathing`
          : $item`The Ghoul King's ghoulottes`
      );
    }
  }

  maximizeCached(["-combat"], {
    forceEquip,
    bonusEquip,
  });
};

const upkeepDmgWhileDrunk = () => {
  if (isDrunk()) {
    ensureEffect($effect`Carol of the Bulls`);
    ensureEffect($effect`Song of the North`);
    ensureEffect($effect`Frenzied, Bloody`);
  }
};

let USE_BANDER = true;
const getSneakyForHobos = ({ sewers = false, physical = false }): void => {
  if (sewers) {
    if (USE_BANDER) {
      maximizeCached(["familiar weight"], {
        forceEquip: $items`hobo code binder, gatorskin umbrella`,
      });
    }
    if (get("_banderRunaways") >= Math.floor(myFamiliarWeight() / 5)) {
      USE_BANDER = false;
      equipSneaky({ sewers, physical });
    }
  } else {
    equipSneaky({ sewers, physical });
  }

  ensureEffect($effect`Smooth Movements`);
  ensureEffect($effect`The Sonata of Sneakiness`);
  shrug($effect`Carlweather's Cantata of Confrontation`);
  upkeepDmgWhileDrunk();

  if (get("_feelLonelyUsed") < 3) {
    ensureEffect($effect`Feeling Lonely`);
  }
  if (get("_powerfulGloveBatteryPowerUsed") <= 90) {
    ensureEffect($effect`Invisible Avatar`);
  }

  let desiredNonCombat = -26;
  if (sewers) desiredNonCombat++;
  if (physical) desiredNonCombat++;
  if (!USE_BANDER && combatRateModifier() > desiredNonCombat) {
    abort("Not sneaky enough.");
  }
};

const getConfrontationalForHobos = () => {
  equip($item`fiberglass fedora`);
  equip($item`Misty Cloak`);
  equip($slot`shirt`, $item`"Remember the Trees" Shirt`);
  equip($slot`off-hand`, $item`garbage sticker`);
  equip($item`garbage sticker`);
  equip($item`Spelunker's khakis`);
  equip($slot`acc1`, $item`lucky gold ring`);
  equip($slot`acc2`, $item`mafia thumb ring`);
  equip($slot`acc3`, $item`Mr. Cheeng's spectacles`);

  ensureEffect($effect`Musk of the Moose`);
  ensureEffect($effect`Carlweather's Cantata of Confrontation`);
  shrug($effect`The Sonata of Sneakiness`);
  upkeepDmgWhileDrunk();

  if (combatRateModifier() < 25) abort("Not confrontational enough.");
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

function calculateGratesAndValues(): { grates: number; valves: number } {
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
  return (
    !$items`unfortunate dumplings, sewer wad, bottle of Ooze-O, gatorskin umbrella`.some(
      (i) => !retrieveItem(1, i)
    ) && retrieveItem(3, $item`oil of oiliness`)
  );
};

function runSewer() {
  print("Starting sewers.", "green");
  let checkGravesAndValues = true;
  const macro = Macro.step("pickpocket")
    .trySkill($skill`Feel Hatred`)
    .trySkill($skill`Snokebomb`)
    .trySkill($skill`Reflex Hammer`)
    .trySkill($skill`Use the Force`)
    .trySkill($skill`Chest X-Ray`)
    .trySkill($skill`Shattering Punch`)
    .trySkill($skill`Gingerbread Mob Hit`)
    .item($item`peppermint parasol`);

  while (myAdventures() > 10 && !throughSewers()) {
    // boost fam weight for boots
    ensureEffect($effect`Empathy`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Blood Bond`);

    upkeepHpAndMp();
    getSneakyForHobos({ sewers: true });
    fightSausageIfGuaranteed(macro);

    if (!getSewerItems()) throw "Unable to get sewer items";

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
        equip($slot`acc3`, $item`Lil' Doctor™ bag`);
      else if (get("_saberForceUses") < 5)
        equip($item`Fourth of May Cosplay Saber`);
      else if (get("_chestXRayUsed") < 3)
        equip($slot`acc3`, $item`Lil' Doctor™ bag`);
      else {
        retrieveItem($item`peppermint parasol`);
      }
    }

    if (
      get("_banderRunaways") <
      Math.floor(
        (familiarWeight($familiar`Pair of Stomping Boots`) +
          weightAdjustment()) /
          5
      )
    ) {
      useFamiliar($familiar`Pair of Stomping Boots`);
      Macro.trySkill($skill`Release the Boots`)
        .step("runaway")
        .setAutoAttack();
    } else {
      useFamiliar($familiar`Shorter-Order Cook`);
      macro.setAutoAttack();
    }

    HOBO_MOOD.execute();
    adv1($location`A Maze of Sewer Tunnels`, -1, "");
  }

  // const sewerStatus = calculateGratesAndValues();
  // print(
  //   "Valves: " + sewerStatus.valves + " Grates: " + sewerStatus.grates,
  //   "green"
  // );
  print("Through the sewers.", "green");
}

const handleNickels = (location: Location) => {
  // closet nickels if not in SR window or not in good SR drop location
  if (!inSemirareWindow() || !SR_LOCATIONS.includes(location))
    putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
  else if (availableAmount($item`hobo nickel`) < 5)
    takeCloset(5 - availableAmount($item`hobo nickel`), $item`hobo nickel`);
};

function sideZoneLoop(
  location: Location,
  sneaky: boolean,
  macro: Macro,
  callback: () => { done: boolean; macro?: Macro }
) {
  let done = false;
  const upkeepCombat = () => {
    if (location !== $location`Hobopolis Town Square`) {
      const physical = [
        $location`Burnbarrel Blvd.`,
        $location`The Ancient Hobo Burial Ground`,
      ].includes(location);

      if (sneaky) {
        getSneakyForHobos({
          sewers: false,
          physical,
        });
      } else getConfrontationalForHobos();
    }
  };

  macro.setAutoAttack();

  while (!done && myAdventures() !== 0) {
    HOBO_MOOD.execute();
    upkeepCombat();
    upkeepHpAndMp();

    fightSausageIfGuaranteed(macro);
    grabColdMedicine();

    adv1(location, -1, "");

    // handle nickels before callback so TS can uncloset 20 nickels if needed
    handleNickels(location);
    let tempMacro;
    ({ done, macro: tempMacro } = callback());

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
const DEFAULT_ICICLES = 73;
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

  // TODO: update icicles and diverts each loop
  let icicles = getHoboCountsRe(/water pipes \((\d+) turns?\)/gm);
  //   let diverts = getHoboCountsRe(
  //     /cold water out of Exposure Esplanade \((\d+) turns?\)/gm
  //   );
  let diverts = MAX_DIVERTS;

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

  sideZoneLoop($location`Exposure Esplanade`, true, MACRO_KILL, function () {
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

      print("Icicle count: " + icicles + " Diverts: " + diverts, "blue");
    }

    if (
      get("lastEncounter").includes("There Goes Fritz!") &&
      get("choiceAdventure217") === 3
    ) {
      print("Big yodel done.", "blue");
      done = true;
    }

    if (get("lastEncounter").includes("Bumpity Bump Bump")) {
      print("Frosty is up.", "blue");
      done = true;
    }

    return { done };
  });
}

function lastAdventureWasSuccessfulCombat(): boolean {
  return lastAdventureText().includes(myName() + " wins the fight!");
}

function tiresToKills(tires: number): number {
  if (tires === -1) tires = 35;
  return tires * tires * 0.1 + 0.7 * tires;
}

function runBB(onStack = 0, stack1 = 0, stack2 = 0) {
  //TODO: store counts in new property or whatever storage mafia uses.
  setChoice(206, 2); // Getting Tired; Toss the tire on the fire gently
  setChoice(207, 2); // Hot Dog! I Mean... Door!; Leave the door be
  setChoice(213, 2); // Piping Hot; Leave the valve alone
  setChoice(291, 1); // A Tight Squeeze; Buy some squeeze (5 nickels)
  setChoice(201, 2); // Home, Home in the Range; Get out of the kitchen

  let kills = getHoboCountsRe(/defeated\s+Hot\s+hobo\s+x\s+(\d+)/gm);
  let tireCount =
    onStack > 0
      ? onStack
      : getHoboCountsRe(/on the fire \((\d+) turns?\)/gm) % TIRE_COUNT;
  let tirevalanches = getHoboCountsRe(/started ((\d+)) tirevalanch/gm);

  const stackKills: { [key: number]: number } = { 1: 0, 2: 0 };
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
      print(`Tires needed on stack 3: ${tiresNeeded}`, "red");
      changeTireStackPrefIfNeeded();
    }
  };

  calculateThirdTireStack();

  sideZoneLoop($location`Burnbarrel Blvd.`, true, MACRO_KILL, function () {
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
        print("Tires on the stack: " + tireCount, "red");
        changeTireStackPrefIfNeeded();
      }
    }

    if (lastEncounter.includes("Home, Home in the Range")) {
      print("Ol' Scratch is up.");
      done = true;
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

    return { done };
  });

  print(`Done in BB. Tires on the stack: ${tireCount}`, "red");
}

const getNeededPart = (parts: scoboParts, desiredCount: number): Part => {
  let desiredPart = Part.none;
  for (const part of PART_ORDER) {
    if (parts[part] < desiredCount) {
      desiredPart = part;
      break;
    }
  }

  print(
    `Needed part is ${Part[desiredPart]}. Have ${parts[desiredPart]} Need ${desiredCount}`,
    "blue"
  );
  useSkill(partToSkill[desiredPart]);
  return desiredPart;
};

type tsArg = { getFood: boolean; input: string; hoboKills: number | undefined };

const prepForSkins = (skinsLeft: number): Macro => {
  while (haveEffect($effect`Carol of the Bulls`) < skinsLeft) {
    if (myMp() < 130) eat($item`magical sausage`);
    useSkill($skill`Carol of the Bulls`);
    useSkill($skill`Song of the North`);
    useSkill($skill`Blood Frenzy`);
  }

  const forceEquip = $items`lucky gold ring, mafia thumb ring, Mr. Cheeng's spectacles`;
  if (isDrunk()) {
    forceEquip.push($item`Drunkula's wineglass`);
  } else {
    forceEquip.push($item`garbage sticker`);
  }
  maximizeCached(["10 weapon dmg percent", "muscle"], {
    forceEquip,
  });
  return Macro.attack().repeat();
};

const runTS = ({
  getFood = false,
  input = "tuned",
  hoboKills = 36,
}: tsArg): void => {
  let part: Part;
  let stopAfterFood: boolean;
  let macro = Macro.skill($skill`Stuffed Mortar Shell`, $skill`Micrometeorite`);
  let parts = getRichardCounts();
  const getSpecificParts = input !== "untuned";

  if (getFood) print("Looking for food in hobopolis.", "blue");

  if (!getSpecificParts) {
    if (hoboKills)
      print(`Generating random parts for ${hoboKills} turns.`, "blue");
    else print("Generating random parts until out of adventures.", "blue");
  } else print(`Generating up to ${hoboKills} of each hobo part.`, "blue");

  outfit("hobo_ts");

  if (!getSpecificParts) {
    useSkill($skill`Spirit of Nothing`);
  } else if (hoboKills) {
    part = getNeededPart(parts, hoboKills);
    if (part === Part.none) {
      print("Done getting parts", "blue");
      return;
    } else if (part === Part.skins) {
      macro = prepForSkins(hoboKills - parts[part]);
    }
  }

  if (getFood) {
    stopAfterFood = userConfirm("Stop after getting food?");
    takeCloset($item`hobo nickel`, 40);
    equip($item`hobo code binder`);

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
  } else {
    print("Not getting food in hobopolis.", "blue");
    setChoice(272, 2); // Leave the Marketplace
  }

  let hobosKilled = 0;
  sideZoneLoop($location`Hobopolis Town Square`, true, macro, () => {
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
      outfit("hobo_ts");
      if (stopAfterFood) return { done: true };
    }

    if (lastAdventureWasSuccessfulCombat()) {
      hobosKilled++;

      if (getSpecificParts && hoboKills) {
        parts = getRichardCounts();
        const oldPart = part;
        part = getNeededPart(parts, hoboKills);
        if (part === Part.none) {
          print("Done getting parts.", "blue");
          done = true;
        }
        if (part === Part.skins && oldPart !== Part.skins) {
          macro = prepForSkins(hoboKills - parts[part]);
          macro.setAutoAttack();
        }
      } else if (hoboKills) done = hobosKilled >= hoboKills;
    }
    if (getFood) takeCloset($item`hobo nickel`, 20);

    return { done, macro };
  });
};

function prepFrosty() {
  if (get("expressCardUsed")) {
    print("Already used PYEC.", "red");
    return;
  }

  setClan("Alliance From Heck");
  if (stashAmount($item`Platinum Yendorian Express Card`) < 1) {
    print("PYEC not currently available.", "red");
    return;
  }
  takeStash(1, $item`Platinum Yendorian Express Card`);

  const curClan = getClanName();
  setClan("Bonus Adventures from Hell");
  cliExecute("fold wad of used tape");
  equip($item`wad of used tape`); //item
  equip($slot`weapon`, $item`Fourth of May Cosplay Saber`); //item
  equip($slot`offhand`, $item`party whip`); //item
  equip($item`Great Wolf's beastly trousers`); // item
  equip($item`snowpack`); // item
  equip($item`BGE 'cuddly critter' shirt`); // item
  equip($slot`acc1`, $item`Pocket Square of Loathing`); // cold res
  equip($slot`acc2`, $item`Mayor Ghost's sash`); //item
  equip($slot`acc3`, $item`Belt of Loathing`); //item

  useFamiliar($familiar`Jumpsuited Hound Dog`);

  // init (Ol' Scratch)
  ensureEffect($effect`Springy Fusilli`);
  ensureEffect($effect`Song of Slowness`);
  ensureEffect($effect`Resting Beach Face`);

  // passive damage
  ensureEffect($effect`Permanent Halloween`);
  ensureEffect($effect`Boner Battalion`);
  ensureEffect($effect`Feeling Nervous`);
  ensureEffect($effect`Frigidalmatian`);
  ensureEffect($effect`Mathematically Precise`);
  ensureEffect($effect`Bendin' Hell`);

  // combat items
  retrieveItem(40, $item`electronics kit`);

  // hp
  getEffect($effect`Starry-Eyed`);
  ensureEffect($effect`Triple-Sized`);
  getEffect($effect`Lack of Body-Building`);
  ensureEffect($effect`Plump and Chubby`);
  ensureEffect($effect`Blood Bubble`);

  // res
  getEffect($effect`Cold as Nice`);
  ensureEffect($effect`Feeling Peaceful`);
  ensureEffect($effect`Oiled-Up`);
  ensureEffect($effect`Spiro Gyro`);
  ensureEffect($effect`Ancient Protected`);

  // item drop
  cliExecute("synthesize collection");
  ensureEffect($effect`Fat Leon's Phat Loot Lyric`);
  ensureEffect($effect`Disco Leer`);
  ensureEffect($effect`The Spirit of Taking`);
  ensureEffect($effect`Singer's Faithful Ocelot`);
  ensureEffect($effect`Blood Bond`);
  ensureEffect($effect`Leash of Linguini`);
  ensureEffect($effect`Empathy`);
  getEffect($effect`Quadrilled`);
  getEffect($effect`Uncucumbered`);
  getEffect($effect`Do I Know You From Somewhere?`);
  getEffect($effect`Hustlin'`);
  ensureEffect($effect`Bubble Vision`);
  ensureEffect($effect`Polka Face`);
  ensureEffect($effect`Steely-Eyed Squint`);
  // ensureEffect($effect`Robot Friends`);
  // ensureEffect($effect`El Aroma de Salsa`);
  // ensureEffect($effect`Unusual Perspective`);
  // ensureEffect($effect`Blue Tongue`);
  // ensureEffect($effect`Cupcake of Choice`);
  // ensureEffect($effect`Holiday Bliss`);
  // ensureEffect($effect`Heart of Lavender`);
  // ensureEffect($effect`Things Man Was Not Meant to Eat`);

  if (
    myClass() === $class`Pastamancer` &&
    myThrall().skill !== $skill`Bind Spice Ghost`
  ) {
    useSkill($skill`Bind Spice Ghost`);
  }

  restoreHp(1000);

  use($item`Platinum Yendorian Express Card`);
  setClan("Alliance From Heck");
  putStash(1, $item`Platinum Yendorian Express Card`);
  setClan(curClan);
}

const HOBO_MOOD = new Mood();
HOBO_MOOD.skill($skill`Astral Shell`)
  .skill($skill`Get Big`)
  .skill($skill`Blood Bubble`)
  .skill($skill`Elemental Saucesphere`)
  .skill($skill`Feel Excitement`)
  .skill($skill`Rage of the Reindeer`)
  .skill($skill`Stevedave's Shanty of Superiority`)
  .skill($skill`Springy Fusilli`)
  .skill($skill`Blessing of the War Snapper`)
  .skill($skill`Carol of the Hells`);

export function main(input: string): void {
  setAutoAttack(0);
  cliExecute("mood apathetic");
  cliExecute("ccs hobo");
  cliExecute("boombox food");
  cliExecute("mcd 0");
  useSkill($skill`Spirit of Nothing`); // Don't be an idiot
  setFamiliar();
  setChoice(1387, 3); // saber force item drop

  HOBO_MOOD.effect($effect`Plump and Chubby`);

  const actions = input.split(" ");

  if (haveEffect($effect`Blood Bubble`) < 1.04 * myAdventures()) {
    maximize("hp", false);
    useSkill($skill`Cannelloni Cocoon`);

    while (haveEffect($effect`Blood Bubble`) < 1.04 * myAdventures()) {
      useSkill($skill`Blood Bubble`, Math.floor(myHp() / 30) - 1);
      useSkill($skill`Cannelloni Cocoon`);
    }
  }

  switch (actions[0]) {
    case "frosty":
      prepFrosty();
      break;
    case "clan":
      setClan(input.substring("clan ".length));
      break;
    case "sewer":
      set(TRASH_PROP, 0);
      set(DANCE_PROP, 0);
      runSewer();
      break;
    case "ee":
      runEE(actions[1] ? parseInt(actions[1]) : DEFAULT_ICICLES);
      break;
    case "bb": {
      const numTires = actions[1] ? parseInt(actions[1]) : 0;
      const stack1Count = actions[2] ? parseInt(actions[2]) : 0;
      const stack2Count = actions[3] ? parseInt(actions[3]) : 0;
      runBB(numTires, stack1Count, stack2Count);
      break;
    }
    case "ts":
      runTS({
        getFood: actions[1] === "true",
        input: actions[2],
        hoboKills: actions[3] ? parseInt(actions[3]) : undefined,
      });
      break;
    default:
      abort("no option passed");
  }

  setAutoAttack(0);
  if (myAdventures() === 0) print("No more adventures", "red");
  print(`${23 - get("_sausagesEaten")} sausages left today.`, "purple");
  print(
    `${11 - get("_freeBeachWalksUsed")} free beach walks left today`,
    "orangered"
  );
}
