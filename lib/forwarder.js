/* jshint node: true */
'use strict';

var httpProxy = require('http-proxy');
var Rewriter = require('./rewriter');
var rewriterMiddleware = require('./rewriter-middleware');
var cssURLPattern = /(url\(['"]?)([^)]+?)(['"]?\))/g;
var htmlURLPattern = /((?:href|src)\s*=\s*['"])([^"'<>]+?)(['"])/g;
var goodChunkBoundary = /[ {}<>]/;

module.exports = function Forwarder(proxyConfig, expressApp, ui) {
  var rewriter = new Rewriter(proxyConfig);
  proxyConfig.forwards.forEach(function(fwd) {
    setupForward(fwd, expressApp, ui, rewriter);
  });
  proxyConfig.customForwards.forEach(function(custom) {
    custom.call({
      createProxyServer: function(opts) {
        return createProxyServer(null, ui, rewriter, opts);
      }
    }, expressApp);
  });
};

function createProxyServer(fwd, ui, rewriter, proxyOpts) {
  var proxy = httpProxy.createProxyServer(proxyOpts);
  proxy.on('proxyRes', function(proxyReq, req, res) {
    var writeHead = res.writeHead;
    res.writeHead = function() {
      var location = res.getHeader('location');
      if (location) {
        res.setHeader('location', rewriter.rewriteURL(location, contextFor(fwd, req)));
      }
      writeHead.apply(this, arguments);
    };
    rewriterMiddleware({
      'text/css': function(source, sink, req){
        rewriteStream(cssURLPattern, source, sink, contextFor(fwd, req), rewriter);
      },
      'text/html': function(source, sink, req) {
        rewriteStream(htmlURLPattern, source, sink, contextFor(fwd, req), rewriter);
      }
    })(proxyReq, req, res);
  });

  proxy.on('error', function(err, req) {
    ui.writeLine("While serving " + req.url + ":");
    ui.writeError(err);
  });

  return proxy;
}

function setupForward(fwd, expressApp, ui, rewriter) {
  var proxy = createProxyServer(fwd, ui, rewriter);

  if (fwd.params.headers) {
    proxy.on('proxyReq', function(proxyReq) {
      Object.keys(fwd.params.headers).forEach(function(headerName) {
        proxyReq.setHeader(headerName, fwd.params.headers[headerName]);
      });
    });
  }

  expressApp.use(fwd.params.as, function(req, res) {
    delete req.headers['accept-encoding'];
    proxy.web(req, res, {
      target: fwd.url,
      autoRewrite: true, // rewrites host in redirects
      changeOrigin: true // rewrites host header in requests
    });
  });
}

function contextFor(fwd, req) {
  return {
    relativeTo: (fwd ? fwd.url : '') + req.url,
    myHost: req.protocol + '://' + req.get('host')
  };
}

function rewriteStream(urlPattern, source, sink, reqContext, rewriter){
  var buffer = '';
  source.setEncoding('utf8');

  function rewrite(data) {
    return data.replace(urlPattern, function(m, prefix, url, suffix){
      var rewrittenURL = rewriter.rewriteURL(url, reqContext);
      return prefix + rewrittenURL + suffix;
    });
  }

  source.on('data', function(data) {
    var i = data.length - 1;
    while (i > 0 && !goodChunkBoundary.test(data[i])) {
      i--;
    }
    if (i > 0) {
      sink.write(rewrite(buffer + data.slice(0, i)), 'utf8');
      buffer = '';
    }
    buffer = buffer + data.slice(i, data.length);
  });
  source.on('end', function(data) {
    data = data || '';
    sink.write(rewrite(buffer + data), 'utf8');
    buffer = '';
    sink.end();
  });
}
