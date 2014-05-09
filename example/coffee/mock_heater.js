import {Inject, Provide} from 'di';

import {Heater} from './heater';

@Inject()
@Provide(Heater)
export class MockHeater {
  on() {}
  off() {}
}
