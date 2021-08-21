import { setClan } from './lib';
import { myName, outfit } from 'kolmafia';

export function main(): void {
    if (myName().toLowerCase() !== 'burningbman') {
        return;
    }

    setClan('Bonus Adventures from Hell');
    outfit('Rollover');
}
