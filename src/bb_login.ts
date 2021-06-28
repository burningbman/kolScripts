import { get, $item, have } from 'libram';
import { use, visitUrl, runChoice, cliExecute, wait, isUnrestricted, setAutoAttack, myName } from 'kolmafia';
import { setClan } from './lib';

export function main() {
    if (myName().toLowerCase() !== 'burningbman') {
        return;
    }

    if (!get('_universalSeasoningUsed') && have($item`Universal Seasoning`)) {
        use($item`Universal Seasoning`);
    }

    if (!get('_glitchItemImplemented') && have($item`glitch season reward name`)) {
        cliExecute('autoattack attack');
        use($item`glitch season reward name`);
        visitUrl('inv_eat.php?which=3&whichitem=10207pwd=');
        setAutoAttack(0);
    }

    // Fortune Teller
    if (isUnrestricted($item`Clan Carnival Game`) && get('_clanFortuneConsultUses') < 3) {
        setClan('Bonus Adventures from Hell');
        for (let i = get('_clanFortuneConsultUses'); i < 3; i++) {
            cliExecute('fortune cheesefax');
            wait(5);
        }
    }

    if (get('kingLiberated')) {
        // Saber Fam Weight upgrade
        if (get('_saberMod') === 0) {
            visitUrl("main.php?action=may4");
            runChoice(4);
        }

        // Cargo Shorts
        if (!get('_cargoPocketEmptied')) {
            let deskBellPockets = [517, 590, 653, 553, 587];

            let emptiedPockets = get('cargoPocketsEmptied');
            let pocket = deskBellPockets.find(pocketNum => {
                if (typeof(emptiedPockets) === 'number') {
                    return emptiedPockets === pocketNum;
                }

                return !emptiedPockets.includes(pocketNum.toString())
            });
            if (pocket) {
                cliExecute(`cargo ${pocket}`);
            }
        }

        // Boxing Daycare
        if (get('_daycareGymScavenges') === 0) {
            visitUrl("place.php?whichplace=town_wrong&action=townwrong_boxingdaycare");
            let choices = [
                3, // enter daycare
                2, // scavenge
                1, // recruit toddlers
                4, // spar
                5, // return to lobby
                4, // leave daycare
            ]
            choices.forEach((c) => runChoice(c));
        }

        // prep for mushroom garden fight
        use($item`Oscus's neverending soda`);
        cliExecute('autoattack saucegeyser');
    }

    if (!get('breakfastCompleted')) {
        cliExecute('breakfast');
        setAutoAttack(0);
    }
}
