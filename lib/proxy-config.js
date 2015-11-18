/* jshint node: true */
'use strict';

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
    as: params.as
  });
};

proto.proxy = function(url, params) {
  if (typeof url === 'function') {
    this.customForwards.push(url);
  } else {
    this.forwards.push({
      url: url,
      as: params.as
    });
  }
};

proto.masquerade = function(url, params) {
  this.rewrite(url, params);
  this.proxy(url, params);
};
