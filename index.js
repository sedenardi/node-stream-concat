var Transform = require('stream').Transform,
    util = require('util');

var StreamConcat = function(streams, options) {
  Transform.call(this, options);

  var self = this;

  this.streams = streams;
  this.canAddStream = true;
  this.currentStream = null;
  this.streamIndex = 0;
  var nextStream = function() {
    self.currentStream = null;
    if (self.streams.constructor === Array && self.streamIndex < self.streams.length) {
      self.currentStream = self.streams[self.streamIndex++];
    } else if (typeof self.streams === 'function') {
      this.canAddStream = false;
      self.currentStream = self.streams();
    }

    if (self.currentStream === null) {
      this.canAddStream = false;
      self.push(null);
    } else {
      self.currentStream.pipe(self, {end: false});
      self.currentStream.on('end', nextStream);
    }
  };

  nextStream();
};

util.inherits(StreamConcat, Transform);

StreamConcat.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};

StreamConcat.prototype.addStream = function(newStream) {
  if (this.canAddStream)
    this.streams.push(newStream);
  else
    this.emit('error', new Error('Can\'t add stream.'));
};

module.exports = StreamConcat;