var fs = require('fs');
var path = require('path');
const assert = require('assert');

var file1Path = path.join(__dirname, 'file1.txt');
var file2Path = path.join(__dirname, 'file2.txt');
var outputPath = path.join(__dirname, 'output.txt');

var StreamConcat = require('../index');

describe('Concatenation', function() {
  before(function(done) {
    var file1 = fs.createReadStream(file1Path);
    var file2 = fs.createReadStream(file2Path);
    var combinedStream = new StreamConcat([file1, file2]);

    var output = fs.createWriteStream(outputPath);
    output.on('finish', function() { done(); });

    combinedStream.pipe(output);
  });
  it('output should be combination of two files', function() {
    var output = fs.readFileSync(outputPath);
    assert('The quick brown fox jumps over the lazy dog.', output.toString());
  });
});
