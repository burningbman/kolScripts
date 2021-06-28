import {
  getProperty,
  setProperty,
  visitUrl,
  myHp,
  restoreHp,
  equip,
  combatRateModifier,
  totalTurnsPlayed,
  setAutoAttack,
  print,
  outfit,
  useSkill,
  abort,
  haveEffect,
  getAutoAttack,
  lastItemMessage,
  min
   } from "kolmafia";
import {
  $familiar,
  $location,
  $item,
  $slot,
  $effect,
  $skill
   } from "libram";
import {
  adventureHere,
  fightSausageIfGuaranteed,
  ensureAsdonEffect,
  ensureEffect,
  shrug,
  getPropertyInt,
  getPropertyIntInit,
  incrementProperty,
  setPropertyInt,
  lastAdventureWasSuccessfulCombat
} from "./lib"

// Refactor this code.
export function runTS(turns: number, howManyOfEachPart: number, refreshCount: number) {

  let partsCount = getRichardCounts();
  let turnsSpent = 0;

  setAutoAttack('Stuffed Mortar with Kramco');

  outfit('Hobo TS');

  const startingTurns = totalTurnsPlayed();
  while (totalTurnsPlayed() < startingTurns + turns) {
    //TODO: NCs messing with our counts
    if ((turnsSpent % refreshCount === 0))
      partsCount = getRichardCounts();

    if (partsCount.boots < howManyOfEachPart)
      ensureEffect($effect`Spirit of Cayenne`);//replace with ensureEffect?
    else if (partsCount.eyes < howManyOfEachPart)
      ensureEffect($effect`Spirit of Peppermint`);
    else if (partsCount.guts <  howManyOfEachPart)
    { print(`should be spirit of garlic`, 'green');
      ensureEffect($effect`Spirit of Garlic`);
    }
    else if (partsCount.skulls < howManyOfEachPart)
      ensureEffect($effect`Spirit of Wormwood`);
    else if (partsCount.crotches < howManyOfEachPart)
      ensureEffect($effect`Spirit of Bacon Grease`);
    else if (partsCount.skins < howManyOfEachPart) {
      //useSkill($skill`Spirit of Nothing`); //TODO: ?
      if (getAutoAttack() != 99183758)//TODO: fix this up
        setAutoAttack('Repeat Attack');
    }
    else abort('We have enough parts');

    fightSausageIfGuaranteed();
    adventureHere($location`Hobopolis Town Square`, $familiar`Red Snapper`);

    // increment part count.  this should probably check the combat messages to confirm the part dropped
    // instead of basing it off our effect.  good enough for now as we refresh every so many turns.
    if (lastAdventureWasSuccessfulCombat() && getProperty('_lastEncounter') != 'sausage goblin') {
      if (haveEffect($effect`Spirit of Cayenne`) > 0)
        partsCount.boots++;
      else if (haveEffect($effect`Spirit of Peppermint`) > 0)
        partsCount.eyes++;
      else if (haveEffect($effect`Spirit of Garlic`) > 0)
        partsCount.guts++;
      else if (haveEffect($effect`pirit of Wormwood`) > 0)
        partsCount.skulls++;
      else if (haveEffect($effect`Spirit of Bacon Grease`) > 0)
        partsCount.crotches++;
      else
        partsCount.skins++;
    }

    if (myHp() < 200) restoreHp(1000);
    turnsSpent++;
  }
  useSkill($skill`Spirit of Nothing`);
}

export function runEE(turns: number, keepGoing: boolean, totalIcicles = 70) {
  // fix icicles to pipings
  setProperty('choiceAdventure215', '3'); // Piping Cold; Go all CLUE on the third Pipe
  setProperty('choiceAdventure273', '1'); // The Frigid Air; Pry open the freezer
  setProperty('choiceAdventure217', '1'); // There Goes Fritz!; Yodel a little
  setProperty('choiceAdventure292', '2'); // Cold Comfort; I’ll have the salad. I mean, I’ll leave.

  let icicles = getHoboCountsRe(/water pipes \((\d+) turns?\)/gm);
  let hearted = false;
  let diverts = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);

  getSneakyForHobos(turns);
  const startingTurns = totalTurnsPlayed();
  while (totalTurnsPlayed() < startingTurns + turns && !hearted) {
    fightSausageIfGuaranteed();
    adventureHere($location`Exposure Esplanade`, $familiar`red snapper`);

    if (getProperty('lastEncounter').includes('Piping Cold')) {
      icicles++;
      print("Icicle count: " + icicles + ' Diverts: ' + diverts, 'blue');
    }

    if (getProperty('lastEncounter').includes('Piping Cold') && icicles > totalIcicles) {
      setProperty('choiceAdventure217', '3'); // There Goes Fritz!; Yodel your heart out
      if (icicles > totalIcicles && !keepGoing)//TODO: this is a late night "fix"
      {
        if (getPropertyInt('choiceAdventure215') === 3)
          setProperty('choiceAdventure215', '2'); // Piping Cold; Divert
      }
      if (getPropertyInt('choiceAdventure215') === 2)
        diverts++;
        if (diverts >= 21 && !keepGoing)
        {
          abort('Icicles and pipes are done, maybe go work on BB');
        }
    }
    if (getProperty('lastEncounter').includes('There Goes Fritz!') && getPropertyInt('choiceAdventure217') === 3 &&!keepGoing)
    {
      hearted = true;
    }
    if (myHp() < 200) restoreHp(1000);
  }
}

function tiresToKills(tires: number): number {
  if (tires === -1) tires = 35;
  return (tires^2*0.1)+(0.7*tires);
}

export function runBB(turns: number, tiresAlreadyStacked = 0, stack1 = -1, stack2 = -1) {
  //TODO: store counts in new property or whatever storage mafia uses.
  //TODO: Real calculation for the last stack.
  setProperty('choiceAdventure206', '2'); // Getting Tired; Toss the tire on the fire gently
  setProperty('choiceAdventure207', '2'); // Hot Dog! I Mean... Door!; Leave the door be
  setProperty('choiceAdventure213', '2'); // Piping Hot; Leave the valve alone
  setProperty('choiceAdventure291', '2'); // A Tight Squeeze; No, thanks

  let kills = getHoboCountsRe(/defeated\s+Hot\s+hobo\s+x\s+(\d+)/gm);
  let tireCount = tiresAlreadyStacked > 0 ? tiresAlreadyStacked : getHoboCountsRe(/on the fire \((\d+) turns?\)/gm)%34;//Assume we follow 34 tires.  May need to adjust
  let tirevalanches = getHoboCountsRe(/started ((\d+)) tirevalanch/gm);
  let stack1kills = 0;
  let stack2kills = 0;
  let tiresToThrow = 34;

  //TODO: handle if we specified stack sizes but haven't thrown violent?
  if (tirevalanches === 1) {
    stack1kills = tiresToKills(stack1);
  }
  if (tirevalanches > 1) { // if we have more than 2, you're on your own?
    stack2kills = tiresToKills(stack2);
  };

  getSneakyForHobos(turns);
  const startingTurns = totalTurnsPlayed();
  while (totalTurnsPlayed() < startingTurns + turns) {
    fightSausageIfGuaranteed();
    adventureHere($location`Burnbarrel Blvd.`, $familiar`red snapper`);

    if (getPropertyInt('choiceAdventure206') === 1 && getProperty('lastEncounter').includes('Getting Tired')) {
      tirevalanches++;
      if (tirevalanches === 1) {
        stack1kills = tiresToKills(tireCount + 1);
      }
      if (tirevalanches === 2) { // if we have more than 2, you're on your own?
        stack2kills = tiresToKills(tireCount + 1);
      };
      print('Stack1Kills: ' + stack1kills + ' Stack2Kills: ' + stack2kills, 'red');
      setProperty('choiceAdventure206', '2'); // Getting Tired; Toss the tire on the fire gently
      tireCount = 0;
    }

    if (stack2kills > 0) {
      print('Stack1Kills: ' + stack1kills + ' Stack2Kills: ' + stack2kills, 'red');
      let hobosLeft = 500 - (stack2kills + stack1kills + kills);
      let tiresNeeded = 0;
      print('Hobos left: ' + hobosLeft + ' tiresNeeded: ' + tiresNeeded);
      while ((hobosLeft + tiresToKills(tiresNeeded)) < 500) {
          tiresNeeded++;
      }
      print('Updated tires needed to finish: ' + tiresNeeded, 'red')
      tiresToThrow = tiresNeeded;
    }

    if (getProperty('lastEncounter').includes('Getting Tired')) {
      tireCount++;
      print(`Tires on the stack: `+tireCount, 'red');
      if (tireCount >= tiresToThrow) {
        setProperty('choiceAdventure206', '1'); // Getting Tired; Toss the tire on the fire violently
      }
    }

    if (lastAdventureWasSuccessfulCombat()) {
      kills++;
    }
    if (myHp() < 200) restoreHp(1000);
  }
  print(`Tires on the stack: `+tireCount, 'red');
}

export function runTheHeap(turns: number, playingWithOthers: boolean) {

  setProperty('choiceAdventure214', '1'); // You vs. The Volcano; Kick stuff
  setProperty('choiceAdventure295', '1'); // Juicy!; Buy
  if (getPropertyIntInit('_BobSanders.TrashCount', 5) >= 5) {
    setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
  } else {
    setProperty('choiceAdventure216', '2'); // The Compostal Service; Begone'
  }
  //setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
  if (playingWithOthers)
    setProperty('choiceAdventure218', '0'); // I Refuse; abort
  else
    setProperty('choiceAdventure218', '1'); // I Refuse; Explore the junkpile

  //getPropertyIntInit('_BobSanders.TrashCount', 5);

  getSneakyForHobos(turns);
  const startingTurns = totalTurnsPlayed();
  while (totalTurnsPlayed() < startingTurns + turns) {
    fightSausageIfGuaranteed();
    adventureHere($location`The Heap`, $familiar`red snapper`);

    if (getProperty('lastEncounter').includes('You vs. The Volcano')) {
      incrementProperty('_BobSanders.TrashCount');//TODO: replace with myName()
      if (getPropertyInt('_BobSanders.TrashCount') >= 5) {
        setProperty('choiceAdventure216', '1'); // The Compostal Service; Be Green
      }
    }
    if (getPropertyInt('_BobSanders.TrashCount') >= 5 && getProperty('lastEncounter').includes('The Compostal Service')) {
      setProperty('choiceAdventure216', '2'); // The Compostal Service; Begone'
      setPropertyInt('_BobSanders.TrashCount', 0);
    }
    if (myHp() < 200) restoreHp(1000);
  }
}

/*export function runPLD(turns: number, minFlimflams = 5) {
  //TODO: move min flimflams later if we have been setup with 21 cold waters, probably image 7?

	//let img = /purplelightdistrict(\d+).gif/.exec(visitUrl("clan_hobopolis.php?place=8"));

  setProperty('choiceAdventure223', '3'); // Getting Clubbed; Try to flimflam the crowd
  setProperty('choiceAdventure224', '2'); // Exclusive!; Pick several fights
  setProperty('choiceAdventure294', '1'); // Maybe It's a Sexy Snake! Take a Chance?
  let eeColdWaters = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);
  let flimflams = getHoboCountsRe(/flimflammed some hobos \((\d+) turns?\)/gm);

  if (flimflams >= minFlimflams && (eeColdWaters + flimflams) >= 21)
    setProperty('choiceAdventure223', '1'); // Getting Clubbed; Try to get inside

  getConfrontationalForHobos(turns);
  const startingTurns = totalTurnsPlayed();
  while (totalTurnsPlayed() < startingTurns + turns) {
    fightSausageIfGuaranteed();
    adventureHere($location`The Purple Light District`, $familiar`red snapper`);

    //TODO: clean up this code
    if (getProperty('lastEncounter').includes('Getting Clubbed'))
    {
      flimflams++;
      print('Cold Waters: ' + eeColdWaters + ' Flimflams: ' + flimflams + " Min Flims: " + minFlimflams, 'purple');
      if ((eeColdWaters + flimflams) >= 21 && flimflams >= minFlimflams)
      {
        print('Switching to get inside', 'purple');
        setProperty('choiceAdventure223', '1'); // Getting Clubbed; Try to get inside
      }
    }
    if (myHp() < 200) restoreHp(1000);
  }
}*/

export function runPLD2(turns: number, minFlimflams = 10) {
	let img = /purplelightdistrict(\d+).gif/.exec(visitUrl("clan_hobopolis.php?place=8"));
  let eeColdWaters = getHoboCountsRe(/cold water out of Exposure Esplanade \((\d+) turns?\)/gm);
  let flimflams = getHoboCountsRe(/flimflammed some hobos \((\d+) turns?\)/gm);

  if ((eeColdWaters + flimflams) >= 21)
    setProperty('choiceAdventure223', '1'); // Getting Clubbed; Try to get inside
  else
    setProperty('choiceAdventure223', '3'); // Getting Clubbed; Try to flimflam the crowd
  setProperty('choiceAdventure224', '2'); // Exclusive!; Pick several fights
  setProperty('choiceAdventure294', '1'); // Maybe It's a Sexy Snake! Take a Chance?

  getConfrontationalForHobos(turns);
  const startingTurns = totalTurnsPlayed();
  while (totalTurnsPlayed() < startingTurns + turns) {
    fightSausageIfGuaranteed();
    adventureHere($location`The Purple Light District`, $familiar`red snapper`);

    if (getProperty('lastEncounter').includes('Getting Clubbed') || getProperty('lastEncounter').includes('Exclusive!'))
    {
      img = /purplelightdistrict(\d+).gif/.exec(visitUrl("clan_hobopolis.php?place=8"));
      if (getPropertyInt('choiceAdventure223') === 3)
        flimflams++;
      print('Cold Waters: ' + eeColdWaters + ' Flimflams: ' + flimflams + " Min Flims: " + minFlimflams, 'purple');

      if (flimflams >= minFlimflams && getPropertyInt('choiceAdventure223') === 3)
      {
        setProperty('choiceAdventure223', '1'); // Getting Clubbed; Try to get inside
      }
      if (img != null) print('PLD Image: ' + img[1]);
      if (img != null && parseInt(img[1]) >= 8 && getPropertyInt('choiceAdventure223') === 1 && flimflams < minFlimflams)
      {
        print('Switching to get flimflams', 'purple');
        setProperty('choiceAdventure223', '3'); // Getting Clubbed; Try to flimflam the crowd
      }
    }
    if (myHp() < 200) restoreHp(1000);
  }
}

export function runAHBG(turns: number) {

  setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
  setProperty('choiceAdventure220', '2'); // Returning to the Tomb; Disturb not ye these bones
  setProperty('choiceAdventure293', '2'); // Flowers for You; Flee this creepy scene
  setProperty('choiceAdventure221', '1'); // A Chiller Night (1); Study the hobos' dance moves
  setProperty('choiceAdventure222', '1'); // A Chiller Night (2); Dance with them

  getSneakyForHobos(turns);
  let danceCount = 0;
  const startingTurns = totalTurnsPlayed();
  while (totalTurnsPlayed() < startingTurns + turns) {
    fightSausageIfGuaranteed();
    adventureHere($location`The Ancient Hobo Burial Ground`, $familiar`red snapper`);

    if (getProperty('lastEncounter').includes('A Chiller Night')) {
      danceCount++;
      if (danceCount >= 5) {
        setProperty('choiceAdventure208', '1'); // Ah, So That's Where They've All Gone; Send the flowers to The Heap
      }
    }
    if (danceCount >= 5 && getProperty('lastEncounter').includes(`Ah, So That's Where They've All Gone`)) {
      setProperty('choiceAdventure208', '2'); // Ah, So That's Where They've All Gone; Tiptoe through the tulips
      danceCount=0;
    }
    if (myHp() < 200) restoreHp(1000);
  }
}

export function getSneakyForHobos(turns: number)
{
  //TODO: check latte ingredients
  equip($item`Lens of Hatred`);
  equip($item`Misty Cloak`);
  equip($slot`shirt`, $item`camouflage T-shirt`);
  equip($item`Stick-Knife of Loathing`);
  equip($item`latte lovers member's mug`);
  //equip($item`Pantaloons of Hatred`);
  equip($item`pantogram pants`);
  equip($slot`acc1`, $item`Bram's choker`);
  equip($slot`acc2`, $item`red shoe`);
  equip($slot`acc3`, $item`Fuzzy Slippers of Hatred`);

  ensureAsdonEffect($effect`Driving Stealthily`, turns);
  ensureEffect($effect`Smooth Movements `, turns);
  ensureEffect($effect`The Sonata of Sneakiness`, turns);
  shrug($effect`Carlweather's Cantata of Confrontation`);

  setAutoAttack('Repeat Attack');

  if (combatRateModifier() > -30)
    throw 'Unexpected combat rate. Check latte ingredients?';
}

export function getConfrontationalForHobos(turns: number) {
  equip($item`Lens of Hatred`);
  equip($item`Misty Cloak`);
  equip($slot`shirt`, $item`"Remember the Trees" Shirt`);
  equip($item`Stick-Knife of Loathing`);
  equip($item`latte lovers member's mug`);
  equip($item`Pantaloons of Hatred`);
  equip($slot`acc1`, $item`monster bait`);
  equip($slot`acc2`, $item`Mr. Cheeng's spectacles`);
  equip($slot`acc3`, $item`Ass-Stompers of Violence`);

  ensureAsdonEffect($effect`Driving Obnoxiously`, turns);
  ensureEffect($effect`Musk of Moose`, turns);
  ensureEffect($effect`Carlweather's Cantata of Confrontation`, turns);
  shrug($effect`The Sonata of Sneakiness`);

  setAutoAttack('Repeat Attack');

  if (combatRateModifier() < 28)
    throw 'Unexpected combat rate. Check latte ingredients?';
}

export function getHoboCounts(whichCount: string): number {

  let regex;
  switch(whichCount) {
    case "BBTires": {
      regex = /on the fire \((\d+) turns?\)/gm;
      break;
    }
    case "EEColdWaters": {
      regex = /cold water out of Exposure Esplanade \((\d+) turns?\)/gm;
      break
    }
    case "PLDFlimflams": {
      regex = /flimflammed some hobos \((\d+) turns?\)/gm;
      break;
    }
    case "EEPipesBusted": {
      regex = /water pipes \((\d+) turns?\)/gm;
      break;
    }

  }

  const logs = visitUrl('clan_raidlogs.php');;
  let match;
  let total: number = 0;

  if (regex != null)
    while ((match = regex.exec(logs)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === regex.lastIndex)
        regex.lastIndex++;
      total += parseInt(match[1]);
    }

  print('Your count is: ' + total);
  return total;
}

export function getHoboCountsRe(regex: RegExp): number {

  const logs = visitUrl('clan_raidlogs.php').replace(/a tirevalanch/gm, '1 tirevalanch');//TODO: maybe look for "(x turn"
  let match;
  let total: number = 0;

  if (regex != null)
    while ((match = regex.exec(logs)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === regex.lastIndex)
        regex.lastIndex++;
      total += parseInt(match[1]);
    }

  print('Your count is: ' + total);
  return total;
}

type scoboParts = {
  boots: number;
  eyes: number;
  guts: number;
  skulls: number;
  crotches: number;
  skins: number;
}

export function getRichardCounts(): scoboParts {

  let richard = visitUrl("clan_hobopolis.php?place=3&action=talkrichard&whichtalk=3");
  //TODO: account for commas in the number
  let bootsMatch = richard.match("Richard has <b>(\\d+)</b> pairs? of charred hobo");
  let boots = (bootsMatch !== null) ? parseInt(bootsMatch[1]) : 0;
  let eyesMatch = richard.match("Richard has <b>(\\d+)</b> pairs? of frozen hobo");
  let eyes = (eyesMatch !== null) ? parseInt(eyesMatch[1]) : 0;
  let gutsMatch = richard.match("Richard has <b>(\\d+)</b> piles? of stinking hobo");
  let guts = (gutsMatch !== null) ? parseInt(gutsMatch[1]) : 0;
  let skullsMatch = richard.match("Richard has <b>(\\d+)</b> creepy hobo skull");
  let skulls = (skullsMatch !== null) ? parseInt(skullsMatch[1]) : 0;
  let crotchesMatch = richard.match("Richard has <b>(\\d+)</b> hobo crotch");
  let crotches = (crotchesMatch !== null) ? parseInt(crotchesMatch[1]) : 0;
  let skinsMatch = richard.match("Richard has <b>(\\d+)</b> hobo skin");
  let skins = (skinsMatch !== null) ? parseInt(skinsMatch[1]) : 0;

  print('Boots '+boots, 'red');
  print('Eyes '+eyes, 'blue');
  print('Guts '+guts, 'green');
  print('Skulls '+skulls, 'gray');
  print('Crotches '+crotches, 'purple');
  print('Skins '+skins);

  return {
    boots: boots,
    eyes: eyes,
    guts: guts,
    skulls: skulls,
    crotches: crotches,
    skins: skins
  }
}

/*


function kmail(to: string, message: string, meat: number, int[item] stuff): number {
	if(meat>myMeat()) {
		print("Not enough meat to send.");
		return 3;
	}
	let itemstring = "";
	let j = 0;
	let itemstrings;
	foreach i in stuff{
		if (is_tradeable(i)||is_giftable(i)) {
			j += 1;
			itemstring = itemstring+"&howmany"+j+"="+stuff[i]+"&whichitem"+j+"="+to_int(i);
			if (j>10) {
					itemstrings[count(itemstrings)] = itemstring;
					itemstring = '';
					j = 0;
			}
		}
	}
	if(itemstring != "")itemstrings[count(itemstrings)] = itemstring;
	if(count(itemstrings) == 0)itemstrings[0] = "";
	foreach q in itemstrings{
		string url = visit_url("sendmessage.php?pwd="+my_hash()+"&action=send&towho="+to+"&message="+message+"&sendmeat="+meat+itemstrings[q]);
		if(contains_text(url,"That player cannot receive Meat or items")) {
			print("Player may not receive meat/items.");
			return 2;
		}
		if(!contains_text(url,"Message sent.")) {
			print("Unknown error. The message probably did not go through.");
			return -1;
		}
	}
	return 1;
}


*/
