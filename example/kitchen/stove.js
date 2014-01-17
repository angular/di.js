
export class Stove {
  constructor(electricity) {
    this.electricity = electricity;
  }

  add(item) {
    console.log('Adding ' + item + ' onto the stove.');
  }

  on() {
    console.log('Turning on the stove...');
  }

  off() {
    console.log('Turning off the stove...');
  }
}
