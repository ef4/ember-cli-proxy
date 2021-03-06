/* jshint node: true */

function definition(NURL) {
  'use strict';

  function Rewriter(proxyConfig) {
    this.rules = proxyConfig.rewriters;
  }

  var proto = Rewriter.prototype;

  proto.rewriteURL = function(url, context) {
    if (!context) { context = {}; }
    if (typeof location !== 'undefined') {
      if (!context.relativeTo) {
        context.relativeTo = location.href;
      }
      if (!context.myHost) {
        context.myHost = location.protocol + '//' + location.host;
      }
    }
    var normalizedURL = normalize(url, context);
    if (normalizedURL) {
      for (var index = 0; index < this.rules.length; index++) {
        var rule = this.rules[index];
        if (rule.url instanceof RegExp) {
          var m = rule.url.exec(normalizedURL);
          if (m) {
            return normalizedURL.replace(m[0], new NURL(rule.params.as, context.myHost).toString());
          }
        } else {
          if (normalizedURL.indexOf(rule.url) === 0) {
            return normalizedURL.replace(rule.url, new NURL(rule.params.as, context.myHost).toString());
          }
        }
      }
    }
    return url;
  };

  function normalize(url, context) {
    try {
      return new NURL(url, context.relativeTo).toString();
    } catch(err) {}
  }
  return Rewriter;
}

if (typeof module !== 'undefined') {
  var NURL = require('./url');
  module.exports = definition(NURL);
} else if (typeof define !== 'undefined') {
  /* global define */
  define('ember-cli-proxy/-rewriter', ['ember-cli-proxy/url'], definition);
  define('ember-cli-proxy/rewriter', ['ember-cli-proxy/-rewriter', 'ember-cli-proxy/-config'], function(Rewriter, config) {
    return new Rewriter(config);
  });
}
