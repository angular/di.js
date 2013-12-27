import {Injector} from '../src/injector';

module carModule from './fixtures/car';
module houseModule from './fixtures/house';
module shinyHouseModule from './fixtures/shiny_house';


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


  it('should throw when no provider', function() {
    var i = new Injector([]);

    expect(function() {i.get('NonExisting')}).toThrow('No provider for NonExisting!');
  });


  it('should show the full path when no provider', function() {
    var i = new Injector([houseModule]);

    expect(function() {i.get('House')}).toThrow('No provider for Sink! (House -> Kitchen -> Sink)');
  });


  it('should throw when trying to instantiate a cyclic dependency', function() {
    var useCyclicEngineModule = {
      Engine: carModule.CyclicEngine
    };

    var i = new Injector([carModule, useCyclicEngineModule]);

    expect(function() {i.get('Car')}).toThrow('Cannot instantiate cyclic dependency! (Car -> Engine -> Car)');
  });


  describe('child', function() {

    it('should load instances from parent injector', function() {
      var parent = new Injector([carModule]);
      var child = parent.createChild([]);

      expect(parent.get('Car')).toBe(child.get('Car'));
    });


    it('should override providers in a child injector', function() {
      class MockCar {
        run() {}
      }

      var mockCarModule = {
        Car: MockCar
      };

      var parent = new Injector([carModule]);
      var child = parent.createChild([mockCarModule]);

      var carFromParent = parent.get('Car');
      var carFromChild = child.get('Car');

      expect(carFromParent).not.toBe(carFromChild);
      expect(carFromChild instanceof MockCar).toBe(true);
    });


    it('should show the full path when no provider', function() {
      var i = new Injector([houseModule]);
      var child = i.createChild([shinyHouseModule]);

      expect(function() {child.get('House')}).toThrow('No provider for Sink! (House -> Kitchen -> Sink)');
    });
  });
});
