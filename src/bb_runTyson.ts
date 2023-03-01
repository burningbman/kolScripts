import {
  outfit,
  useFamiliar,
  cliExecute,
  myAdventures,
  buy,
  use,
  runChoice,
  visitUrl,
  mallPrice,
  toItem,
  myFullness,
  fullnessLimit,
  myInebriety,
  inebrietyLimit,
  print,
  availableAmount,
  isAccessible,
  getProperty,
  itemAmount,
  abort,
  putShop,
  autosell,
  numericModifier,
  runCombat,
  retrieveItem,
  equip,
  adv1,
  eat,
  restoreMp,
  haveEffect,
  chew,
  shopAmount,
  repriceShop,
} from "kolmafia";
import {
  $familiar,
  $item,
  get,
  $coinmaster,
  set,
  $effect,
  $location,
  $monster,
  Macro,
  $skill,
  have,
} from "libram";
import {
  ensureEffect,
  mapMonster,
  sausageFightGuaranteed,
  setChoice,
  getItemPrice,
} from "./lib";

const GARBO_MPA = 4700;
const MAX_DRUM_MACS = 200;

const runVolcano = (): void => {
  // mallbuy a one-day ticket if needed
  if (availableAmount($item`one-day ticket to That 70s Volcano`) === 0) {
    buy(1, $item`one-day ticket to That 70s Volcano`, 350000);
  }

  // ensure access to That 70s Volcano
  if (!isAccessible($coinmaster`Disco GiftCo`)) {
    if (!availableAmount($item`one-day ticket to That 70s Volcano`)) {
      abort("Don't have a 70s Volcano ticket.");
    }
    use($item`one-day ticket to That 70s Volcano`);
  }

  // get volcoino from WLF bunker
  if (!get("_volcanoItemRedeemed")) {
    visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
    let cheapestCost = 1000000;
    let cheapestOption = -1;
    for (let i = 1; i <= 3; i++) {
      const item = toItem(get("_volcanoItem" + i));
      const itemCost = mallPrice(item);
      const itemCount = parseInt(get(`_volcanoItemCount${i}`));
      const cost = itemCount * itemCost;
      print(`Option ${i}: ${itemCount} ${item.name} @ ${itemCost} ea`);
      if (cost !== 0 && cost < cheapestCost) {
        cheapestCost = cost;
        cheapestOption = i;
      }
    }
    if (cheapestOption !== -1) {
      buy(
        parseInt(get("_volcanoItemCount" + cheapestOption)),
        toItem(get("_volcanoItem" + cheapestOption))
      );
      visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
      runChoice(cheapestOption);
    }
  }

  // get volcoino from tower
  if (!get("_infernoDiscoVisited")) {
    outfit("Smooth Velvet");
    visitUrl("place.php?whichplace=airport_hot&action=airport4_zone1");
    runChoice(7);
  }

  // mine volcano and nightcap
  if (myInebriety() <= inebrietyLimit()) {
    outfit("volcano");
    cliExecute(`minevolcano ${myAdventures()}`);
  }

  // try to buy a one-day ticket with volcoinos
  if (itemAmount($item`Volcoino`) >= 3) {
    buy(
      $coinmaster`Disco GiftCo`,
      1,
      $item`one-day ticket to That 70s Volcano`
    );
  }
};

const getDrumMacMPA = (): number => {
  outfit("drum mac farm");
  const cheeng = 180;
  const thumbMultiplier = 1.05;
  const baseMeat = 120 + 25;

  const meat =
    ((baseMeat * (numericModifier("meat drop") + 100)) / 100) * 3 + cheeng;
  const drumMac = getItemPrice($item`drum machine`);
  const palmFrond = getItemPrice($item`palm frond`);
  const waterLily = getItemPrice($item`carbonated water lily`);

  return Math.floor(
    ((5 * (meat + drumMac + 130 / 6 + (palmFrond + waterLily) / 3)) / 6) *
    thumbMultiplier
  );
};

const getDistensionAndDogHairPills = (): void => {
  if (get("_monstersMapped") < 3) {
    ensureEffect($effect`Transpondent`);
    Macro.skill($skill`Feel Nostalgic`)
      .skill($skill`Feel Envy`)
      .attack()
      .repeat()
      .setAutoAttack();
    mapMonster($location`Domed City of Grimacia`, $monster`whiny survivor`);
    runCombat();
    mapMonster($location`Domed City of Grimacia`, $monster`grizzled survivor`);
    runCombat();
    mapMonster($location`Domed City of Grimacia`, $monster`whiny survivor`);
    runCombat();
  }

  setChoice(536, get("_bb_runTyson_moreDistention", false) ? 1 : 2);
  use(3, $item`Map to Safety Shelter Grimace Prime`);
  setChoice(536, get("_bb_runTyson_moreDistention") ? 2 : 1);
  use(2, $item`Map to Safety Shelter Grimace Prime`);
  set("_bb_runTyson_moreDistention", !get("_bb_runTyson_moreDistention"));
};

const pullDeskBell = (): void => {
  // cargo shorts
  if (!get("_cargoPocketEmptied")) {
    getHallPasses();
    getDistensionAndDogHairPills();
    cliExecute("mom stats");
    const emptiedPocketsPref = getProperty("cargoPocketsEmptied");
    const emptiedPockets = emptiedPocketsPref.split(",");

    for (let i = 1; i <= 666; i++) {
      if (!emptiedPockets.includes(i.toString())) {
        cliExecute(`cargo pick ${i}`);
        break;
      }
    }

    if (!have($item`spice melange`)) {
      buy(1, $item`spice melange`, 275000);
    }

    if (availableAmount($item`Frosty's frosty mug`) < 5) {
      buy(5, $item`Frosty's frosty mug`, 60000);
    }

    if (!have($item`cuppa Voraci tea`)) {
      buy(1, $item`cuppa Voraci tea`, 95000);
    }
  }
};

const getHallPasses = (): void => {
  // only grab more wordquiz if we don't have a day's stock
  if (shopAmount($item`Mer-kin wordquiz`) < 30) {
    if (!have($item`Mer-kin hallpass`)) {
      buy($item`Mer-kin hallpass`, 10, 8000);
    }

    setChoice(401, 2);
    setChoice(705, 4);
    chew($item`sea jelly`);
    outfit("Mer-kin Gladiatorial Gear");
    useFamiliar($familiar`none`);
    equip($item`makeshift SCUBA gear`);
    retrieveItem($item`Mer-kin bunwig`);

    while (have($effect`Fishy`) && have($item`Mer-kin hallpass`)) {
      adv1($location`Mer-kin Elementary School`);
    }

    const price = Math.max(4500, getItemPrice($item`Mer-kin wordquiz`));
    putShop(
      price,
      0,
      availableAmount($item`Mer-kin wordquiz`),
      $item`Mer-kin wordquiz`
    );
  } else {
    repriceShop(
      Math.max(4500, getItemPrice($item`Mer-kin wordquiz`)),
      $item`Mer-kin wordquiz`
    );
  }
};

export function main(args: string): void {
  setChoice(1455, 5);
  args = args || "";
  set("logPreferenceChange", false);
  const drumMacMPA = getDrumMacMPA();
  print(
    `Drum Machine Mall: ${mallPrice(
      $item`drum machine`
    )} Estimated MPA: ${drumMacMPA}`,
    "blue"
  );

  pullDeskBell();

  if (
    args.includes("garbo") ||
    mallPrice($item`drum machine`) < GARBO_MPA ||
    shopAmount($item`drum machine`) > MAX_DRUM_MACS
  ) {
    print("Running garbo", "red");
    set("valueOfAdventure", GARBO_MPA);
    cliExecute("acquire carpe");
    cliExecute("garbo");
    use(
      availableAmount($item`bag of park garbage`),
      $item`bag of park garbage`
    );
  } else {
    set("valueOfAdventure", drumMacMPA);
    print(`Farming drum machines with ${drumMacMPA} MPA`, "green");

    // generate all our turns
    if (myFullness() < fullnessLimit()) {
      useFamiliar($familiar`none`);
      cliExecute("CONSUME ALL");
    }

    if (sausageFightGuaranteed()) {
      equip($item`Kramco Sausage-o-Matic™`);
      equip($item`backup camera`);

      Macro.if_(
        '!monstername "sausage goblin"',
        Macro.skill($skill`Back-Up to your Last Enemy`)
      )
        .skill($skill`Sing Along`)
        .skill($skill`Furious Wallop`)
        .skill($skill`Awesome Balls of Fire`)
        .repeat()
        .setAutoAttack();

      while (get("_backUpUses") < 11) {
        restoreMp(400);
        adv1($location`Noob Cave`);
      }

      eat($item`magical sausage`, 23 - get("_sausagesEaten"));
    }

    if (myFullness() === fullnessLimit()) {
      outfit("drum mac farm");

      if (haveEffect($effect`Merry Smithsness`) < myAdventures()) {
        const numFlaskfull = Math.ceil(myAdventures() / 150);
        retrieveItem($item`Flaskfull of Hollow`, numFlaskfull);
        use(numFlaskfull, $item`Flaskfull of Hollow`);
      }

      set('valueOfAdventure', drumMacMPA);
      let noError = cliExecute('garbo nobarf');
      set('valueOfAdventure', GARBO_MPA);
      noError = noError && cliExecute("bb_drumMacFarm");
      autosell(availableAmount($item`hot date`), $item`hot date`);

      if (!noError) {
        print('Something went wrong', 'red');
        return;
      }
    }
  }


  for (const item of [
    $item`drum machine`,
    $item`carbonated water lily`,
    $item`palm frond`,
    $item`Extrovermectin™`,
    $item`Homebodyl™`,
    $item`11-leaf clover`,
  ]) {
    if (availableAmount(item) > 0) {
      putShop(getItemPrice(item), 0, availableAmount(item), item);
    } else {
      repriceShop(getItemPrice(item), item);
    }
  }
  use(availableAmount($item`Gathered Meat-Clip`), $item`Gathered Meat-Clip`);

  // nightcap if everything was successful
  if (myAdventures() === 0 && myInebriety() <= inebrietyLimit()) {
    useFamiliar($familiar`Stooper`);
    cliExecute("CONSUME ALL; CONSUME NIGHTCAP");
    outfit("Rollover");
  }
  set("logPreferenceChange", true);
}
