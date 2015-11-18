/* jshint node: true */
'use strict';

var WatchedDir    = require('broccoli-source').WatchedDir;
var UnwatchedDir  = require('broccoli-source').UnwatchedDir;
var stew = require('broccoli-stew');
var path = require('path');
var ProxyConfig = require('./proxy-config');

module.exports = function(addon) {
  let project = addon.app.project;
  return stew.find([
    stew.mv(new UnwatchedDir(__dirname), 'ember-cli-proxy'),
    stew.map(
      stew.find(
        stew.mv(new WatchedDir(path.join(project.root, 'server')), 'ember-cli-proxy'),
        'ember-cli-proxy/proxy.js'
      ),
      function() {
        let pconfig = ProxyConfig.load(
          path.join(project.root, 'config', 'environment.js'),
          path.join(project.root, 'server', 'proxy.js'),
          addon.app.env
        );
        return "define('ember-cli-proxy/-config', [], function(){ return " + JSON.stringify(pconfig) + ";});";
      })
  ]);
};
