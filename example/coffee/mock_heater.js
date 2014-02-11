import {Provide} from '../../src/annotations';

import {Heater} from './heater';

@Provide(Heater)
export class MockHeater {
  on() {}
  off() {}
}
