/* vim :set ts=2, sts=2, et */

var assert = require('assert'),
  sourceData = require('./fixtures/create-source'),
  path = require('path'),
  _und = require('underscore'),
  fs = require('fs'),
  StreamConcat = require('../index');

describe('StreamConcat', function(){
  var data = sourceData.createSourceData(50, 3);

  var sourceFiles = [
    path.join(__dirname, './fixtures/sourceData-1.json'),
    path.join(__dirname, './fixtures/sourceData-2.json'),
    path.join(__dirname, './fixtures/sourceData-3.json')
  ];

  it('combines an array read streams', function(){
    this.timeout(3000);

    var streams = _und.map(sourceFiles, function(filePath){
      return fs.createReadStream(filePath);
    });

    var combinedStream = new StreamConcat(streams);

    assert(combinedStream instanceof StreamConcat);
    assert(_und.isArray(combinedStream.streams));
    assert(combinedStream.streams === streams);
    assert(combinedStream._canAddStream());

    combinedStream.run(function(err){
      assert.ifError(err);
      assert(combinedStream.streams.length === 0);
      assert(!combinedStream._canAddStream());
    });
  });

  it('combines a single function stream', function(){
    this.timeout(3000);

    var fileNames = sourceFiles;
    var fileIndex = 0;
    var nextStream = function() {
      if (fileIndex === fileNames.length) 
        return null;

      return fs.createReadStream(fileNames[fileIndex++]);
    };

    var combinedStream = new StreamConcat(nextStream);
    assert(combinedStream instanceof StreamConcat);
    assert(_und.isFunction(combinedStream.streams));
    assert(!combinedStream._canAddStream());

    combinedStream.run(function(err){
      assert.ifError(err);
      assert(combinedStream.streams.length === 0);
      assert(!combinedStream._canAddStream())
    });
  });
});

