import { Coinmaster, Item, print, sellPrice, toInt } from "kolmafia";
import { $item, $items, getSaleValue, Session, sumNumbers } from "libram";

const HIGHLIGHT = "orange";

function formatNumber(num: number): string {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function currency(...items: Item[]): () => number {
  const unitCost: [Item, number][] = items.map((i) => {
    const coinmaster = Coinmaster.all().find((c) => sellPrice(c, i) > 0);
    if (!coinmaster) {
      throw `Invalid coinmaster item ${i}`;
    } else {
      return [i, sellPrice(coinmaster, i)];
    }
  });
  return () =>
    Math.max(...unitCost.map(([item, cost]) => garboValue(item) / cost));
}

function complexCandy(): [Item, () => number][] {
  const candies = Item.all().filter((i) => i.candyType === "complex");
  const candyLookup: Item[][] = [[], [], [], [], []];

  for (const candy of candies) {
    const id = toInt(candy) % 5;
    if (candy.tradeable) {
      candyLookup[id].push(candy);
    }
  }
  const candyIdPrices: [Item, () => number][] = candies
    .filter((i) => !i.tradeable)
    .map((i) => [
      i,
      () => Math.min(...candyLookup[toInt(i) % 5].map((i) => garboValue(i))),
    ]);
  return candyIdPrices;
}

const specialValueLookup = new Map<Item, () => number>([
  [
    $item`Freddy Kruegerand`,
    currency(
      ...$items`bottle of Bloodweiser, electric Kool-Aid, Dreadsylvanian skeleton key`
    ),
  ],
  [$item`Beach Buck`, currency($item`one-day ticket to Spring Break Beach`)],
  [
    $item`Coinspiracy`,
    currency(...$items`Merc Core deployment orders, karma shawarma`),
  ],
  [$item`FunFunds™`, currency($item`one-day ticket to Dinseylandfill`)],
  [$item`Volcoino`, currency($item`one-day ticket to That 70s Volcano`)],
  [
    $item`Wal-Mart gift certificate`,
    currency($item`one-day ticket to The Glaciest`),
  ],
  [$item`Rubee™`, currency($item`FantasyRealm guest pass`)],
  [$item`Guzzlrbuck`, currency($item`Never Don't Stop Not Striving`)],
  ...complexCandy(),
  [
    $item`Merc Core deployment orders`,
    () => garboValue($item`one-day ticket to Conspiracy Island`),
  ],
  [
    $item`free-range mushroom`,
    () =>
      3 *
      Math.max(
        garboValue($item`mushroom tea`) - garboValue($item`soda water`),
        garboValue($item`mushroom whiskey`) -
          garboValue($item`fermenting powder`),
        garboValue($item`mushroom filet`)
      ),
  ],
  [
    $item`little firkin`,
    () =>
      garboAverageValue(
        ...$items`martini, screwdriver, strawberry daiquiri, margarita, vodka martini, tequila sunrise, bottle of Amontillado, barrel-aged martini, barrel gun`
      ),
  ],
  [
    $item`normal barrel`,
    () =>
      garboAverageValue(
        ...$items`a little sump'm sump'm, pink pony, rockin' wagon, roll in the hay, slip 'n' slide, slap and tickle`
      ),
  ],
  [
    $item`big tun`,
    () =>
      garboAverageValue(
        ...$items`gibson, gin and tonic, mimosette, tequila sunset, vodka and tonic, zmobie`
      ),
  ],
  [
    $item`weathered barrel`,
    () =>
      garboAverageValue(
        ...$items`bean burrito, enchanted bean burrito, jumping bean burrito`
      ),
  ],
  [
    $item`dusty barrel`,
    () =>
      garboAverageValue(
        ...$items`spicy bean burrito, spicy enchanted bean burrito, spicy jumping bean burrito`
      ),
  ],
  [
    $item`disintegrating barrel`,
    () =>
      garboAverageValue(
        ...$items`insanely spicy bean burrito, insanely spicy enchanted bean burrito, insanely spicy jumping bean burrito`
      ),
  ],
  [
    $item`moist barrel`,
    () =>
      garboAverageValue(
        ...$items`cast, concentrated magicalness pill, enchanted barbell, giant moxie weed, Mountain Stream soda`
      ),
  ],
  [
    $item`rotting barrel`,
    () =>
      garboAverageValue(
        ...$items`Doc Galaktik's Ailment Ointment, extra-strength strongness elixir, jug-o-magicalness, Marquis de Poivre soda, suntan lotion of moxiousness`
      ),
  ],
  [
    $item`mouldering barrel`,
    () =>
      garboAverageValue(
        ...$items`creepy ginger ale, haunted battery, scroll of drastic healing, synthetic marrow, the funk`
      ),
  ],
  [
    $item`barnacled barrel`,
    () =>
      garboAverageValue(
        ...$items`Alewife™ Ale, bazookafish bubble gum, beefy fish meat, eel battery, glistening fish meat, ink bladder, pufferfish spine, shark cartilage, slick fish meat, slug of rum, slug of shochu, slug of vodka, temporary teardrop tattoo`
      ),
  ],
  [$item`PirateRealm fun-a-log`, currency($item`PirateRealm guest pass`)],
]);

const garboValueCache = new Map<Item, number>();
export function garboValue(item: Item): number {
  const cachedValue = garboValueCache.get(item);
  if (cachedValue === undefined) {
    const specialValueCompute = specialValueLookup.get(item);
    const value = specialValueCompute
      ? specialValueCompute()
      : getSaleValue(item);
    garboValueCache.set(item, value);
    return value;
  }
  return cachedValue;
}
export function garboAverageValue(...items: Item[]): number {
  return sumNumbers(items.map(garboValue)) / items.length;
}

const ITEM_COUNT = 10;
export function printLoopSession(session: Session, section: string): void {
  const message = (head: string, meat: number, items: number) =>
    print(
      `${head}, you generated ${formatNumber(
        meat + items
      )} meat, with ${formatNumber(meat)} raw meat and ${formatNumber(
        items
      )} from items`,
      HIGHLIGHT
    );

  const { meat, items, itemDetails } = session.value(garboValue);

  // list the top 3 gaining and top 3 losing items
  const losers = itemDetails
    .sort((a, b) => a.value - b.value)
    .slice(0, ITEM_COUNT);
  const winners = itemDetails
    .sort((a, b) => b.value - a.value)
    .slice(0, ITEM_COUNT);
  print(`Extreme Items:`, HIGHLIGHT);
  for (const detail of [...winners, ...losers]) {
    print(
      `${detail.quantity} ${detail.item} worth ${detail.value} total`,
      HIGHLIGHT
    );
  }

  message(`This ${section}`, meat, items);
}
