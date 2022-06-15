import {
  cliExecute,
  inebrietyLimit,
  Item,
  myAdventures,
  myDaycount,
  myInebriety,
  myMeat,
  print,
  putStash,
  refreshStash,
  stashAmount,
  takeStash,
  waitq,
} from "kolmafia";
import {
  $class,
  $item,
  $items,
  $skill,
  ascend,
  Clan,
  get,
  have,
  Lifestyle,
  Paths,
  Session,
  set
} from "libram";
import {
  bb_overdrink
} from "./bb_overdrink";
import {
  printLoopSession
} from "./session";

const DELAY = 120;

const notOverdrunk = () => {
  return myInebriety() < inebrietyLimit() ||
    (myInebriety() === inebrietyLimit() && myAdventures() > 0);
};

const logSession = (leg: string, fun: number, print ? : boolean) => {
  const session = Session.current();
  session.register($item `PirateRealm fun-a-log`, fun);
  session.toFile(`bb_session_${leg}.json`);
  print && printLoopSession(session, leg);
  return session;
};

const waitForItems = (items = $items `Pantsgiving, haiku katana, Buddy Bjorn, origami pasties, repaid diaper`) => {
  Clan.join("Alliance from Heck");
  refreshStash();
  const needed: Item[] = [];

  items.forEach(function (item) {
    if (!stashAmount(item)) {
      needed.push(item);
    }
  });

  if (get('bb_forceGarbo', false)) needed.splice(0, needed.length);
  return needed;
};

const waitForStashItems = (items ? : Item[]) => {
  let neededItems = waitForItems(items);
  while (neededItems.length) {
    const now = new Date(Date.now());
    print(
      `${now.getHours()}:${now.getMinutes()}: Missing ${neededItems}. Waiting ${DELAY} secs`,
      "red"
    );
    waitq(DELAY);
    neededItems = waitForItems();
  }
  set('bb_forceGarbo', false);
};

const runCommunityService = () => {
  let fun = 0;
  if (!get("kingLiberated")) cliExecute("hccs");
  if (!get("kingLiberated")) return;
  // if (!get("_fishyPipeUsed")) bb_sea();
  if (
    myInebriety() < inebrietyLimit() ||
    (myInebriety() === inebrietyLimit() && myAdventures() > 0)
  ) {
    waitForStashItems();
    cliExecute("garbo ascend");
  }
  if (myAdventures() === 0) {
    fun = bb_overdrink();
    cliExecute("garbo ascend");
    cliExecute("hccs_pre");
  }

  logSession('cs', fun);

  if (myAdventures() === 0 && myInebriety() > inebrietyLimit()) {
    ascend(Paths.Unrestricted, $class `Seal Clubber`, Lifestyle.casual, 'platypus', $item `astral six-pack`, $item `astral trousers`);
    runCasual();
  }
};

const storeLog = () => {
  Session.current().toFile("bb_session_custom.json");
};

const runCasual = () => {
  if (inebrietyLimit() <= 15) {
    if (!have($item `Greatest American Pants`)) {
      waitForStashItems($items `Greatest American Pants`);
      takeStash($item `Greatest American Pants`, 1);
    }
    cliExecute('loopcasual');
    Clan.join("Alliance from Heck");
    putStash($item `Greatest American Pants`, 1);
  }
  let fun = 0;
  // make sure steel organ was gotten
  if (inebrietyLimit() > 15) {
    if (notOverdrunk()) {
      waitForStashItems();
      cliExecute("garbo");
      fun = bb_overdrink();
    }
    const session = logSession('casual', fun);
    const allSessions = session.add(Session.fromFile('bb_session_aftercore.json')).add(Session.fromFile('bb_session_cs.json'));
    printLoopSession(allSessions, 'full loop');
  }
};

const runAftercore = () => {
  if (notOverdrunk()) {
    waitForStashItems();
    cliExecute("garbo ascend");
  const fun = bb_overdrink();
  logSession('aftercore', fun, true);
  }
  print('Ready to ascend', 'green');
  if (myAdventures() === 0 && myInebriety() > inebrietyLimit()) {
    const map = new Map();
    map.set($skill`Quantum Movement`, Lifestyle.hardcore);
    ascend(Paths.CommunityService, $class `Pastamancer`, Lifestyle.normal, 'blender', $item `astral six-pack`, $item `astral trousers`, map);
    runCommunityService();
  }
};

export function main(args: string): void {
  if (args) {
    storeLog();
    return;
  }
  if (myDaycount() === 1) {
    if (myMeat() < 20000 || (get('kingLiberated') && get('questL02Larva') === 'unstarted')) {
      runCommunityService();
    } else {
      runCasual();
    }
  }
  if (myDaycount() === 2) {
    runAftercore();
  }
}