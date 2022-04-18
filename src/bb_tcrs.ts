import {
  cliExecute,
  Effect,
  effectModifier,
  Item,
  mallPrice,
  numericModifier,
  print,
  printHtml,
  useFamiliar,
} from "kolmafia";
import { $familiar } from "libram";

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

type dataType = {
  sign: string;
  class: string;
  totalMpa: number;
  mods: { modifier: string; modAmount: number; totalMpa: number }[];
};
type EffectData = { dur: number; price: number; mpa: number; item: Item };

const FAM_WEIGHT = 200;
const FAM_ITEM_DROP = Math.sqrt(55 * FAM_WEIGHT) + FAM_WEIGHT - 3;

const desiredAmt: { [key: string]: number } = {
  "Item Drop": 1900 - FAM_ITEM_DROP - 255,
  "Familiar Experience": 11,
  "Familiar Weight": FAM_WEIGHT - 20,
};

const mods = ["Item Drop", "Familiar Experience", "Familiar Weight"];
const modifiers: { [key: string]: Map<Effect, EffectData[]> } = {};
mods.forEach((mod) => (modifiers[mod] = new Map<Effect, EffectData[]>()));

export function main(): void {
  useFamiliar($familiar`Grey Goose`);
  const datas: dataType[] = [];
  classes.forEach((cName) => {
    signs.forEach((sign) => {
      const data: dataType = {
        sign,
        class: cName,
        totalMpa: -1,
        mods: [],
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
        if (!item.potion) return;
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
        }[] = [];
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
          let i = 0;
          modAmount < desiredAmt[modifier] && i < cheapest.length;
          i++
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

  datas.sort((a, b) => a.totalMpa - b.totalMpa);

  const html = datas.reduce((prev, data) => {
    let totalMpa = 0;
    const mods = data.mods.reduce((prev, mod) => {
      totalMpa += mod.totalMpa;
      return `${prev}</td><td>${mod.modAmount.toFixed(
        0
      )}</td><td>${mod.totalMpa.toFixed(0)}</td>`;
    }, "<td>");
    const str = `<tr><td>${data.class}</td><td>${
      data.sign
    }${mods}<td>${totalMpa.toFixed(0)}</td></tr>`;
    // print(str);
    return prev + str;
  }, "");

  const modHeaders = mods.reduce(
    (prev, mod) => `${prev}<th colspan="2">${mod}</th>`,
    ""
  );
  printHtml(
    `<table><tr><th>Class</th><th>Sign</th>${modHeaders}<th>Total MPA</th></tr>${html}</table>`
  );
  cliExecute("tcrs test reset");
  print("done");
}
