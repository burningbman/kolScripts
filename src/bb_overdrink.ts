import {
  adventure,
  cliExecute,
  drink,
  equip,
  myAdventures,
  myDaycount,
  outfit,
  overdrink,
  print,
  printHtml,
  retrieveItem,
  toItem,
  use,
  useFamiliar,
  userConfirm,
} from "kolmafia";
import { $familiar, $item, $location, get, have, set } from "libram";
import { setChoice } from "./lib";
import { bb_pirateRealm } from "./bb_pirateRealm";

export function main(): void {
  if (myAdventures() > 0) {
    throw "Finish running adventures";
  }

  useFamiliar($familiar`Stooper`);
  drink($item`Eye and a Twist`);

  // Free dad sea monkee before overdrinking if almost done
  if (get("seahorseName") && get("merkinQuestPath") !== "done") {
    if (
      userConfirm(
        "Have seahorse but dad hasn't been defeated. Abort to finish sea quest?"
      )
    ) {
      outfit("Cloathing of Loathing");
      equip($item`das boot`);
      return;
    }
  }

  // handle Gerald/ine quest if needed
  const quest = get("_questPartyFairQuest");
  if (quest === "booze" || quest === "food") {
    if (!get("_claraBellUsed")) {
      const partyFairInfo = get("_questPartyFairProgress").split(" ");
      retrieveItem(10, toItem(partyFairInfo[1]));

      setChoice(1324, quest === "food" ? 2 : 3);
      setChoice(1326, 4); // Give Geraldine the snacks
      setChoice(1327, 4); // Give Gerald the booze

      use($item`Clara's bell`);
      adventure(1, $location`The Neverending Party`);
    } else if (userConfirm("Booze/food quest, but no bell. Abort?")) {
      print("Finish NEP quest.", "red");
      return;
    }
  }

  have($item`emergency margarita`)
    ? overdrink($item`emergency margarita`)
    : overdrink($item`vintage smart drink`);

  const pirateResults = bb_pirateRealm();

  if (myDaycount() !== 1) {
    cliExecute("garbo ascend");
    cliExecute("hccs_pre");
  } else {
    cliExecute("bb_logout");
  }

  printHtml(pirateResults);
}

export function bb_overdrink(): void {
  return main();
}
