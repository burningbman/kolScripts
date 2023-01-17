import {
  cliExecute,
  equip,
  inebrietyLimit,
  myAdventures,
  myDaycount,
  myInebriety,
  myMeat,
  myPath,
  print,
  putStash,
  takeStash,
} from "kolmafia";
import {
  $class,
  $effect,
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
  Session
} from "libram";
import { abort } from "process";
import {
  bb_overdrink
} from "./bb_overdrink";
import { canAscendCasual, canAscendNoncasual, createPermOptions, isDrunk, waitForStashItems } from "./lib";
import {
  printLoopSession
} from "./session";

const notOverdrunk = () => {
  return myInebriety() <= inebrietyLimit() ||
    (myInebriety() >= inebrietyLimit() && myAdventures() > 0);
};

const logSession = (leg: string, fun: number, print?: boolean) => {
  const session = Session.current();
  session.register($item`PirateRealm fun-a-log`, fun);
  session.toFile(`bb_session_${leg}.json`);
  print && printLoopSession(session, leg);
  return session;
};

const runCommunityService = () => {
  let noError = true;
  if (!get("kingLiberated")) {
    print('Running Community Service', 'green');
    noError = cliExecute("hccs");
  }
  if (!get("kingLiberated")) throw new Error('hccs did not complete');
  return noError;
};

const storeLog = () => {
  Session.current().toFile("bb_session_custom.json");
};

const runCasual = () => {
  let noError = true;
  if (inebrietyLimit() <= 15) {
    print('Running casual', 'green');
    if (!have($item`Greatest American Pants`)) {
      waitForStashItems($items`Greatest American Pants`);
      takeStash($item`Greatest American Pants`, 1);
    }
    try {
      noError = cliExecute('loopcasual');
    } finally {
      Clan.join("Alliance from Heck");
      equip($slot`pants`, $item`none`);
      putStash($item`Greatest American Pants`, 1);
    }
  }

  // make sure steel organ was gotten
  if (noError && inebrietyLimit() <= 15) {
    print('Did not get steel liver', 'red');
    noError = false;
  }

  return noError;
};

const runAftercore = () => {
  let noError = true;

  if (myAdventures() > 0 || myInebriety() <= inebrietyLimit()) {
    print('Running aftercore', 'green');
    waitForStashItems();

    const done = !canAscendCasual() && !canAscendNoncasual();

    if (myAdventures() > 0 && myInebriety() <= inebrietyLimit()) {
      const ascend = done ? '' : 'ascend';
      noError = cliExecute(`garbo ${ascend}`);
      // noError = cliExecute('railo car=dining priority=elves');
    }

    if (!noError) {
      return noError;
    }

    let fun = 0;
    if (myInebriety() <= inebrietyLimit()) {
      fun = bb_overdrink();
    }

    if (!done) {
      // noError = cliExecute('railo car=dining priority=elves');
      noError = cliExecute('garbo ascend');
    }

    const log = canAscendNoncasual() ? 'aftercore' : canAscendCasual() ? 'cs' : 'casual';
    const session = logSession(log, fun, true);
    print('Aftercore complete', 'green');

    if (done) {
      const allSessions = session.add(Session.fromFile('bb_session_aftercore.json')).add(Session.fromFile('bb_session_cs.json'));
      printLoopSession(allSessions, 'full loop');
    }
  }

  return noError;
};

function parseArgs(args: string): { aftercore: boolean, casual: boolean, hobo: boolean, cs: boolean } {
  args = args || '';
  return {
    aftercore: args.includes('aftercore'),
    casual: args.includes('casual'),
    hobo: args.includes('hobo'),
    cs: args.includes('cs')
  };
}

export function main(args: string): void {
  const options = parseArgs(args);

  if (options.aftercore) {
    print('Running aftercore only.');
    runAftercore();
    return;
  } else if (options.casual) {
    runCasual();
    return;
  } else if (options.cs) {
    runCommunityService();
    return;
  } else if (args) {
    print('Saving log.');
    storeLog();
    return;
  }

  let noError = true;
  while (!have($effect`Beaten Up`) && noError && (canAscendCasual() || canAscendNoncasual() || (myInebriety() <= inebrietyLimit()))) {
    print('Checking what step to run next', 'green');
    if (myPath() === $path`none`) {
      if (!get('kingLiberated')) {
        noError = runCasual();
      } else {
        if (notOverdrunk() || myAdventures() > 0) {
          noError = runAftercore();
        } else {
          if (canAscendNoncasual()) {
            print('Ascending into Community Service', 'green');
            ascend($path`Community Service`, $class`Pastamancer`, Lifestyle.normal, 'blender', $item`astral six-pack`, $item`astral trousers`, createPermOptions().permSkills);
          } else if (canAscendCasual()) {
            print('Ascending into casual', 'green');
            ascend($path`none`, $class`Seal Clubber`, Lifestyle.casual, 'platypus', $item`astral six-pack`, $item`astral trousers`, createPermOptions().permSkills);
          } else {
            print('In an odd state. Not sure what to do.', 'red');
            break;
          }
        }
      }
    } else if (myPath() === $path`Community Service`) {
      noError = runCommunityService();
    } else {
      print(`In path ${myPath()}. Not sure what to do`, 'red');
      break;
    }
  }
}
