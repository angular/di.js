var allModules = [];

var ngLoader = new Loader({
  // System.normalize is broken, this is just a hacky version that works for me right now.
  normalize: function (name, parentName) {
    var parts = parentName.replace(/\/[^\/]*$/, '/' + name).split('/');

    for(var i = 0; i < parts.length; i++) {
      if (parts[i] === '.') {
        parts.splice(i, 1);
        i = i - 1;
        continue;
      }

      if (parts[i] === '..' && parts[i - 1] !== '..' && parts[i - 1] !==  '.' && parts[i - 1]) {
        parts.splice(i - 1, 2);
        i = i - 2;
        continue;
      }
    }

    return parts.join('/');
  },
  locate: function (load) {
    return System.locate(load);
  },
  fetch: function (load) {
    return System.fetch(load);
  },

  // This is the only special thing that ngLoader does.
  // It stores a reference to every module loaded,
  // so that we can evetually load them with DI.
  instantiate: function (load) {
    return System.instantiate(load).then(function(module) {
      var execute = module.execute;
      module.execute = function() {
        var executed = execute.apply(module, arguments);
        allModules.push(executed);
        // console.log('EXECUTED', executed)
        return executed;
      };
      return module;
      // console.log('INST', inst.execute())
    });
  }
});

var errorHandler = function(err) {
  console.error(err.message, err.stack);
};

// TODO(vojta): read this from <script main="./main"> or something
ngLoader.import('./main').then(function() {
  console.log('All app modules loaded.');

  ngLoader.import('../../src/injector').then(function(injector) {
    console.log('Injector loaded.');

    var i = new injector.Injector(allModules);

    // This will be bootstrapping Angular.
    i.get('CoffeeMaker').brew();
  }, errorHandler);
}, errorHandler);
