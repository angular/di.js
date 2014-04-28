import {Inject} from 'di';

import {Heater} from './heater';

@Inject(Heater)
export class Pump {
  constructor(heater) {
    this.heater = heater;
  }

  pump() {
    this.heater.on();
    // console.log('Pumping...');
  }
}
