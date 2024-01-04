import { Familiar, toItem } from "kolmafia";
import { $familiar, $item, get, have } from "libram";


export const map_to_candy_rich_block = toItem('map to a candy-rich block');

export function getDefaultFamiliar(): Familiar {
    let suggestedFam;
    if (get('screechCombats') > 0) {
        suggestedFam = $familiar`Patriotic Eagle`;
    } else if (!have($item`short glass of water`) && !(get('_mapToACandyRichBlockUsed'))) {
        suggestedFam = $familiar`Shorter-Order Cook`;
    } else if (!have(map_to_candy_rich_block)) {
        suggestedFam = $familiar`Jill-of-All-Trades`;
    } else if (get('cubelingProgress') < 9) {
        suggestedFam = $familiar`Gelatinous Cubeling`;
    } else {
        suggestedFam = $familiar`Grey Goose`;
    }

    return suggestedFam;
}