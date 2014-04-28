import {Inject} from 'di';

import {Heater} from './heater';
import {Pump} from './pump';

@Inject(Heater, Pump)
export class CoffeeMaker {
  constructor(heater, pump) {
    this.heater = heater;
    this.pump = pump;
  }

  brew() {
    this.pump.pump();
    this.heater.on();
    // console.log('Brewing...')
  }
}
