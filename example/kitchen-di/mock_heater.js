import {Inject, Provide} from 'di';
import {Heater} from './coffee_maker/heater';


@Inject
@Provide(Heater)
export class MockHeater {
  constructor() {}

  on() {
    console.log('Turning on the MOCK heater...');
  }

  off() {}
}
