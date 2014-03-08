class Logger {
  constructor(target) {
    this.target = target || window.console;
  }
}

['info', 'log', 'warn', 'error'].forEach(function(method) {
  Logger.prototype[method] = function(message) {
    this.target[method](message);
  };
});

export default Logger;
