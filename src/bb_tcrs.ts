import {
  cliExecute,
  Effect,
  effectModifier,
  equippedItem,
  Item,
  mallPrice,
  numericModifier,
  print,
  printHtml,
  Slot,
  useFamiliar,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  Requirement
} from "libram";

const signs = [
  "Mongoose",
  "Wallaby",
  "Vole",
  "Platypus",
  "Opossum",
  "Marmot",
  "Wombat",
  "Blender",
  "Packrat",
];

const classes = [
  "Seal Clubber",
  "Sauceror",
  "Accordion Thief",
  "Disco Bandit",
  "Turtle Tamer",
  "Pastamancer",
];

type booze = {
  inebriety: number;
  advs: number;
  quality: string;
}

type food = {
  fullness: number;
  advs: number;
  quality: string;
}

type dataType = {
  sign: string;
  class: string;
  totalMpa: number;
  pasta: Item;
  pastaData: food;
  advs: number;
  // coldOne: string;
  baseBooze: Item;
  boozeData: booze;
  largestWine: Item;
  wineData: booze;
  mods: {
    modifier: string;modAmount: number;totalMpa: number
  } [];
};
type EffectData = {
  dur: number;price: number;mpa: number;item: Item
};

// const FAM_WEIGHT = 200;
// const FAM_ITEM_DROP = Math.sqrt(55 * FAM_WEIGHT) + FAM_WEIGHT - 3;
const quality = ["crappy", "decent", "good", "awesome", "EPIC"];

const desiredAmt: {
  [key: string]: number
} = {
  "Item Drop": 1900 - 255, // 1900 - FAM_ITEM_DROP - 255,
  "Familiar Experience": 11,
  // "Familiar Weight": FAM_WEIGHT - 20,
};

const mods = ["Item Drop", "Familiar Experience", "Familiar Weight"];
const modifiers: {
  [key: string]: Map < Effect,
  EffectData[] >
} = {};
const BASE_BOOZE = $items `bottle of gin, bottle of rum, bottle of tequila, bottle of vodka, bottle of whiskey`;
mods.forEach((mod) => (modifiers[mod] = new Map < Effect, EffectData[] > ()));

const BL_ADVS = 3.5;

const foodAdvs = (data: dataType, food: Item): number => {
  const extra = data.class === 'Pastamancer' || data.class === 'Sauceror' ? 5 : 3;
  return Math.floor(19 / food.fullness) * (quality.indexOf(food.quality) + 2 + extra); // 1 for 0-index; 1 for special seasoning
};

const wineAdvs = (booze: Item): number => {
  const base = booze.inebriety * (1 + quality.indexOf(booze.quality)); // 1 for 0-index (no ode yet)
  // palate -> pinky ring
  let advs = base * 1.3 * 1.125;
  // frosty's mug (not sure where this falls in palate/pinky ring, so consider it separate)
  advs += base * 1.5;
  // ode
  advs += booze.inebriety;

  return Math.floor(advs);
};

const boozeAdvs = (booze: Item): number => {
  const perBooze = 2 + quality.indexOf(booze.quality); // 1 for ode; 1 for 0-index
  let advs = Math.floor((25 / booze.inebriety)) * (BL_ADVS + perBooze);

  // account for shot glass
  if (booze.inebriety === 1) {
    advs += BL_ADVS + perBooze;
  } else {
    advs += 6; // some other 1-size epic booze
  }

  return Math.floor(advs);
};

const getWinesAndPastas = (): { wines: Item[]; pastaArr: Item[] } => {
  const items = Item.all();
  const pastaArr = [], wines = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.notes) {
      if (item.notes.includes("SAUCY")) {
        pastaArr.push(item);
      } else if (item.notes === "WINE") {
        wines.push(item);
      }
    }
  }
  return { wines, pastaArr };
};

const addDietData = (wines: Item[], pastaArr: Item[], data: dataType) => {
  pastaArr.forEach((pasta) => {
    if (
      data.pasta === $item`none` ||
      foodAdvs(data, pasta) > foodAdvs(data, data.pasta)
    ) {
      data.pasta = pasta;
      data.pastaData = {
        fullness: pasta.fullness,
        quality: pasta.quality,
        advs: foodAdvs(data, pasta)
      };
    }
  });

  BASE_BOOZE.forEach((booze) => {
    if (data.baseBooze === $item`none` || boozeAdvs(booze) > boozeAdvs(data.baseBooze)) {
      data.baseBooze = booze;
      data.boozeData = {
        inebriety: booze.inebriety,
        quality: booze.quality,
        advs: boozeAdvs(booze)
      };
    }
  });

  // data.coldOne = `${$item`Cold One`.inebriety} ${
  //   $item`Cold One`.quality || "?"
  // }`;

  wines.forEach((wine) => {
    if (wineAdvs(wine) > wineAdvs(data.largestWine)) {
      data.largestWine = wine;
      data.wineData = {
        inebriety: wine.inebriety,
        quality: wine.quality,
        advs: wineAdvs(wine)
      };
    }
  });

  data.advs += boozeAdvs(data.baseBooze);
};

const famWeightToItemDrop = (weight: number) => {
  return 2 * weight;
};

export function main(): void {
  useFamiliar($familiar `Baby Gravy Fairy`);
  const datas: dataType[] = [];

  const { wines, pastaArr } = getWinesAndPastas();

  classes.forEach((cName) => {
    signs.forEach((sign) => {
      const data: dataType = {
        sign,
        class: cName,
        totalMpa: -1,
        mods: [],
        pasta: $item`none`,
        baseBooze: $item `none`,
        // coldOne: " ",
        largestWine: $item`none`,
        advs: 0,
        boozeData: {
          inebriety: 0,
          advs: 0,
          quality: 'none'
        },
        wineData: {
          inebriety: 0,
          advs: 0,
          quality: 'none'
        },
        pastaData: {
          fullness: 0,
          advs: 0,
          quality: 'none'
        }
      };
      Effect.all().forEach((effect) => {
        Object.keys(modifiers).forEach((modifier) => {
          const effs = modifiers[modifier];
          if (numericModifier(effect, modifier)) {
            effs.set(effect, []);
          }
        });
      });
      cliExecute(`tcrs test ${cName},${sign}`);
      Item.all().forEach((item) => {
        // if (!item.potion) return;
        const effect = effectModifier(item, "effect");
        Object.keys(modifiers).forEach((modifier) => {
          if (modifiers[modifier].has(effect)) {
            const price = mallPrice(item);
            if (!price) return;
            const dur = numericModifier(item, "Effect Duration");
            modifiers[modifier].get(effect)?.push({
              dur,
              price,
              mpa: price / dur,
              item,
            });
          }
        });
      });

      addDietData(wines, pastaArr, data);

      new Requirement(
        ["100 familiar experience, item drop, 2 familiar weight"], {
        forceEquip: [...$items`mafia thumb ring, carnivorous potted plant, lucky gold ring, Mr. Cheeng's spectacles`],
      }
      ).maximize();
      Slot.all().forEach((slot) => {
        desiredAmt["Item Drop"] -= numericModifier(equippedItem(slot), "Item Drop");
        desiredAmt["Item Drop"] -= famWeightToItemDrop(numericModifier(equippedItem(slot), "Familiar Weight"));
        desiredAmt["Familiar Experience"] -= numericModifier(equippedItem(slot), "Familiar Experience");
      });

      let totalMpa = 0;
      Object.keys(modifiers).forEach((modifier) => {
        const cheapest: {
          effect: string;
          mpp: number;
          mpa: number;
          item: string;
          itemDrop: number;
          price: number;
          dur: number;
        } [] = [];
        modifiers[modifier].forEach((sources, eff) => {
          if (sources.length) {
            sources.sort((a, b) => a.mpa - b.mpa);
            cheapest.push({
              effect: eff.name,
              itemDrop: numericModifier(eff, modifier),
              mpp: sources[0].mpa / numericModifier(eff, modifier),
              mpa: sources[0].mpa,
              item: sources[0].item.name,
              price: sources[0].price,
              dur: sources[0].dur,
            });
          }
        });

        cheapest.sort((a, b) => a.mpp - b.mpp);

        let modAmount = 0;
        let totalModMpa = 0;
        for (
          let i = 0; modAmount < desiredAmt[modifier] &&
          i < cheapest.length &&
          totalModMpa < 5000; i++
        ) {
          const effData = cheapest[i];
          // print(
          //   `${effData.effect} from ${effData.item} provides ${effData.itemDrop} over ${effData.dur} turns for ${effData.price} meat`
          // );
          modAmount += effData.itemDrop;
          totalModMpa += effData.mpa;
        }

        data.mods.push({
          modifier,
          modAmount: modAmount - desiredAmt[modifier],
          totalMpa: totalModMpa,
        });
        totalMpa += totalModMpa;
        // print(`${modAmount} ${modifier} for ${totalMpa.toFixed(0)} MPA`);
        modifiers[modifier].clear();
      });
      data.totalMpa = totalMpa;
      datas.push(data);
    });
  });

  // datas.sort((a, b) => a.totalMpa - b.totalMpa);
  datas.sort((a, b) => (b.boozeData.advs + b.wineData.advs + b.pastaData.advs) - (a.boozeData.advs + a.wineData.advs + a.pastaData.advs));

  const html = datas.reduce((prev, data) => {
    let totalMpa = 0;
    const mods = data.mods.reduce((prev, mod) => {
      totalMpa += mod.totalMpa;
      return `${prev}<td>${mod.modAmount.toFixed(
        0
      )}</td><td>${mod.totalMpa.toFixed(0)}</td>`;
    }, "");

    const str = `<tr><td>${totalMpa.toFixed(0)}</td><td>${data.class}</td><td>${
      data.sign
    }${mods}<td>${data.pasta.quality} ${data.pasta.fullness}</td><td>${data.boozeData.quality} ${data.boozeData.inebriety}</td><td>${data.wineData.quality} ${data.wineData.inebriety}</td><td>${data.boozeData.advs + data.wineData.advs + data.pastaData.advs}</td></tr>`;
    // print(str);
    return prev + str;
  }, "");

  let modHeaders = "";
  mods.forEach((mod) => {
    modHeaders = `${modHeaders}<th colspan="2">${mod}</th>`;
  });
  printHtml(
    `<table border="1"><tr><th>MPA</th><th>Class</th><th>Sign</th>${modHeaders}<th>Pasta</th><th>Base Booze</th><th>Wine</th><th>Diet Advs</td></tr>${html}</table>`
  );
  cliExecute("tcrs test reset");
}