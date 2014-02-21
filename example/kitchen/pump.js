
export class Pump {
  constructor(heater, electricity) {
    this.heater = heater;
    this.electricity = electricity;
  }

  pump() {
    console.log('Pumping the water...');
  }
}
