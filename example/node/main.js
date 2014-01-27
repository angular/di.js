var Injector = require('di').Injector;
var Car = require('./car');


// kick it off
var injector = new Injector([]);
var car = injector.get(Car);

car.run();
