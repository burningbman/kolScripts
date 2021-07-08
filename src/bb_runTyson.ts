import {
  outfit,
  useFamiliar,
  cliExecute,
  myAdventures,
  buy,
  use,
} from "kolmafia";
import { main as stashPvp } from "./bb_stashStealable";
import { $familiar, $item } from "libram";

export function main() {
  useFamiliar($familiar`Stooper`);

  outfit("volcano");
  stashPvp();

  cliExecute("CONSUME ALL");
  buy(1, $item`one-day ticket to That 70s Volcano`, 350000);
  use($item`one-day ticket to That 70s Volcano`);
  cliExecute(`minevolcano ${myAdventures()}`);

  outfit("Rollover");
  stashPvp();

  cliExecute("CONSUME NIGHTCAP");
}
