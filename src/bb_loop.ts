import {
  cliExecute,
  equip,
  inebrietyLimit,
  myAdventures,
  myClass,
  myDaycount,
  myInebriety,
  myMeat,
  print,
  putStash,
  takeStash,
} from "kolmafia";
import {
  $class,
  $item,
  $items,
  $path,
  $skill,
  $slot,
  ascend,
  Clan,
  get,
  have,
  Lifestyle,
  Paths,
  Session} from "libram";
import { parse } from "path";
import { abort } from "process";
import {
  bb_overdrink
} from "./bb_overdrink";
import { isDrunk, waitForStashItems } from "./lib";
import {
  printLoopSession
} from "./session";

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

const runCommunityService = (hobo?:boolean) => {
  let fun = 0;
  if (!get("kingLiberated")) cliExecute("hccs");
  if (!get("kingLiberated")) return;
  // if (!get("_fishyPipeUsed")) bb_sea();
  if (    myInebriety() < inebrietyLimit() ||    (!isDrunk() && myAdventures() > 0)  ) {
    waitForStashItems();
    if (hobo) {
      cliExecute("garbo nobarf ascend");
      print('Time to hobo', 'green');
      abort();
    } else {
      cliExecute('garbo ascend');
    }
  }
  if (myAdventures() === 0 && !isDrunk()) {
    fun = bb_overdrink();
    cliExecute("garbo ascend");
    cliExecute("hccs_pre");
  }

  logSession('cs', fun);

  if (myAdventures() === 0 && myInebriety() > inebrietyLimit()) {
    ascend($path`none`,$class `Seal Clubber`, Lifestyle.casual, 'platypus', $item `astral six-pack`, $item `astral trousers`);
    runCasual();
  }
};

const storeLog = () => {
  Session.current().toFile("bb_session_custom.json");
};

const runCasual = (stopAfterTower?:boolean, hobo?:boolean) => {
  if (inebrietyLimit() <= 15) {
    if (!have($item `Greatest American Pants`)) {
      waitForStashItems($items `Greatest American Pants`);
      takeStash($item `Greatest American Pants`, 1);
    }
    try {
      cliExecute('loopcasual');
    } finally {
      Clan.join("Alliance from Heck");
      equip($slot`pants`, $item`none`);
      putStash($item`Greatest American Pants`, 1);
    }
  }
  if (stopAfterTower) {
    return;
  }
  let fun = 0;
  // make sure steel organ was gotten
  if (inebrietyLimit() > 15) {
    if (notOverdrunk()) {
      waitForStashItems();
      if (hobo) {
        cliExecute("garbo nobarf");
        print('Ready for hobo.', 'green');
      }
      else {
        cliExecute('garbo');
        fun = bb_overdrink();
        cliExecute('garbo');
        cliExecute('bb_logout');
      }
    }
    const session = logSession('casual', fun);
    const allSessions = session.add(Session.fromFile('bb_session_aftercore.json')).add(Session.fromFile('bb_session_cs.json'));
    printLoopSession(allSessions, 'full loop');
  }
};

const runAftercore = (looping ? : boolean) => {
  if (notOverdrunk()) {
    waitForStashItems();
    cliExecute("garbo ascend");
    const fun = bb_overdrink();
    logSession('aftercore', fun, true);
  }
  print('Ready to ascend', 'green');
  if (looping && myAdventures() === 0 && myInebriety() > inebrietyLimit()) {
    const map = new Map();
    map.set($skill `Quantum Movement`, Lifestyle.hardcore);
    ascend($path`Community Service`, $class `Pastamancer`, Lifestyle.normal, 'blender', $item `astral six-pack`, $item `astral trousers`, map);
    runCommunityService();
  }
};

function parseArgs(args: string): { aftercore: boolean, casual: boolean, hobo: boolean } {
  args = args || '';
  return {
    aftercore: args.includes('aftercore'),
    casual: args.includes('casual'),
    hobo: args.includes('hobo')
  };
}

export function main(args: string): void {
  const options = parseArgs(args);

  if (options.aftercore) {
      print('Running aftercore only.');
      runAftercore();
      return;
    } else if (options.casual) {
      runCasual(true, options.hobo);
      return;
    } else if (args) {
      print('Saving log.');
      storeLog();
    return;
  }
  if (myDaycount() === 1) {
    if (myMeat() < 20000 || (get('kingLiberated') && get('questL02Larva') === 'unstarted')) {
      runCommunityService(options.hobo);
    } else {
      runCasual();
    }
  }
  else {
    runAftercore(true);
  }
}
