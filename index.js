/* jshint node: true */
'use strict';

let path = require('path');
let fs = require('fs');
let ProxyConfig = require('./lib/proxy-config');
let Forwarder = require('./lib/forwarder');
let browserPackage = require('./lib/browser-package');

module.exports = {
  name: 'ember-cli-proxy',

  included: function(app) {
    this.app = app;
    app.import('vendor/ember-cli-proxy/url.js');
    app.import('vendor/ember-cli-proxy/rewriter.js');
    app.import('vendor/ember-cli-proxy/proxy.js');
  },

  treeForVendor: function() {
    return browserPackage(this);
  },

  serverMiddleware: function(config) {
    let self = this;
    let expressApp = config.app;
    this.ui = config.options.ui;
    this.proxyConfig = this.loadProxyConfig();
    if (this.proxyConfig.invalid) {
      expressApp.use(function(req, res) {
        self.describeInvalidConfig(res);
      });
    } else {
      new Forwarder(this.proxyConfig, expressApp, this.ui);
    }
  },

  loadProxyConfig: function() {
    let proxyConfigPath = path.join(this.app.project.root, 'server', 'proxy.js');
    try {
      return ProxyConfig.load(
        path.join(this.app.project.root, 'config', 'environment.js'),
        proxyConfigPath
      );
    } catch(err) {
      this.ui.writeError(err);
      return { invalid: err, source: proxyConfigPath };
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
