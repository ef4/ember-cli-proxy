/* jshint node: true */
'use strict';

let zlib = require('zlib');

module.exports = function rewriterMiddleware(definition) {
  return function(proxyRes, req, res) {
    if(!proxyRes.headers) { return; }
    var applyRewrite = definition[proxyRes.headers[ 'content-type' ]];
    if (!applyRewrite) { return; }

    var realWrite = res.write;
    var realEnd = res.end;
    var encoding = proxyRes.headers['content-encoding'];
    var gunzip, gzip;

    if (encoding && encoding.toLowerCase() === 'gzip') {
      gunzip = zlib.Gunzip();
      gunzip.on('data', function(buf) {
        if (buf) {
          buf = new Buffer(applyRewrite(buf.toString('utf8'), req), 'utf8');
        }
        gzip.write(buf);
      });
      gunzip.on('end', function(data) {
        gzip.end(data);
      });
      gzip = zlib.Gzip();
      gzip.on('data', function(buf) {
        realWrite.call(res, buf);
      });
      gzip.on('end', function(data) {
        realEnd.call(res, data);
      });
    }

    res.write = function(data) {
      if (gunzip) {
        gunzip.write(data);
      } else {
        if (data) {
          data = new Buffer(applyRewrite(data.toString('utf8'), req), 'utf8');
        }
        realWrite.call(res, data);
      }
    };

    res.end = function(data, encoding) {
      if (gunzip) {
        gunzip.end(data);
      } else {
        realEnd.call(res, data, encoding);
      }
    };
  };
};
