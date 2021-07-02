const { Transform } = require('stream');

class StreamConcat extends Transform {
  constructor(streams, options = { }) {
    super(options);
    this.streams = streams;
    this.options = options;
    this.canAddStream = true;
    this.currentStream = null;
    this.streamIndex = 0;

    this.nextStream();
  }
  addStream(newStream) {
    if (!this.canAddStream) {
      return this.emit('error', new Error('Can\'t add stream.'));
    }
    this.streams.push(newStream);
  }
  nextStream() {
    this.currentStream = null;
    if (this.streams.constructor === Array && this.streamIndex < this.streams.length) {
      this.currentStream = this.streams[this.streamIndex++];
    } else if (typeof this.streams === 'function') {
      this.canAddStream = false;
      this.currentStream = this.streams();
    }

    const pipeStream = () => {
      if (this.currentStream === null) {
        this.canAddStream = false;
        this.end();
      } else if (typeof this.currentStream.then === 'function') {
        this.currentStream.then((s) => {
          this.currentStream = s;
          pipeStream();
        });
      } else {
        this.currentStream.pipe(this, { end: false });
        let streamClosed = false;
        const goNext = () => {
          if (streamClosed) {
            return;
          }
          streamClosed = true;
          this.nextStream();
        };
  
        this.currentStream.on('end', goNext);
        if (this.options.advanceOnClose) {
          this.currentStream.on('close', goNext);
        }
      }
    };
    pipeStream();
  }
  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
}

module.exports = StreamConcat;
