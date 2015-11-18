/* jshint node: true */

function definition(NURL) {
  'use strict';

  function Rewriter(proxyConfig) {
    this.rules = proxyConfig.rewriters;
  }

  let proto = Rewriter.prototype;

  proto.rewriteURL = function(url, context) {
    let normalizedURL = normalize(url, context);
    if (normalizedURL) {
      for (let index = 0; index < this.rules.length; index++) {
        let rule = this.rules[index];
        if (rule.url instanceof RegExp) {
          let m = rule.url.exec(normalizedURL);
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
