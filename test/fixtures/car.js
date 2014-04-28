import {annotate, Inject, Provide} from '../../src/annotations';

export class Engine {}

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
}

// This is an example of using annotate helper, instead of annotations.

// @Inject(Engine)
annotate(Car, new Inject(Engine));

// @Provide(Engine)
annotate(createEngine, new Provide(Engine));

// @Inject(Car)
annotate(CyclicEngine, new Inject(Car));
// @Provide(Engine)
annotate(CyclicEngine, new Provide(Engine));
