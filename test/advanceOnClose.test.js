/* eslint prefer-arrow-callback: ["off"] */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Readable } = require('stream');

const file1Path = path.join(__dirname, 'file1.txt');
const file2Path = path.join(__dirname, 'file2.txt');
const outputPath = path.join(__dirname, 'output-advanceOnClose.txt');

const StreamConcat = require('../index');

class CustomStream extends Readable {
  constructor(options) {
    super(options);
  }
  _read() {
    if (this.destroyed) {
      return;
    }
  
    this.push(', while this will be skipped,');
    this.push(null);
  }
  _destroy(err, callback) {
    if (err) {
      return callback(err);
    }
    // This need to happen at least in the next event loop,
    // since destroy is called before registering the close event handler
    setTimeout(() => {
      this.destroyed = true;
      this.emit('close', null);
      callback();
    });
  }
}

describe('Concatenation with close', function() {
  before(function(done) {
    const streams = [
      fs.createReadStream(file1Path),
      new CustomStream(),
      fs.createReadStream(file2Path),
    ];

    let index = 0;
    const combinedStream = new StreamConcat(() => {
      const stream = streams[index];
      if (!stream) {
        return null;
      }
      if (index === 1) {
        stream.destroy();
      }
      index++;
      return stream;
    }, {
      advanceOnClose: true
    });

    const output = fs.createWriteStream(outputPath);
    output.on('finish', () => { done(); });

    combinedStream.pipe(output);
  });
  
  it('output should be combination of two files, skipping the custom stream', function() {
    const output = fs.readFileSync(outputPath);
    assert.strictEqual(output.toString(), 'The quick brown fox jumps over the lazy dog.');
  });

  after(function() {
    fs.unlinkSync(outputPath);
  });
});
