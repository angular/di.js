import {Provide} from '../../src/annotations';
import {Heater} from './coffee_maker/heater';

@Provide(Heater)
class MockHeater {
  constructor(electricity) {
    this.name = 'mock heater';
  }

  on() {
    console.log('Turning on the MOCK heater...');
  }

  off() {}
}
