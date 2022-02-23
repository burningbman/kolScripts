import {
  useFamiliar,
  outfit,
  abort,
  visitUrl,
  retrieveItem,
  haveEffect,
  use,
  adventure,
  itemDropModifier,
  myAdventures,
  isBanished,
  equip,
  adv1,
  setAutoAttack,
  runChoice,
  myName,
  cliExecute,
  buy,
  turnsPlayed,
  print,
} from "kolmafia";
import {
  $familiar,
  $item,
  $effect,
  $location,
  $skill,
  get,
  Macro,
  $monster,
  $slot,
  set,
  have,
  maximizeCached,
} from "libram";
import {
  ensureEffect,
  fightSausageIfGuaranteed,
  grabColdMedicine,
} from "./lib";

function gearUp(): boolean {
  if (!have($item`amulet coin`)) {
    buy(1, $item`box of Familiar Jacks`, 10000);
    useFamiliar($familiar`Cornbeefadon`);
    use($item`box of Familiar Jacks`);
  }

  useFamiliar($familiar`Jumpsuited Hound Dog`);
  equip($slot`familiar`, $item`amulet coin`);
  // let bonusEquip = new Map<Item, number>();
  // bonusEquip.set($item`lucky gold ring`, 500);
  // bonusEquip.set($item`Mr. Cheeng's spectacles`, 400);
  // bonusEquip.set($item`mafia pointer finger ring`, 400);
  // maximizeCached(['item drop 135 min'], {
  //   bonusEquip,
    
  // })
  return outfit("drum mac farm");
}

function validateIceHouseBanish() {
  const monster = visitUrl("museum.php?action=icehouse").match(
    /perfectly-preserved (.*),/
  );
  return monster && monster[1];
}

function upkeepBuffs() {
  ensureEffect($effect`Polka of Plenty`, 1);
  ensureEffect($effect`Singer's Faithful Ocelot`, 1);
}

export function main(): void {
  cliExecute("boombox meat");
  retrieveItem($item`dromedary drinking helmet`, 1);
  retrieveItem($item`ice house`, 1);

  if (!gearUp()) {
    abort("Could not equip outfit.");
  }

  const iceHouseMonster = validateIceHouseBanish();
  if (iceHouseMonster !== "swarm of scarab beatles") {
    visitUrl("museum.php?action=icehouse");
    runChoice(2);
  }

  if (!retrieveItem($item`human musk`)) {
    abort("Could not get human musk");
  }

  set("cloverProtectActive", false);

  Macro.step("pickpocket")
    .if_('monstername "oasis monster"', Macro.item($item`human musk`).abort())
    .if_(
      'monstername "swarm of scarab beatles"',
      Macro.item($item`ice house`).abort()
    )
    .if_(
      'monstername "rolling stone"',
      Macro.trySkill($skill`Feel Hatred`)
        .trySkill($skill`Snokebomb`)
        .trySkill($skill`Show them your ring`)
        .trySkill($skill`Reflex Hammer`)
        .trySkill($skill`Batter Up!`)
        .item($item`Daily Affirmation: Be a Mind Master`)
        .abort()
    )
    .if_(
      'monstername "sausage goblin"',
      Macro.skill($skill`Sing Along`)
        .trySkill($skill`Furious Wallop`)
        .skill($skill`Awesome Balls of Fire`)
        .repeat()
    )
    .if_(
      'monstername "blur"',
      Macro.skill($skill`Sing Along`)
        .trySkill($skill`%fn, spit on them!`)
        .trySkill($skill`Bowl Straight Up`)
        .trySkill($skill`Furious Wallop`)
        .skill($skill`Saucestorm`)
    )
    .setAutoAttack();

  while (myAdventures() > 0) {
    fightSausageIfGuaranteed();
    grabColdMedicine();

    if (!retrieveItem($item`Daily Affirmation: Be a Mind Master`)) {
      abort("Could not get Daily Affirmation: Be a Mind Master");
    }

    upkeepBuffs();
    gearUp();

    if (itemDropModifier() < 234) {
      abort("Not enough item drop to guarantee drum machines.");
    }

    if (
      myName().toLowerCase() === "burningbman" &&
      !isBanished($monster`rolling stone`)
    ) {
      if (
        get("_feelHatredUsed") === 3 &&
        get("_snokebombUsed") === 3 &&
        get("_saberForceUses") === 5
      ) {
        // equip mafia ring
        if (!get("_mafiaMiddleFingerRingUsed")) {
          equip($slot`acc1`, $item`mafia middle finger ring`);
        }
        // equip doctor bag
        else if (get("_reflexHammerUsed") < 3) {
          equip($slot`acc1`, $item`Lil' Doctor™ bag`);
        }
      }
    }
    adv1($location`The Oasis`, -1, "");
  }

  setAutoAttack(0);
  set("cloverProtectActive", true);
}
