/* jshint node: true */
'use strict';

let httpProxy = require('http-proxy');
let Rewriter = require('./rewriter');
let rewriterMiddleware = require('./rewriter-middleware');
let cssURLPattern = /(url\(['"]?)([^)]+?)(['"]?\))/g;
let htmlURLPattern = /((?:href)|(?:src)\s*=\s*['"])([^)]+)(['"])/g;

module.exports = function Forwarder(proxyConfig, expressApp, ui) {
  let rewriter = new Rewriter(proxyConfig);
  proxyConfig.forwards.forEach(function(fwd) {
    setupForward(fwd, expressApp, ui, rewriter);
  });
};

function setupForward(fwd, expressApp, ui, rewriter) {
  let proxy = httpProxy.createProxyServer();

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
      'text/css': function(data, req){
        return data.replace(cssURLPattern, function(m, prefix, url, suffix){
          let rewrittenURL = rewriter.rewriteURL(url, contextFor(fwd, req));
          return prefix + rewrittenURL + suffix;
        });
      },
      'text/html': function(data, req) {
        return data.replace(htmlURLPattern, function(m, prefix, url, suffix){
          let rewrittenURL = rewriter.rewriteURL(url, contextFor(fwd, req));
          return prefix + rewrittenURL + suffix;
        });
      }
    })(proxyReq, req, res);
  });

  proxy.on('error', function(err, req) {
    ui.writeLine("While serving " + req.url + ":");
    ui.writeError(err);
  });

  expressApp.use(fwd.as, function(req, res) {
    proxy.web(req, res, {
      target: fwd.url,
      autoRewrite: true, // rewrites host in redirects
      changeOrigin: true // rewrites host header in requests
    });
  });
}

function contextFor(fwd, req) {
  return {
    relativeTo: fwd.url + req.url,
    myHost: req.protocol + '://' + req.get('host')
  };
}
