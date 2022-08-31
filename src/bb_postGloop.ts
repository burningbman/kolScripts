import {
  chew,
  choiceFollowsFight,
  cliExecute,
  Effect,
  equip,
  Familiar,
  inMultiFight,
  Item,
  Location,
  maximize,
  myClass,
  myLevel,
  restoreHp,
  runChoice,
  runCombat,
  setLocation,
  Slot,
  Stat,
  sweetSynthesis,
  use,
  useFamiliar,
  visitUrl
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  $slot,
  $stat,
  adventureMacro,
  ensureEffect,
  get,
  Macro,
  maximizeCached
} from "libram";
import {
  setChoice
} from "./lib";

const SHOWER: Map<Stat, string> = new Map();
SHOWER.set($stat`muscle`, 'warm');
SHOWER.set($stat`moxie`, 'cool');
SHOWER.set($stat`mysticality`, 'lukewarm');

const ROE_SPLEEN: Map<Stat, Item> = new Map();
ROE_SPLEEN.set($stat`muscle`, $item`vial of humanoid growth hormone`);
ROE_SPLEEN.set($stat`moxie`, $item`Shantix™`);
ROE_SPLEEN.set($stat`mysticality`, $item`non-Euclidean angle`);

const ABSTRACTION: Map<Stat, Item> = new Map();
ABSTRACTION.set($stat`muscle`, $item`abstraction: purpose`);
ABSTRACTION.set($stat`moxie`, $item`abstraction: perception`);
ABSTRACTION.set($stat`mysticality`, $item`abstraction: category`);

const SYNTH: Map<Stat, Effect> = new Map();
SYNTH.set($stat`muscle`, $effect`Synthesis: Movement`);
SYNTH.set($stat`moxie`, $effect`Synthesis: Style`);
SYNTH.set($stat`mysticality`, $effect`Synthesis: Learning`);

const stat = myClass().primestat;

function multiFightAutoAttack(): void {
  while (choiceFollowsFight() || inMultiFight()) {
    visitUrl("choice.php");
  }
}

function fightGodLob() {
  visitUrl("main.php?fightgodlobster=1");
  runCombat(Macro.trySkill($skill`Curse of Weaksauce`)
    .trySkill($skill`Entangling Noodles`)
    .skill($skill`Saucestorm`)
    .repeat().toString);
  multiFightAutoAttack();
  runChoice(-1);
}

function godLob() {
  useFamiliar($familiar`God Lobster`);
  setChoice(1310, 1);
  fightGodLob();
  equip($slot`familiar`, $item`God Lobster's Scepter`);
  fightGodLob();
  equip($slot`familiar`, $item`God Lobster's Ring`);
  setChoice(1310, 2);
  fightGodLob();
}

function setupNEP() {
  // Neverending Party
  if (get("_questPartyFair") === "unstarted") {
    setChoice(1322, 0);
    visitUrl("adventure.php?snarfblat=528");
    if (get("_questPartyFairQuest") === "food") {
      runChoice(1);
      setChoice(1324, 2);
      setChoice(1326, 3);
    } else if (get("_questPartyFairQuest") === "booze") {
      runChoice(1);
      setChoice(1324, 3);
      setChoice(1327, 3);
    } else {
      runChoice(2);
      setChoice(1324, 5);
    }
  }
}

export function main() {
  if (myLevel() < 10) {
    cliExecute(`daycare ${stat.toString().toLowerCase()}`);

    ensureEffect($effect`Stuck That Way`);
    visitUrl("place.php?whichplace=campaway&action=campaway_sky");
    cliExecute(`shower ${SHOWER.get(stat)}`);
    stat === $stat`Mysticality` && ensureEffect($effect`Inscrutable Gaze`);

    use(3, $item`mojo filter`);
    chew(ROE_SPLEEN.get(stat) || $item`none`);
    chew(ABSTRACTION.get(stat) || $item`none`);
    sweetSynthesis(SYNTH.get(stat) || $effect`none`);

    cliExecute(`bastille mainstat`);
    use($item`chest of the Bonerdagon`);
    cliExecute('leaflet');
    // this.doGuiltySprout(); // 1.8k substats

    ensureEffect($effect`Favored by Lyle`);
    ensureEffect($effect`Starry-Eyed`);
    ensureEffect($effect`Feeling Excited`);
    ensureEffect($effect`Blood Bubble`);
  }

  cliExecute("fold garbage shirt");
  maximizeCached([`20 ${stat} experience percent`, `${stat}`], {
    forceEquip: $items`makeshift garbage shirt`
  });

  godLob();
  useFamiliar($familiar`Artistic Goth Kid`);
  setupNEP();

  while (!get('_firedJokestersGun')) {
    const forceEquip = get('_shatteringPunchUsed', 0) === 3 &&
      get('_gingerbreadMobHitUsed', false) &&
      get('_chestXRayUsed', 0) < 3 ? [$item`Lil' Doctor™ bag`] : [];
    get('_chestXRayUsed', 0) === 3 && !get('_firedJokestersGun', false) && forceEquip.push($item`The Jokester's gun`);
    maximizeCached([`20 ${stat} experience percent`, `${stat}`], {
      forceEquip: forceEquip.concat($items`makeshift garbage shirt`)
    });
    restoreHp(400);
    adventureMacro(
      $location`The Neverending Party`,
      Macro.externalIf(
        get("_neverendingPartyFreeTurns") > 0, // make sure bowling sideways before feel pride
        Macro.trySkill($skill`Feel Pride`)
      ).externalIf(get("_neverendingPartyFreeTurns", 0) === 10,
        Macro.trySkill($skill`Shattering Punch`)
          .trySkill($skill`Gingerbread Mob Hit`)
          .trySkill($skill`Chest X-Ray`)
          .trySkill($skill`Fire the Jokester's Gun`), Macro.skill($skill`Curse of Weaksauce`)
            .skill($skill`Micrometeorite`)
            .trySkill($skill`Bowl Sideways`)
            .attack())
    );
    if (
      get("lastEncounter").includes("Gone Kitchin") ||
      get("lastEncounter").includes("Forward to the Back")
    ) {
      setChoice(1324, 5);
    }
  }
}