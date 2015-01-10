var Transform = require('stream').Transform,
  async = require('async'),
  _und = require('underscore'),
  util = require('util');

function StreamError(msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg;
}

util.inherits(StreamError, Error);
StreamError.prototype.name = 'Stream Error';

function StreamConcat(streams, options) {
  Transform.call(this, options);

  this.streams = streams;

  return this;
}

util.inherits(StreamConcat, Transform);

StreamConcat.prototype.run = function(cb){
  var self = this;
  cb = (cb && _und.isFunction(cb)) ? cb : _und.noop();
  return async.doWhilst(
    function(cb){
      var stream;
      if(_und.isArray(self.streams)) stream = self.streams.shift();
      else if(_und.isFunction(self.streams)) stream = self.streams();
      else return cb(new StreamError("Unknown stream type"));

      stream.pipe(self, { end: false });
      stream.on('end', cb);
    },
    function(){ return !_und.isEmpty(self.streams); }, 
    function(err){
      if(err){
        self.emit('error', err);
        return cb(err);
      }
      self.push(null);
      return cb(null);
    }
  );
};

  
StreamConcat.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};

StreamConcat.prototype._canAddStream = function() {
  if(_und.isArray(this.streams)) return true;
  else return false;
};

StreamConcat.prototype.addStream = function(newStream) {
  if (this._canAddStream(newStream))
    this.streams.push(newStream);
  else
    this.emit('error', new StreamError('Can\'t add stream.'));
};

module.exports = StreamConcat;