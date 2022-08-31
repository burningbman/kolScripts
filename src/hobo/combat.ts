import { myLevel, myClass } from "kolmafia";
import { Macro, $class, $skill, $item, have } from "libram";
import { isDrunk, isGreyYou } from "../lib";

export const MACRO_KILL = Macro.externalIf(isDrunk(), Macro.attack().repeat())
  // .skill($skill`Curse of Weaksauce`)
  // .skill($skill`Micrometeorite`)
  // .skill($skill`Entangling Noodles`)
  .externalIf(isGreyYou(), Macro.skill($skill `Infinite Loop`))
  .externalIf(myLevel() < 15 || myClass() === $class `Pastamancer`, Macro.skill($skill `Saucegeyser`))
  .externalIf(myClass() !== $class `Pastamancer`, Macro.skill($skill `Lunging Thrust-Smack`))
    .repeat();
  
    
  export const SEWER_MACRO = Macro.externalIf(isGreyYou(), Macro.skill($skill`Double Nanovision`)).step("pickpocket")
    .trySkill($skill `Feel Hatred`)
    .trySkill($skill `Snokebomb`)
    .trySkill($skill `Reflex Hammer`)
    .trySkill($skill `Use the Force`)
    .trySkill($skill `Chest X-Ray`)
    .trySkill($skill `Shattering Punch`)
    .trySkill($skill `Gingerbread Mob Hit`)
    .externalIf(have($item `Greatest American Pants`), Macro.runaway()).attack();