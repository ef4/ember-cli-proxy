/* jshint node: true */
'use strict';

let NURL = require('./url');

function Rewriter(proxyConfig) {
  this.rules = proxyConfig.rewriters;
}

module.exports = Rewriter;
let proto = Rewriter.prototype;

proto.rewriteURL = function(url, context) {
  console.log('rewrite', url);
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
