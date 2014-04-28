import {Provide} from 'di';

import {Heater} from './heater';

@Provide(Heater)
export class ElectricHeater {
  constructor() {}

  on() {
    // console.log('Turning on electric heater...');
  }

  off() {
    // console.log('Turning off electric heater...');
  }
}
