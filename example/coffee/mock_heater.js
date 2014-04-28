import {Provide} from 'di';

import {Heater} from './heater';

@Provide(Heater)
export class MockHeater {
  on() {}
  off() {}
}
