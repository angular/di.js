import {InjectAnnotation as Inject} from '../../src/annotations';

@Inject('Heater')
export class Pump {
  constructor(heater) {
    this.heater = heater;
  }

  pump() {
    this.heater.on();
    console.log('Pumping...');
  }
}
