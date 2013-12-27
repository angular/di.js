import {InjectAnnotation as Inject, annotate} from '../../src/annotations';

// @Inject('Heater')
export class Pump {
  constructor(heater) {
    this.heater = heater;
  }

  pump() {
    this.heater.on();
    console.log('Pumping...');
  }
}

annotate(Pump, new Inject('Heater'));
