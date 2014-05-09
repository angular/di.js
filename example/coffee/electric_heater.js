import {Inject, Provide} from 'di';

import {Heater} from './heater';

@Inject()
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
