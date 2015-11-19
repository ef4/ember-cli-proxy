/* jshint node: true */
'use strict';

var stream = require('stream');

// http-proxy doesn't var us insert a stream transformation between
// req and res. So instead we have to splice our way into res here.
function intercept(res) {
  var realWrite = res.write;
  var realEnd = res.end;
  var source = new stream.PassThrough();
  var sink = new stream.PassThrough();

  res.write = function(data, encoding, cb) {
    return source.write(data, encoding, cb);
  };
  res.end = function() {
    source.end();
  };
  res.on = function() {
    return sink.on.apply(sink, arguments);
  };

  sink.on('data', function(data) {
    realWrite.call(res, data);
  });
  sink.on('end', function() {
    realEnd.call(res);
  });
  return { source: source, sink: sink };
}

module.exports = function rewriterMiddleware(definition) {
  return function(proxyRes, req, res) {
    if(!proxyRes.headers) { return; }
    var type = proxyRes.headers[ 'content-type' ];
    if (type) {
      type = type.split(';')[0];
    }
    var applyRewrite = definition[type];
    if (!applyRewrite) { return; }

    var i = intercept(res);
    var source = i.source;
    var sink = i.sink;

    applyRewrite(source, sink, req);
  };
};
