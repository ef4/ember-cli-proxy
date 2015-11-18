/* jshint node: true */
'use strict';

let path = require('path');
let fs = require('fs');

function ProxyConfig(definition) {
  this.rewriters = [];
  this.forwards = [];
  this.customForwards = [];
  if (definition) {
    definition.call(this);
  }
}
module.exports = ProxyConfig;
let proto = ProxyConfig.prototype;

proto.rewrite = function(url, params) {
  this.rewriters.push({
    url: url,
    params: params
  });
};

proto.proxy = function(url, params) {
  if (typeof url === 'function') {
    this.customForwards.push(url);
  } else {
    this.forwards.push({
      url: url,
      params: params
    });
  }
};

proto.masquerade = function(url, params) {
  this.rewrite(url, params);
  this.proxy(url, params);
};

ProxyConfig.load = function(configPath, proxyConfigPath, environment) {
  if (!fs.existsSync(proxyConfigPath)) {
    return {};
  }
  let makeConfig = require(configPath);
    let makeProxyConfig = require(proxyConfigPath);
    return new ProxyConfig(function() {
      makeProxyConfig.call(this, makeConfig(environment));
    });
};
