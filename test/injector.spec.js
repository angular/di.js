import {Injector} from '../src/injector';
import {Inject, Provide} from '../src/annotations';

module carModule from './fixtures/car';
module houseModule from './fixtures/house';
module shinyHouseModule from './fixtures/shiny_house';




// TODO(vojta): move matchers somewhere ;-)
beforeEach(function() {
  this.addMatchers({
    toBeInstanceOf: function(expectedClass) {
      // TODO(vojta): support not.toBeInstanceOf
      if (this.isNot) {
        throw new Error('not.toBeInstanceOf is not supported!');
      }

      var actual = this.actual;

      this.message = function() {
        return 'Expected ' + jasmine.pp(actual) + ' to be an instance of ' + jasmine.pp(expectedClass);
      };

      return typeof this.actual === 'object' && this.actual instanceof expectedClass;
    }
  });
});


describe('injector', function() {

  it('should work with fn annotations', function() {
    class Engine {
      start() {}
    }

    @Inject(Engine)
    class Car {
      constructor(engine) {
        this.engine = engine;
      }

      start() {}
    }

    var i = new Injector();
    var car = i.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
  });

  it('should load providers', function() {
    class Engine {
      start() {}
    }

    @Inject(Engine)
    class Car {
      constructor(engine) {
        this.engine = engine;
      }

      start() {}
    }

    @Provide(Engine)
    class MockEngine {
      start() {}
    }

    var i = new Injector([MockEngine]);
    var car = i.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(MockEngine);
  });


  it('should use type annotations when available', function() {
    class Engine {
      start() {}
    }

    class Car {
      constructor(e: Engine) {
        this.engine = e;
      }
      start() {}
    }

    var i = new Injector([]);
    var car = i.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
  });


  it('should use @Inject over type annotations', function() {
    class Engine {
      start() {}
    }

    class MockEngine {
      start() {}
    }

    @Inject(MockEngine)
    class Car {
      constructor(e: Engine) {
        this.engine = e;
      }
      start() {}
    }

    var i = new Injector([]);
    var car = i.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(MockEngine);
  });


  it('should use mixed @Inject type annotations', function() {
    class Engine {
      start() {}
    }

    class Bumper {
      start() {}
    }

    class Car {
      constructor(e: Engine, @Inject(Bumper) b) {
        this.engine = e;
        this.bumper = b;
      }
      start() {}
    }

    var i = new Injector([]);
    var car = i.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(car.bumper).toBeInstanceOf(Bumper);
  });


  it('should resolve dependencies', function() {
    var i = new Injector([carModule]);
    var car = i.get('Car');

    expect(car).toBeInstanceOf(carModule.Car);
    expect(car.engine).toBe('strong engine');
  });


  it('should cache instances', function() {
    var i = new Injector([carModule]);
    var car = i.get('Car');

    expect(i.get('Car')).toBe(car);
  });


  it('should throw when no provider', function() {
    var i = new Injector([]);

    expect(() => i.get('NonExisting'))
        .toThrow('No provider for NonExisting!');
  });


  it('should show the full path when no provider', function() {
    var i = new Injector([houseModule]);

    expect(() => i.get('House'))
        .toThrow('No provider for Sink! (House -> Kitchen -> Sink)');
  });


  it('should throw when trying to instantiate a cyclic dependency', function() {
    var useCyclicEngineModule = {
      Engine: carModule.CyclicEngine
    };

    var i = new Injector([carModule, useCyclicEngineModule]);

    expect(() => i.get('Car'))
        .toThrow('Cannot instantiate cyclic dependency! (Car -> Engine -> Car)');
  });


  describe('child', function() {

    it('should load instances from parent injector', function() {
      var parent = new Injector([carModule]);
      var child = parent.createChild([]);

      var carFromParent = parent.get('Car');
      var carFromChild = child.get('Car');

      expect(carFromChild).toBe(carFromParent);
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
      expect(carFromChild).toBeInstanceOf(MockCar);
    });


    it('should force new instances by annotation', function() {
      class RouteScope {}

      class Engine {
        start() {}
      }

      @RouteScope
      @Inject(Engine)
      class Car {
        constructor(engine) {
          this.engine = engine;
        }

        start() {}
      }

      var parent = new Injector([Car, Engine]);
      var child = parent.createChild([], [RouteScope]);

      var carFromParent = parent.get(Car);
      var carFromChild = child.get(Car);

      expect(carFromChild).not.toBe(carFromParent);
      expect(carFromChild.engine).toBe(carFromParent.engine);
    });


    it('should force new instances by annotation using overriden provider', function() {
      class RouteScope {}

      class Engine {
        start() {}
      }

      @RouteScope
      @Provide(Engine)
      class MockEngine {
        start() {}
      }

      var parent = new Injector([MockEngine]);
      var childA = parent.createChild([], [RouteScope]);
      var childB = parent.createChild([], [RouteScope]);

      var engineFromA = childA.get(Engine);
      var engineFromB = childB.get(Engine);

      expect(engineFromA).not.toBe(engineFromB);
      expect(engineFromA).toBeInstanceOf(MockEngine);
      expect(engineFromB).toBeInstanceOf(MockEngine);
    });


    it('should force new instance by annotation using the lowest overriden provider', function() {
      class RouteScope {}

      @RouteScope
      class Engine {
        constructor() {
          "engine"
        }
        start() {}
      }

      @RouteScope
      @Provide(Engine)
      class MockEngine {
        constructor() {
          "mock engine"
        }
        start() {}
      }

      @RouteScope
      @Provide(Engine)
      class DoubleMockEngine {
        start() {}
      }

      var parent = new Injector([Engine]);
      var child = parent.createChild([MockEngine]);
      var grantChild = child.createChild([], [RouteScope]);

      var engineFromParent = parent.get(Engine);
      var engineFromChild = child.get(Engine);
      var engineFromGrantChild = grantChild.get(Engine);

      expect(engineFromParent).toBeInstanceOf(Engine);
      expect(engineFromChild).toBeInstanceOf(MockEngine);
      expect(engineFromGrantChild).toBeInstanceOf(MockEngine);
      expect(engineFromGrantChild).not.toBe(engineFromChild);
    });


    it('should show the full path when no provider', function() {
      var i = new Injector([houseModule]);
      var child = i.createChild([shinyHouseModule]);

      expect(() => child.get('House'))
          .toThrow('No provider for Sink! (House -> Kitchen -> Sink)');
    });
  });
});
