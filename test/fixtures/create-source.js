var fs = require('fs');

var counter = 0;
var dataArr = [];

var createSourceData = function(numObjects, numFiles) {
  if(counter == numFiles) return dataArr;
  counter++;

  var data = [];
  for (var i = 0; i < numObjects; i++) {
    var obj = {
      id: i,
      name: 'object ' + i,
      value: Math.floor(Math.random() * numObjects)
    };
    data.push(obj);
  }

  var strData = JSON.stringify(data);
  fs.writeFileSync(__dirname+'/sourceData-'+counter+'.json', strData);
  dataArr.push(data);
  createSourceData(numObjects, numFiles);
};

exports.createSourceData = createSourceData;
