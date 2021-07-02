var Transform = require('stream').Transform,
    util = require('util');

var StreamConcat = function(streams, options) {
  if (!options)
    options = {};

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

    var pipeStream = function(){
      if (self.currentStream === null) {
        this.canAddStream = false;
        self.end();
      } else if (typeof self.currentStream.then=='function') {
        self.currentStream.then(function(s){
          self.currentStream = s;
          pipeStream();
        });
      } else {
        self.currentStream.pipe(self, {end: false});
        var streamClosed = false;
        var goNext = function() {
          if (streamClosed) {
            return;
          }
          streamClosed = true;
          nextStream();
        };
  
        self.currentStream.on('end', goNext);
        if (options.advanceOnClose) {
          self.currentStream.on('close', goNext);
        }
      }
    };
    pipeStream();
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
