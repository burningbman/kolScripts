import { autosell, availableAmount, chew, drink, eat, myInebriety, putShop, use, useSkill } from 'kolmafia';
import { $item, $skill } from 'libram';

const MALL_MIN_ITEMS = [$item`cyan seashell`, $item`gray seashell`, $item`green seashell`, $item`magenta seashell`, $item`yellow seashell`, $item`kelp`];

export function main(): void {
    for (const item of MALL_MIN_ITEMS) { putShop(100, 0, item); }
    putShop(269, 0, $item`bunch of sea grapes`);
    putShop(6197, 0, $item`pristine fish scale`);
    putShop(566, 0, $item`rough fish scale`);
    putShop(122, 0, $item`sand dollar`);
    putShop(979, 0, $item`sea jelly`);
    putShop(2000, 0, $item`sea lace`);
    putShop(515, 0, $item`grain of sand`);
    putShop(18900, 0, $item`porquoise`);

    autosell(availableAmount($item`dull fish scale`), $item`dull fish scale`);
    autosell(availableAmount($item`taco shell`), $item`taco shell`);
    autosell(availableAmount($item`spearfish fishing spear`), $item`spearfish fishing spear`);
    autosell(availableAmount($item`lucky rabbitfish fin`), $item`lucky rabbitfish fin`);
    autosell(availableAmount($item`waders`), $item`waders`);
    autosell(availableAmount($item`piece of coral`), $item`piece of coral`);
    autosell(availableAmount($item`baconstone`), $item`baconstone`);
    autosell(availableAmount($item`hamethyst`), $item`hamethyst`);

    if (myInebriety() === 0) {
        useSkill(3, $skill`Ode to Booze`);
        drink(6, $item`perfect cosmopolitan`);
        drink(2, $item`meadeorite`);
        drink(1, $item`perfect paloma`);
        use($item`milk of magnesium`);
        eat(3, $item`water log`);
        chew(3, $item`agua de vida`);
    }

    if (availableAmount($item`driftwood beach comb`) === 0) use($item`piece of driftwood`);
}
