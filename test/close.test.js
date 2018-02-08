var fs = require('fs');
var path = require('path');
var assert = require('assert');
var util = require('util');
var Readable = require('stream').Readable;

function CustomStream(options) {
  Readable.call(this, options);
}
util.inherits(CustomStream, Readable);

CustomStream.prototype._read = function(size) {
  if (this.destroyed)
	  return;
  
  this.push(", while this will be skipped,");
  this.push(null);
};

CustomStream.prototype._destroy = function(err, callback) {
  // This need to happen at least in the next event loop,
  // since destroy is called before registering the close event handler
  setTimeout(() => {
    this.destroyed = true;
    this.emit("close", null);
    callback(); 
  });
};

var file1Path = path.join(__dirname, 'file1.txt');
var file2Path = path.join(__dirname, 'file2.txt');
var outputPath = path.join(__dirname, 'output.txt');

var StreamConcat = require('../index');

describe('Concatenation with close', function() {
  before(function(done) {
	var streams = [
	  fs.createReadStream(file1Path),
	  new CustomStream(),
	  fs.createReadStream(file2Path),
	];
	
	var index = 0;
    var combinedStream = new StreamConcat(function() {
	  var stream = streams[index];
	  
	  if (!stream)
	    return null;
	  
	  if (index === 1)
	    stream.destroy();
	  
	  index++;
	
	  return stream;
	}, {
		close: true
	});

    var output = fs.createWriteStream(outputPath);
    output.on('finish', function() { done(); });

    combinedStream.pipe(output);
  });
  it('output should be combination of two files, skipping the custom stream', function() {
    var output = fs.readFileSync(outputPath);
    assert.equal('The quick brown fox jumps over the lazy dog.', output.toString());
  });
  after(function() {
    fs.unlinkSync(outputPath);
  });
});
