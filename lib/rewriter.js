/* jshint node: true */
'use strict';

let NURL = require('./url');

function Rewriter(proxyConfig) {
  this.rules = proxyConfig.rewriters;
}

module.exports = Rewriter;
let proto = Rewriter.prototype;

proto.rewriteURL = function(url, context) {
  console.log("Checking " + url + " " + JSON.stringify(context));
  let normalizedURL = new NURL(url, context.relativeTo).toString();
  for (let index = 0; index < this.rules.length; index++) {
    let rule = this.rules[index];
    if (rule.url instanceof RegExp) {
      let m = rule.url.exec(normalizedURL);
      if (m) {
        return normalizedURL.replace(m[0], new NURL(rule.as, context.myHost).toString());
      }
    } else {
      if (normalizedURL.indexOf(rule.url) === 0) {
        return normalizedURL.replace(rule.url, new NURL(rule.as, context.myHost).toString());
      }
    }
  }
  return url;
};
