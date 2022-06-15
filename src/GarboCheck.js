/* global Item */
const {
  cliExecute,
  myDaycount,
  print,
  refreshStash,
  stashAmount,
  waitq,
} = require("kolmafia");

const DELAY = 120;

const garbocheck = () => {
  cliExecute("/whitelist Alliance from Heck");
  refreshStash();
  const needed = [];
  const items = [
    Item.get("Pantsgiving"),
    Item.get("haiku katana"),
    Item.get("Buddy Bjorn"),
    Item.get("Crown of Thrones"),
    Item.get("origami pasties"),
    Item.get("repaid diaper"),
    Item.get("Operation Patriot Shield"),
  ];

  items.forEach(function (item) {
    if (!stashAmount(item)) {
      needed.push(item);
    }
  });

  return needed;
};

const waitForStashItems = () => {
  let neededItems = garbocheck();
  while (neededItems.length) {
    const now = new Date(Date.now());
    print(
      `${now.getHours()}:${now.getMinutes()}: Missing ${neededItems}. Waiting ${DELAY} secs`,
      "red"
    );
    waitq(DELAY);
    neededItems = garbocheck();
  }
};

const runDayOne = () => {
  cliExecute("/whitelist Alliance from Heck");
  waitForStashItems();
  cliExecute("garbo -10");
};

function main() {
  if (myDaycount() === 1) runDayOne();
  if (myDaycount() === 2) {
    cliExecute("/whitelist Old CW's Germ Free Clan");
    cliExecute("create 1 carpe");
    cliExecute("/whitelist Alliance from Heck");
    cliExecute("garbo ascend -10");
  }
}

module.exports.main = main;
