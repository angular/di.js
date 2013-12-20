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

// @Inject('engine')
annotate(Car, new InjectAnnotation('engine'));
// @Provide()
annotate(Car, new ProvideAnnotation('Car'));

// @Provide('engine')
annotate(createEngine, new ProvideAnnotation('engine'));
