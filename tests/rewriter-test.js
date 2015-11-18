/* jshint node: true */
/* globals describe, it */
'use strict';

let ProxyConfig = require('../lib/proxy-config');
let Rewriter = require('../lib/rewriter');
let expect = require('chai').expect;

describe('Rewriter', function() {
  it('can rewrite string-based rules', function() {
    let config = new ProxyConfig(function() {
      this.rewrite('http://example.com', { as: '/ecom' });
    });
    let rewriter = new Rewriter(config);
    expect(rewriter.rewriteURL('/foo', { relativeTo: 'http://example.com/bar' })).to.equal('/ecom/foo');
  });

  it('can rewrite string-based rules with own absolute host', function() {
    let config = new ProxyConfig(function() {
      this.rewrite('http://example.com', { as: '/ecom' });
    });
    let rewriter = new Rewriter(config);
    expect(rewriter.rewriteURL('/foo', { relativeTo: 'http://example.com/bar', myHost: 'http://localhost:4200' })).to.equal('http://localhost:4200/ecom/foo');
  });

  it('can rewrite regexp-based rules', function() {
    let config = new ProxyConfig(function() {
      this.rewrite(/https?:\/\/example.com\/abc/, { as: '/ecom' });
    });
    let rewriter = new Rewriter(config);
    expect(rewriter.rewriteURL('foo', { relativeTo: 'http://example.com/abc/bar' })).to.equal('/ecom/foo');
  });

  it('can rewrite regexp-based rules with own absolute host', function() {
    let config = new ProxyConfig(function() {
      this.rewrite(/https?:\/\/example.com\/abc/, { as: '/ecom' });
    });
    let rewriter = new Rewriter(config);
    expect(rewriter.rewriteURL('foo', { relativeTo: 'http://example.com/abc/bar' , myHost: 'http://localhost:4200' })).to.equal('http://localhost:4200/ecom/foo');
  });
});
