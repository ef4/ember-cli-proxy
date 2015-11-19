/* jshint node: true */
'use strict';

let zlib = require('zlib');
let stream = require('stream');

// http-proxy doesn't let us insert a stream transformation between
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
    let type = proxyRes.headers[ 'content-type' ];
    if (type) {
      type = type.split(';')[0];
    }
    var applyRewrite = definition[type];
    if (!applyRewrite) { return; }

    let i = intercept(res);
    let source = i.source;
    let sink = i.sink;

    let encoding = proxyRes.headers['content-encoding'];
    if (encoding && encoding.toLowerCase() === 'gzip') {
      let newSource = zlib.Gunzip();
      source.pipe(newSource);
      source = newSource;
      let newSink = zlib.Gzip();
      newSink.pipe(sink);
      sink = newSink;
    }

    applyRewrite(source, sink, req);
  };
};
