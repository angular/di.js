import {Inject} from 'di';
import {Electricity} from '../electricity';

@Inject(Electricity)
export class Heater {
  constructor(electricity) {
    this.electricity = electricity;
  }

  on() {
    console.log('Turning on the coffee heater...');
  }

  off() {
    console.log('Turning off the coffee heater...');
  }
}
