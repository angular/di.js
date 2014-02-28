import {Injector} from '../src/injector';
import {Inject, Provide, SuperConstructor} from '../src/annotations';

module carModule from './fixtures/car';
module houseModule from './fixtures/house';
module shinyHouseModule from './fixtures/shiny_house';

// TODO(vojta): refactor to not use strings once we can do toString() on classes
describe('injector', function() {

  it('should instantiate a class without dependencies', function() {
    class Car {
      constructor() {}
      start() {}
    }

    var injector = new Injector();
    var car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
  });


  it('should resolve dependencies based on @Inject annotation', function() {
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

    var injector = new Injector();
    var car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
  });


  it('should override providers', function() {
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

    var injector = new Injector([MockEngine]);
    var car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(MockEngine);
  });


  it('should allow factory function', function() {
    class Size {}

    @Provide(Size)
    function computeSize() {
      return 0;
    }

    var injector = new Injector([computeSize]);
    var size = injector.get(Size);

    expect(size).toBe(0);
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

    var injector = new Injector([]);
    var car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
  });


  it('should use @Inject over type annotations', function() {
    class Engine {
      start() {}
    }

    class MockEngine extends Engine {
      start() {}
    }

    @Inject(MockEngine)
    class Car {
      constructor(e: Engine) {
        this.engine = e;
      }
      start() {}
    }

    var injector = new Injector([]);
    var car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(MockEngine);
  });


  it('should use mixed @Inject with type annotations', function() {
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

    var injector = new Injector([]);
    var car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(car.bumper).toBeInstanceOf(Bumper);
  });


  it('should cache instances', function() {
    class Car {
      constructor() {}
      start() {}
    }

    var injector = new Injector();
    var car = injector.get(Car);

    expect(injector.get(Car)).toBe(car);
  });


  it('should throw when no provider defined', function() {
    var injector = new Injector();

    expect(() => injector.get('NonExisting'))
        .toThrowError('No provider for NonExisting!');
  });


  it('should show the full path when no provider defined', function() {
    var injector = new Injector([houseModule]);

    expect(() => injector.get('House'))
        .toThrowError('No provider for Sink! (House -> Kitchen -> Sink)');
  });


  it('should throw when trying to instantiate a cyclic dependency', function() {
    var useCyclicEngineModule = {
      Engine: carModule.CyclicEngine
    };

    var injector = new Injector([carModule, useCyclicEngineModule]);

    expect(() => injector.get('Car'))
        .toThrowError('Cannot instantiate cyclic dependency! (Car -> Engine -> Car)');
  });


  it('should show the full path when error happens in a constructor', function() {
    class Engine {
      constructor() {
        throw new Error('This engine is broken!');
      }
    }

    @Inject(Engine)
    class Car {
      constructor(e) {}
    }

    var injector = new Injector();

    expect(() => injector.get(Car))
      .toThrowError(/Error during instantiation of Engine! \(Car -> Engine\)/);
  });


  it('should support "super" to call a parent constructor', function() {
    class Something {}

    class Parent {
      @Inject(Something)
      constructor(something) {
        this.parentSomething = something;
      }
    }

    @Inject(SuperConstructor, Something)
    class Child extends Parent {
      constructor(superConstructor, something) {
        superConstructor();
        this.childSomething = something;
      }
    }

    var injector = new Injector();
    var instance = injector.get(Child);

    expect(instance.parentSomething).toBeInstanceOf(Something);
    expect(instance.childSomething).toBeInstanceOf(Something);
    expect(instance.childSomething).toBe(instance.parentSomething);
  });


  it('should throw an error when used in a factory function', function() {
    class Something {}

    @Provide(Something)
    @Inject(SuperConstructor)
    function createSomething(parent) {
      console.log('init', parent)
    }

    var injector = new Injector([createSomething]);

    expect(function() {
      injector.get(Something);
    }).toThrowError(/Only classes with a parent can ask for SuperConstructor!/);
  });


  it('should throw an error when used in a class without any parent', function() {
    @Inject(SuperConstructor)
    class WithoutParent {}

    var injector = new Injector();

    expect(function() {
      injector.get(WithoutParent);
    }).toThrowError(/Only classes with a parent can ask for SuperConstructor!/);
  });


  it('should provide itself', function() {
    var injector = new Injector();

    expect(injector.get(Injector)).toBe(injector);
  });


  describe('child', function() {

    it('should load instances from parent injector', function() {
      class Car {
        start() {}
      }

      var parent = new Injector([Car]);
      var child = parent.createChild([]);

      var carFromParent = parent.get(Car);
      var carFromChild = child.get(Car);

      expect(carFromChild).toBe(carFromParent);
    });


    it('should create new instance in a child injector', function() {
      class Car {
        start() {}
      }

      @Provide(Car)
      class MockCar {
        start() {}
      }

      var parent = new Injector([Car]);
      var child = parent.createChild([MockCar]);

      var carFromParent = parent.get(Car);
      var carFromChild = child.get(Car);

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
        constructor() {}
        start() {}
      }

      @RouteScope
      @Provide(Engine)
      class MockEngine {
        constructor() {}
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
      var parent = new Injector([houseModule]);
      var child = parent.createChild([shinyHouseModule]);

      expect(() => child.get('House'))
          .toThrowError('No provider for Sink! (House -> Kitchen -> Sink)');
    });


    it('should provide itself', function() {
      var parent = new Injector();
      var child = parent.createChild([]);

      expect(child.get(Injector)).toBe(child);
    });
  });
});
