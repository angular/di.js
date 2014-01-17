
export class Dishwasher {
  constructor(electricity) {
    this.electricity = electricity;
  }

  add(item) {
    console.log('Putting ' + item + ' into the dishwasher...');
  }
  wash() {
    console.log('Running the dishwasher...');
  }
}
