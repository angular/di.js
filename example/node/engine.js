var Engine = function() {
  this.state = 'stopped';
};

Engine.prototype = {
  start: function() {
    console.log('Starting engine...');
    this.state = 'running';
  }
};

module.exports = Engine;
