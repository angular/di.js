import {annotate, InjectAnnotation, ProvideAnnotation} from '../../src/annotations';

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
annotate(Car, new InjectAnnotation('Engine'));
// @Provide()
annotate(Car, new ProvideAnnotation('Car'));

// @Provide('Engine')
annotate(createEngine, new ProvideAnnotation('Engine'));

// @Inject('Car')
annotate(CyclicEngine, new InjectAnnotation('Car'));
