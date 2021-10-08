import { setClan } from './lib';
import { maximize, myName } from 'kolmafia';

export function main(): void {
    if (myName().toLowerCase() !== 'burningbman') {
        return;
    }

    setClan('Bonus Adventures from Hell');
    maximize('adventures +equip blue LavaCo Lamp', false);
}
