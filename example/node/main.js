var di = require('di');
var Car = require('./car');


var injector = new di.Injector([]);

console.log('Getting in the car...');
var car = injector.get(Car);

car.run();

if (car.isRunning()) {
  console.log('The car is running');
} else {
  console.log('The car is stopped');
}
