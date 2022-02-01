import {
  cliExecute,
  buy,
  use,
  visitUrl,
  useSkill,
  create,
  print,
} from "kolmafia";
import { set, uneffect, $effect, $item, get, $skill, $items } from "libram";
import { setChoice } from "./lib";

export function main(): void {
  set("hpAutoRecovery", 0.8);

  cliExecute("mood default");
  cliExecute("ccs default");
  cliExecute("boombox food");
  cliExecute("refresh all");
  cliExecute("hagnk all");
  cliExecute("acquire bitchin meatcar");
  uneffect($effect`Feeling Lost`);
  buy($item`clockwork maid`, 1, 15000);
  use($item`clockwork maid`);
  visitUrl("peevpee.php?action=smashstone&confirm=on");

  // Create a key lime pie
  if (!get("lockPicked")) {
    const keyIndex = Math.floor(Math.random() * 3) + 1;
    setChoice(1414, keyIndex);
    useSkill($skill`Lock Picking`);
    create(
      $items`Boris's key lime pie, Jarlsberg's key lime pie, Sneaky Pete's key lime pie`[
        keyIndex - 1
      ]
    );
  }

  cliExecute("bb_login");

  if (
    get("_questPartyFairQuest") === "booze" ||
    get("_questPartyFairQuest") === "food"
  ) {
    print("Got a quest from Gerald/ine!", "blue");
  }
}
