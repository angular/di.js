import {annotate, Inject, Provide} from '../../src/annotations';

export class Car {
  constructor(engine) {
    this.engine = engine;
  }

  start() {}
}

export function createEngine() {
  return 'strong engine';
}

export class CyclicEngine {
  constructor(car) {}

  start() {}
}



// @Inject('Engine')
annotate(Car, new Inject('Engine'));
// @Provide()
annotate(Car, new Provide('Car'));

// @Provide('Engine')
annotate(createEngine, new Provide('Engine'));

// @Inject('Car')
annotate(CyclicEngine, new Inject('Car'));
