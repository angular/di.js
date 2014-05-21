import {Injector} from '../src/injector';
import {Inject, Provide, SuperConstructor, InjectLazy, TransientScope} from '../src/annotations';

import {Car, CyclicEngine} from './fixtures/car';
import {module as houseModule} from './fixtures/house';
import {module as shinyHouseModule} from './fixtures/shiny_house';


describe('injector', function() {

  it('should instantiate a class without dependencies', function() {
    @Inject
    class Car {
      constructor() {}
      start() {}
    }

    var injector = new Injector();
    var car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
  });


  it('should resolve dependencies based on @Inject annotation', function() {
    @Inject
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

    @Inject
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

    @Inject
    @Provide(Size)
    function computeSize() {
      return 0;
    }

    var injector = new Injector([computeSize]);
    var size = injector.get(Size);

    expect(size).toBe(0);
  });


  it('should use type annotations when available', function() {
    @Inject
    class Engine {
      start() {}
    }

    @Inject
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

    @Inject
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
    @Inject
    class Engine {
      start() {}
    }

    @Inject
    class Bumper {
      start() {}
    }

    @Inject
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
    @Inject
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
    var injector = new Injector(houseModule);

    expect(() => injector.get('House'))
        .toThrowError('No provider for Sink! (House -> Kitchen -> Sink)');
  });


  it('should throw when trying to instantiate a cyclic dependency', function() {
    var injector = new Injector([CyclicEngine]);

    expect(() => injector.get(Car))
        .toThrowError('Cannot instantiate cyclic dependency! (Car -> Engine -> Car)');
  });


  it('should show the full path when error happens in a constructor', function() {
    @Inject
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
    @Inject
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


  it('should support "super" to call multiple parent constructors', function() {
    @Inject
    class Foo {}

    @Inject
    class Bar {}

    class Parent {
      @Inject(Foo)
      constructor(foo) {
        this.parentFoo = foo;
      }
    }

    @Inject(SuperConstructor, Foo)
    class Child extends Parent {
      constructor(superConstructor, foo) {
        superConstructor();
        this.childFoo = foo;
      }
    }

    @Inject(Bar, SuperConstructor, Foo)
    class GrandChild extends Child {
      constructor(bar, superConstructor, foo) {
        superConstructor();
        this.grandChildBar = bar;
        this.grandChildFoo = foo;
      }
    }

    var injector = new Injector();
    var instance = injector.get(GrandChild);

    expect(instance.parentFoo).toBeInstanceOf(Foo);
    expect(instance.childFoo).toBeInstanceOf(Foo);
    expect(instance.grandChildFoo).toBeInstanceOf(Foo);
    expect(instance.grandChildBar).toBeInstanceOf(Bar);
  });


  it('should throw an error when used in a factory function', function() {
    class Something {}

    @Provide(Something)
    @Inject(SuperConstructor)
    function createSomething(parent) {
      console.log('init', parent)
    }

    expect(function() {
      var injector = new Injector([createSomething]);
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


  it('should throw an error when null/undefined token requested', function() {
    var injector = new Injector();

    expect(function() {
      injector.get(null);
    }).toThrowError(/Invalid token "null" requested!/);

    expect(function() {
      injector.get(undefined);
    }).toThrowError(/Invalid token "undefined" requested!/);
  });


  // regression
  it('should show the full path when null/undefined token requested', function() {
    @Inject(undefined)
    class Foo {}

    @Inject(null)
    class Bar {}

    var injector = new Injector();

    expect(function() {
      injector.get(Foo);
    }).toThrowError(/Invalid token "undefined" requested! \(Foo -> undefined\)/);

    expect(function() {
      injector.get(Bar);
    }).toThrowError(/Invalid token "null" requested! \(Bar -> null\)/);
  });


  it('should provide itself', function() {
    var injector = new Injector();

    expect(injector.get(Injector)).toBe(injector);
  });


  describe('default providers', function() {

    it('should inject the value for object tokens', function() {
      var foo = {
        bar: true
      };

      @Inject(foo)
      class Bar {
        constructor(foo) {
          this.foo = foo;
        }
      }

      var injector = new Injector();
      var bar = injector.get(Bar);

      expect(bar.foo).toBe(foo);
    });


    it('should inject the value for non-annotated functions', function() {
      var fs = {
        readFile: function() {}
      };

      @Inject(fs.readFile)
      class Foo {
        constructor(readFile) {
          this.readFile = readFile;
        }
      }

      var injector = new Injector();
      var foo = injector.get(Foo);

      expect(foo.readFile).toBe(fs.readFile);
    });
  });


  describe('transient', function() {
    it('should never cache', function() {
      @TransientScope
      @Inject
      class Foo {}

      var injector = new Injector();
      expect(injector.get(Foo)).not.toBe(injector.get(Foo));
    })
  });


  describe('child', function() {

    it('should load instances from parent injector', function() {
      @Inject
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
      @Inject
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

      @Inject
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

      @Inject
      class Engine {
        start() {}
      }

      @Inject
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

      @Inject
      @RouteScope
      class Engine {
        constructor() {}
        start() {}
      }

      @Inject
      @RouteScope
      @Provide(Engine)
      class MockEngine {
        constructor() {}
        start() {}
      }

      @Inject
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
      var parent = new Injector(houseModule);
      var child = parent.createChild(shinyHouseModule);

      expect(() => child.get('House'))
          .toThrowError('No provider for Sink! (House -> Kitchen -> Sink)');
    });


    it('should provide itself', function() {
      var parent = new Injector();
      var child = parent.createChild([]);

      expect(child.get(Injector)).toBe(child);
    });
  });


  describe('lazy', function() {

    it('should instantiate lazily', function() {
      var constructorSpy = jasmine.createSpy('constructor');

      @Inject
      class ExpensiveEngine {
        constructor() {
          constructorSpy();
        }
      }

      class Car {
        constructor(@InjectLazy(ExpensiveEngine) createEngine) {
          this.engine = null;
          this.createEngine = createEngine;
        }

        start() {
          this.engine = this.createEngine();
        }
      }

      var injector = new Injector();
      var car = injector.get(Car);

      expect(constructorSpy).not.toHaveBeenCalled();

      car.start();
      expect(constructorSpy).toHaveBeenCalled();
      expect(car.engine).toBeInstanceOf(ExpensiveEngine);
    });


    // regression
    it('should instantiate lazily from a parent injector', function() {
      var constructorSpy = jasmine.createSpy('constructor');

      @Inject
      class ExpensiveEngine {
        constructor() {
          constructorSpy();
        }
      }

      class Car {
        constructor(@InjectLazy(ExpensiveEngine) createEngine) {
          this.engine = null;
          this.createEngine = createEngine;
        }

        start() {
          this.engine = this.createEngine();
        }
      }

      var injector = new Injector([ExpensiveEngine]);
      var childInjector = injector.createChild([Car]);
      var car = childInjector.get(Car);

      expect(constructorSpy).not.toHaveBeenCalled();

      car.start();
      expect(constructorSpy).toHaveBeenCalled();
      expect(car.engine).toBeInstanceOf(ExpensiveEngine);
    });


    describe('with locals', function() {
      it('should always create a new instance', function() {
        var constructorSpy = jasmine.createSpy('constructor');

        class ExpensiveEngine {
          constructor(@Inject('power') power) {
            constructorSpy();
            this.power = power;
          }
        }

        class Car {
          constructor(@InjectLazy(ExpensiveEngine) createEngine) {
            this.createEngine = createEngine;
          }
        }

        var injector = new Injector();
        var car = injector.get(Car);

        var veyronEngine = car.createEngine('power', 1184);
        var mustangEngine = car.createEngine('power', 420);

        expect(veyronEngine).not.toBe(mustangEngine);
        expect(veyronEngine.power).toBe(1184);
        expect(mustangEngine.power).toBe(420);

        var mustangEngine2 = car.createEngine('power', 420);
        expect(mustangEngine).not.toBe(mustangEngine2);
      });
    });

  });
});
