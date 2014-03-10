import {Inject} from '../../src/annotations';

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
