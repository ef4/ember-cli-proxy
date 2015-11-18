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

  res.write = function(data) {
    return source.write(data);
  };
  res.end = function(data) {
    source.end(data);
  };
  sink.on('data', function(data) {
    realWrite.call(res, data);
  });
  sink.on('end', function(data) {
    realEnd.call(res, data);
  });
  return { source: source, sink: sink };
}

module.exports = function rewriterMiddleware(definition) {
  return function(proxyRes, req, res) {
    if(!proxyRes.headers) { return; }
    var applyRewrite = definition[proxyRes.headers[ 'content-type' ]];
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
