import { Familiar, abort, cliExecute, myFamiliar, myLevel, print, runChoice, useFamiliar, userPrompt, visitUrl } from "kolmafia";
import { $effect, $familiar, $item, DaylightShavings, ensureEffect, get, maximizeCached } from "libram";
import { shrug } from "../lib";
import { getDefaultFamiliar } from "./lib";

const FAM_MAP: { [key: string]: Familiar } = {
    'goose': $familiar`Grey Goose`,
    'hobo': $familiar`Hobo Monkey`,
    'nose': $familiar`Nosy Nose`,
    'eagle': $familiar`Patriotic Eagle`,
    'woim': $familiar`Oily Woim`,
    'dog': $familiar`Jumpsuited Hound Dog`,
    'rat': $familiar`Purse Rat`,
    'cook': $familiar`Shorter-Order Cook`,
    'jill': $familiar`Jill-of-All-Trades`,
    'bird': $familiar`Reassembled Blackbird`
};

const LOADOUT_MAP: { [key: string]: string } = {
    'item': '.6 item drop',
    'nc': '-5 combat',
    'com': '5 combat',
    'init': 'init',
    'da': 'da',
    'ml': 'ml',
    'mp': 'mp',
    'meat': 'meat'
};

const FAMS = Object.keys(FAM_MAP);
const VALID_ARGS = [...FAMS, ...Object.keys(LOADOUT_MAP), 'spikes', 'desert', 'war', 'fluda', 'paw', 'drone', 'mac', 'extinguisher', 'skateboard', 'parka', 'galoshes'];

function adjustCandle(choice: number) {
    visitUrl('inventory.php?action=tweakjill');
    runChoice(choice);
}

function handleFam(args: string[]): void {
    const fams = FAMS.filter(fam => args.includes(fam));
    args.includes('drone') && fams.push('goose');
    let fam;
    if (fams.length > 1) {
        abort(`Multiple familiars passed: ${fams}`);
    } else if (fams.length === 0) {
        if (args.includes('init')) {
            fam = $familiar`Oily Woim`;
        } else if (args.includes('meat') || args.includes('item')) {
            fam = $familiar`Jill-of-All-Trades`;
        } else {
            fam = getDefaultFamiliar();
        }
    } else {
        fam = FAM_MAP[fams[0]];
    }

    if (!fam) {
        abort(`Invalid fam passed: ${fams[0]}`);
    }

    useFamiliar(fam);

    return;
}

function handleOutfit(args: string[]): void {
    const forceEquip = [];
    const preventEquip = [];
    const bonusEquip = new Map([
        [$item`designer sweatpants`, 4],
        [$item`June cleaver`, 4],
    ]);

    const modes = {
        backupcamera: get('sidequestArenaCompleted') === 'fratboy' ? 'meat' : 'ml',
        parka: get('sidequestArenaCompleted') === 'fratboy' ? 'meat' : 'ml',
        umbrella: get('sidequestArenaCompleted') === 'fratboy' ? 'item' : 'ml'
    };

    if (get('_voidFreeFights') < 5) {
        bonusEquip.set($item`cursed magnifying glass`, 4);
    }

    if (DaylightShavings.buffAvailable() && get('sidequestNunsCompleted') !== 'fratboy') {
        if (DaylightShavings.nextBuff() !== $effect`Spectacle Moustache`) {
            bonusEquip.set($item`Daylight Shavings Helmet`, 4);
        } else {
            preventEquip.push($item`Daylight Shavings Helmet`);
        }
    }

    if (args.includes('item')) {
        (modes.umbrella = 'item');
        adjustCandle(1);
        myFamiliar() === $familiar`Jill-of-All-Trades` && forceEquip.push($item`LED candle`);
    }

    if (args.includes('meat')) {
        adjustCandle(2);
        myFamiliar() === $familiar`Jill-of-All-Trades` && forceEquip.push($item`LED candle`);
    }

    if (args.includes('init')) {
        modes.backupcamera = 'init';
        modes.parka = 'init';
    }

    if (args.includes('nc')) {
        modes.parka = 'pterodactyl';
        modes.umbrella = 'nc';
    }

    if (args.includes('spikes')) {
        modes.parka = 'spikolodon';
        forceEquip.push($item`Jurassic Parka`);
    }

    args.includes('war') && forceEquip.push($item`beer helmet`, $item`distressed denim pants`, $item`bejeweled pledge pin`);
    args.includes('fluda') && forceEquip.push($item`Flash Liquidizer Ultra Dousing Accessory`);
    args.includes('paw') && get('_monkeyPawWishesUsed') == 0 && forceEquip.push($item`cursed monkey's paw`);
    args.includes('mac') && forceEquip.push($item`antique machete`);
    args.includes('extinguisher') && forceEquip.push($item`industrial fire extinguisher`);
    args.includes('skateboard') && forceEquip.push($item`pro skateboard`);
    args.includes('galoshes') && forceEquip.push($item`blackberry galoshes`);


    if (args.includes('desert')) {
        bonusEquip.set($item`survival knife`, 50);
        bonusEquip.set($item`UV-resistant compass`, 50);
    }

    const maxArgs = args.filter((arg) => LOADOUT_MAP[arg]).map((arg) => LOADOUT_MAP[arg]);
    const defaultArgs = ['.1 DR', '.01 HP'];
    if (myLevel() < 12 || get('sidequestArenaCompleted') === 'none') {
        defaultArgs.push('.25 exp');
    }
    if (myFamiliar() === $familiar`Grey Goose`) {
        if (args.includes('drone')) {
            defaultArgs.push('5 familiar exp');
        } else {
            defaultArgs.push('4 familiar exp');
        }
    }
    if (!args.includes('da')) {
        defaultArgs.push('.03 DA');
    }

    print('default: ' + defaultArgs.join(','));
    print('max: ' + maxArgs.join(','));

    if (!maximizeCached([...defaultArgs, ...maxArgs], {
        preventEquip,
        forceEquip,
        bonusEquip,
        modes
    })) {
        print('Maximize did not happen', 'red');
    }

    if (args.includes('spikes')) {
        cliExecute('parka spikolodon');
    }
}

function handleBuffs(args: string[]): void {
    if (args.includes('nc')) {
        ensureEffect($effect`Smooth Movements`);
        ensureEffect($effect`The Sonata of Sneakiness`);
        shrug($effect`Carlweather's Cantata of Confrontation`);
    } else if (args.includes('com')) {
        ensureEffect($effect`Carlweather's Cantata of Confrontation`);
        ensureEffect($effect`Musk of the Moose`);
        shrug($effect`The Sonata of Sneakiness`);
    }
    if (args.includes('item')) {
        ensureEffect($effect`Singer's Faithful Ocelot`);
        ensureEffect($effect`Fat Leon's Phat Loot Lyric`);
    }
}

export function main(argString?: string): void {
    !argString && (argString = userPrompt('Insert asc args:'));
    const args = argString ? argString.split(' ') : [];
    const invalidArg = args.find((arg) => !VALID_ARGS.includes(arg));
    if (invalidArg) {
        abort(`Invalid argument: ${invalidArg}`);
    }

    handleFam(args);
    handleBuffs(args);
    handleOutfit(args);
}