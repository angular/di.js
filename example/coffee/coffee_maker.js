import {InjectAnnotation as Inject, annotate} from '../../src/annotations';


// @Inject('Heater', 'Pump')
class CoffeeMaker {
  constructor(heater, pump) {
    this.heater = heater;
    this.pump = pump;
  }

  brew() {
    this.pump.pump();
    this.heater.on();
    console.log('Brewing...')
  }
}

annotate(CoffeeMaker, new Inject('Heater', 'Pump'));

export {CoffeeMaker};
