import {InjectAnnotation as Inject} from '../../src/annotations';


@Inject('Heater', 'Pump')
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

export {CoffeeMaker};
