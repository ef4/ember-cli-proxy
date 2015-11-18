/* jshint node: true */
'use strict';

let path = require('path');
let fs = require('fs');
let ProxyConfig = require('./lib/proxy-config');
let Forwarder = require('./lib/forwarder');

module.exports = {
  name: 'ember-cli-proxy',

  isDevelopingAddon: function() { return true; },

  serverMiddleware: function(config) {
    let self = this;
    let expressApp = config.app;
    this.ui = config.options.ui;
    this.proxyConfig = this.loadProxyConfig(config);
    if (this.proxyConfig.invalid) {
      expressApp.use(function(req, res) {
        self.describeInvalidConfig(res);
      });
    } else {
      new Forwarder(this.proxyConfig, expressApp, this.ui);
    }
  },

  loadProxyConfig: function(config) {
    let configPath = path.join(config.options.project.root, 'server', 'proxy.js');
    if (!fs.existsSync(configPath)) {
      return {};
    }
    try {
      let makeProxyConfig = require(configPath);
      return new ProxyConfig(function() {
        makeProxyConfig.call(this, config.options.environment);
      });
    } catch(err) {
      this.ui.writeError(err);
      return { invalid: err, source: configPath };
    }
  },

  describeInvalidConfig: function(res) {
    let error = this.proxyConfig.invalid;
    res.status(500).send([
      "<pre>",
      "Error encountered in your proxy configuration",
      error.stack.replace(/\n/g, "    \n"),
      "</pre>"
    ].join("\n"));
  }
};
