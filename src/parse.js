let wtf = require('wtf_wikipedia');
//these methods may run in their own processes

//https://stackoverflow.com/questions/12397118/mongodb-dot-in-key-name/30254815#30254815
const encodeStr = function(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/^\$/, '\\u0024')
    .replace(/\./g, '\\u002e');
};

//tables & infoboxes & citations could potentially have unsafe keys
const encodeData = function(data) {
  data = data || {};
  //encode keys in infoboxes
  if (data.infoboxes && data.infoboxes.length > 0) {
    data.infoboxes.forEach(info => {
      let keys = Object.keys(info.data);
      keys.forEach(k => {
        if (k !== encodeStr(k)) {
          info.data[encodeStr(k)] = info.data[k];
          delete info.data[k];
        }
      });
    });
  }
  //encode keys in citations
  if (data.citations && data.citations.length > 0) {
    data.citations.forEach(obj => {
      let keys = Object.keys(obj);
      keys.forEach(k => {
        if (k !== encodeStr(k)) {
          obj[encodeStr(k)] = obj[k];
          delete obj[k];
        }
      });
    });
  }
  //cleanup table-keys
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach(o => {
      if (o.tables && o.tables.length > 0) {
        o.tables.forEach(table => {
          table.forEach(row => {
            let keys = Object.keys(row);
            keys.forEach(k => {
              if (k !== encodeStr(k)) {
                row[encodeStr(k)] = row[k];
                delete row[k];
              }
            });
          });
        });
      }
    });
  }
  return data;
};

//get parsed json from the wiki markup
const parse = function(options, collection, cb) {
  let data = wtf.parse(options.script);
  //dont insert this if it's a redirect
  if (options.skip_redirects === true && data.type === 'redirect') {
    return cb()
  }
  if (options.skip_disambig === true && data.type === 'disambiguation') {
    return cb()
  }
  data = encodeData(data);
  data.title = data.title || options.title;
  data._id = encodeStr(data.title);
  // options.collection.update({ _id: data._id }, data, { upsert: true }, function(e) {
  collection.insert(data, function(e) {
    if (e) {
      console.warn(e);
      return cb(e);
    }
    return cb();
  });
};

//get readable text from the wiki markup
const plaintext = function(options, collection, cb) {
  let data = {
    title: options.title,
    _id: encodeStr(options.title),
    plaintext: wtf.plaintext(options.script)
  };
  collection.insert(data, function(e) {
    if (e) {
      console.log(e);
      return cb(e);
    }
    return cb();
  });
};

module.exports = {
  parse: parse,
  plaintext: plaintext
};
