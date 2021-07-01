var fs = require('fs');
var path = require('path');
var assert = require('assert');
var Readable = require('stream').Readable;

var file1Path = path.join(__dirname, 'file1.txt');
var file2Path = path.join(__dirname, 'file2.txt');
var outputPath = path.join(__dirname, 'output.txt');
var outputPathIssue6 = path.join(__dirname, 'issue-6.dat');

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
    assert.equal('The quick brown fox jumps over the lazy dog.', output.toString());
  });

  it('#6)', function(done) {
    var stream = require('stream');
    var $ = function(buff) {
      return new stream.Readable({
        read: function() {
          this.push(buff);
          buff = null;
        }
      });
    };

    var header = Buffer.alloc(5);
    var footer = Buffer.alloc(5);
    var total = header.length+footer.length;
    var all = [$(header)];
    for (var i = 0; i < 5; i++) {
      var one = Buffer.alloc(30*1024);
      var two = Buffer.alloc(30*1024);
      total += one.length + two.length;
      all.push( new StreamConcat([ $(one), $(two) ]) );
    }
    all.push($(footer));
    var master = new StreamConcat(all);
    var file = outputPathIssue6;
    var output = fs.createWriteStream(file);
    master.pipe(output);
    output.on('finish', function() {
      assert.equal(fs.readFileSync(file).length, total);
      done();
    });

  });

  it('output should be streamed with async callback', function(done) {
    var streams = [Readable.from(['concatenated']), Readable.from([' ']), Readable.from(['results'])];
    var combined_stream = new StreamConcat(function() {
      return new Promise(function(resolve) {
        setTimeout(function(){ resolve(streams.shift() || null); }, 10);
      });
    });

    var chunks = [];
    combined_stream.on('data', function(chunk){ console.log('DATA', chunk.toString()); chunks.push(chunk); });
    combined_stream.on('end', function(){
      assert.equal(Buffer.concat(chunks).toString(), 'concatenated results');
      done();
    });
  });

  after(function() {
    fs.unlinkSync(outputPath);
    fs.unlinkSync(outputPathIssue6);
  });
});
