import { get, $item, have, $skill, Macro } from "libram";
import {
  use,
  visitUrl,
  runChoice,
  cliExecute,
  wait,
  isUnrestricted,
  setAutoAttack,
  myName,
  useSkill,
  haveEquipped,
  equip,
  getCampground,
} from "kolmafia";
import { setClan } from "./lib";

export function main(): void {
  visitUrl("hermit.php");

  if (myName().toLowerCase() !== "burningbman") {
    return;
  }

  if (!get("_universalSeasoningUsed") && have($item`Universal Seasoning`)) {
    use($item`Universal Seasoning`);
    use($item`Universal Seasoning`);
  }

  haveEquipped($item`June cleaver`) && equip($item`Fourth of May Cosplay Saber`);

  if (
    !get("_glitchItemImplemented") &&
    have($item`[glitch season reward name]`)
  ) {
    use($item`[glitch season reward name]`);
  }

  useSkill($skill`Feel Disappointed`, 3);

  // Fortune Teller
  if (
    isUnrestricted($item`Clan Carnival Game`) &&
    get("_clanFortuneConsultUses") < 3
  ) {
    setClan("Bonus Adventures from Hell");
    for (let i = get("_clanFortuneConsultUses"); i < 3; i++) {
      cliExecute("fortune cheesefax");
      wait(5);
    }
  }

  if (getCampground()[$item`packet of rock seeds`.name]) {
    visitUrl('campground.php?action=r1garden');
    visitUrl('campground.php?action=r2garden');
    visitUrl('campground.php?action=r3garden');
  }

  if (get("kingLiberated")) {
    // Saber Fam Weight upgrade
    if (get("_saberMod") === 0) {
      visitUrl("main.php?action=may4");
      runChoice(4);
    }

    // Cargo Shorts
    if (!get("_cargoPocketEmptied")) {
      cliExecute('gausie_cargo');
    }

    // Boxing Daycare
    if (get("_daycareGymScavenges") === 0) {
      visitUrl(
        "place.php?whichplace=town_wrong&action=townwrong_boxingdaycare"
      );
      const choices = [
        3, // enter daycare
        2, // scavenge
        1, // recruit toddlers
        4, // spar
        5, // return to lobby
        4, // leave daycare
      ];
      choices.forEach((c) => runChoice(c));
    }
  }

  try {
    if (!get("breakfastCompleted")) {
      Macro.skill($skill`Saucestorm`).repeat().setAutoAttack();
      cliExecute("breakfast");
    }
  } finally {
    setAutoAttack(0);
  }
}
