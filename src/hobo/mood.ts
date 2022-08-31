import { myClass, toClass, haveEffect, myAdventures, maximize, useSkill, myHp } from "kolmafia";
import { $effect, $skill, Mood } from "libram";
import { isGreyYou } from "../lib";

export function bubbleUp  (): void {
    if (!isGreyYou()) {
      if (haveEffect($effect`Blood Bubble`) < 1.04 * myAdventures()) {
        maximize("hp", false);
        useSkill($skill`Cannelloni Cocoon`);

        while (haveEffect($effect`Blood Bubble`) < 1.04 * myAdventures()) {
          useSkill($skill`Blood Bubble`, Math.floor(myHp() / 30) - 1);
          useSkill($skill`Cannelloni Cocoon`);
        }
      }
    }
}

export const FAM_MOOD = new Mood();


export const HOBO_MOOD = new Mood({
  useNativeRestores: true
});

if (!isGreyYou()) {
    FAM_MOOD.effect($effect`Empathy`);
    FAM_MOOD.effect($effect`Leash of Linguini`);
    FAM_MOOD.effect($effect`Blood Bond`);    

HOBO_MOOD.skill($skill `Astral Shell`)
  .skill($skill `Get Big`)
  .skill($skill `Blood Bubble`)
  .skill($skill `Elemental Saucesphere`)
  .skill($skill `Rage of the Reindeer`)
  .skill($skill `Stevedave's Shanty of Superiority`)
  .skill($skill `Springy Fusilli`)
  .skill($skill `Blessing of the War Snapper`)
  .skill($skill `Carol of the Hells`)
  .skill($skill `Walberg's Dim Bulb`)
  .skill($skill `Suspicious Gaze`);
}