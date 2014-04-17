function evalInInspectedWindow(fn, args, cb) {
  var code = '(' + fn.toString() + ')(window, ' + JSON.stringify(args) + ')';
  chrome.devtools.inspectedWindow.eval(code, cb);
}

app.factory('data', function($q) {
  var d = $q.defer();

  evalInInspectedWindow(function(window) {
    var injectors = window.__di_dump__.injectors;
    var tokens = Object.create(null);

    // Serialize the map so that we can pass it back to the console panel.
    window.__di_dump__.tokens.forEach(function(id, token) {
      tokens[id] = token.name;
    });

    return {
      injectors: injectors,
      tokens: tokens
    };
  }, [], function(dump) {
    d.resolve(dump);
  });

  d.promise.success = d.promise.then;
  return d.promise;
});
