import {Injector} from '../src/injector';

module carModule from './fixtures/car';

describe('injector', function() {
  it('should resolve dependencies', function() {
    var i = new Injector([carModule]);
    var car = i.get('Car');

    expect(car).toBeDefined();
    expect(car instanceof carModule.Car).toBe(true);
    expect(car.engine).toBe('strong engine');
  });

  it('should cache instances', function() {
    var i = new Injector([carModule]);

    expect(i.get('Car')).toBe(i.get('Car'));
  });
});
