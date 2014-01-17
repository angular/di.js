import {Injector} from '../../src/injector';
import {Kitchen} from './kitchen';
import {MockHeater} from './mock_heater';


function main() {
  // TODO(vojta): support loading a provider directly
  var injector = new Injector([{x: MockHeater}]);
  var kitchen = injector.get(Kitchen);

  kitchen.makeBreakfast();
}

main();


