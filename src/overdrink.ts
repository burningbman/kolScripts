import {
  adventure,
  cliExecute,
  drink,
  equip,
  myAdventures,
  myDaycount,
  outfit,
  print,
  retrieveItem,
  toItem,
  use,
  useFamiliar,
  userConfirm,
} from "kolmafia";
import { $familiar, $item, $location, get, have, set } from "libram";
import { setChoice } from "./lib";

export function main(): void {
  if (myAdventures() > 0) {
    print("Finish running adventures", "red");
    return;
  }

  set("protectAgainstOverdrink", false);
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
    ? drink($item`emergency margarita`)
    : drink($item`vintage smart drink`);

  set("protectAgainstOverdrink", true);

  cliExecute("bb_piraterealm");

  if (myDaycount() !== 1) {
    cliExecute("garbo ascend");
    cliExecute("hccs_pre");
  } else {
    cliExecute("bb_logout");
  }
}
