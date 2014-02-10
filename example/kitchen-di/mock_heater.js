import {Provide} from 'di/annotations';
import {Heater} from './coffee_maker/heater';

@Provide(Heater)
export class MockHeater {
  constructor() {}

  on() {
    console.log('Turning on the MOCK heater...');
  }

  off() {}
}
