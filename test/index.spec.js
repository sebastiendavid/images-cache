/* jshint expr: true */
/* global describe: false, it: false, before: false */
'use strict';
describe('mainModule.spec.js', function () {
    var $;
    var _;
    var angular;
    var index;
    var proxyquire;
    var sinon;

    before(function () {
        require('should');

        proxyquire = require('proxyquire');
        sinon = require('sinon');

        sinon.spy(console, 'info');

        $ = {
            '@noCallThru': true
        };

        _ = {
            '@noCallThru': true
        };

        angular = {
            module: sinon.stub().returns({
                controller: sinon.spy(),
                factory: sinon.spy()
            }),
            bootstrap: sinon.spy(),
            '@noCallThru': true
        };

        global.document = {};

        index = proxyquire('../src/index.js', {
            jquery: $,
            lodash: _,
            angular: angular
        });
    });

    it('module should initialize app', function () {
        // then
        index.should.be.an.Object;
        angular.bootstrap.callCount.should.be.exactly(1);
    });
});
