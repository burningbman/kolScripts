import {
  availableAmount,
  buy,
  canAdventure,
  cliExecute,
  equip,
  getWorkshed,
  holiday,
  inebrietyLimit,
  myAdventures,
  myInebriety,
  myPath,
  outfit,
  print,
  putStash,
  runChoice,
  takeStash,
  toItem,
  use,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $path,
  $skill,
  $slot,
  Clan,
  get,
  have,
  Session,
  set,
  TrainSet
} from "libram";
import {
  bb_overdrink
} from "./bb_overdrink";
import { canAscendNoncasual, shrug, waitForStashItems } from "./lib";
import {
  printLoopSession
} from "./session";

const notOverdrunk = () => {
  return myInebriety() <= inebrietyLimit() ||
    (myInebriety() >= inebrietyLimit() && myAdventures() > 0);
};

const logSession = (leg: string, fun: number, print?: boolean) => {
  const session = Session.current(true);
  session.register($item`PirateRealm fun-a-log`, fun);
  session.register($item`A Guide to Burning Leaves`, 0);
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
  if (!get("kingLiberated")) {
    throw new Error('hccs did not complete');
  } else if (!get("lockPicked")) {
    cliExecute('bb_kingFreed');
  }
  return noError;
};

const storeLog = () => {
  Session.current(true).toFile("bb_session_custom.json");
};

const runCasual = () => {
  let noError = true;
  if (inebrietyLimit() <= 15) {
    print('Running casual', 'green');

    if (getWorkshed() !== toItem('model train set')) {
      setupTrain();
    }

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

function setupTrain() {
  use(toItem(`model train set`));
  TrainSet.setConfiguration([TrainSet.Station.WATER_BRIDGE,
  TrainSet.Station.VIEWING_PLATFORM,
  TrainSet.Station.BRAIN_SILO,
  TrainSet.Station.COAL_HOPPER,
  TrainSet.Station.GAIN_MEAT,
  TrainSet.Station.CANDY_FACTORY,
  TrainSet.Station.ORE_HOPPER,
  TrainSet.Station.TRACKSIDE_DINER]);
}

function printFullSession(session?: Session) {
  const lSession = session || Session.current(true);
  const allSessions = lSession.add(Session.fromFile('bb_session_aftercore.json'));
  printLoopSession(allSessions, 'full loop');
}

const runAftercore = () => {
  let noError = true;
  const workshed = getWorkshed();
  let garboWorkshed = '';
  const done = !canAscendNoncasual();
  let fun = 0;

  // make sure workshed is setup correctly
  if (!get('_workshedItemUsed')) {
    if (workshed !== $item`cold medicine cabinet` && workshed !== toItem('model train set')) {
      setupTrain();
    }
    garboWorkshed = `workshed=${workshed === $item`cold medicine cabinet` ? 'trainrealm' : 'cmc'}`;
  }

  if (myAdventures() > 0 || myInebriety() <= inebrietyLimit()) {
    print('Running aftercore', 'green');
    waitForStashItems();
    shrug($effect`Power Ballad of the Arrowsmith`);

    if (myAdventures() > 0 && myInebriety() <= inebrietyLimit()) {
      const ascend = done ? '' : 'ascend';
      const command = `garbo ${ascend} ${garboWorkshed}`;
      print(command, 'green');
      noError = cliExecute(command);
    }

    if (!noError) {
      return noError;
    }

    if (myInebriety() <= inebrietyLimit()) {
      fun = bb_overdrink();
    }

    if (!done) {
      // if (!get('_mapToACandyRichBlockUsed') && !holiday().includes('Halloween')) {
      //   use($item`map to a candy-rich block`);
      //   runChoice(2);
      //   outfit(get('freecandy_treatOutfit'));
      //   cliExecute('freecandy 1');
      // }
      noError = cliExecute('hccs_pre');
    }
  }

  const log = canAscendNoncasual() ? 'aftercore' : 'cs';
  const session = logSession(log, fun, true);
  print('Aftercore complete', 'green');

  if (done) {
    printFullSession(session);
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
  set('betweenBattleScript', '');
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

  if (!canAscendNoncasual() && (myInebriety() > inebrietyLimit())) {
    printFullSession();
    return;
  }

  let noError = true;
  while (!have($effect`Beaten Up`) && noError && (canAscendNoncasual() || (myInebriety() <= inebrietyLimit()))) {
    print('Checking what step to run next', 'green');
    if (myPath() === $path`none`) {
      if (!get('kingLiberated')) {
        noError = runCasual();
      } else {
        if (notOverdrunk() || myAdventures() > 0) {
          noError = runAftercore();
        } else {
          if (canAscendNoncasual()) {
            if (noError) {
              print('Ascending into Community Service', 'green');
              noError = cliExecute('hccs_ascend');
            }
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
