/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.
define([
  'intern',
  'intern/browser_modules/dojo/has!host-node?intern/browser_modules/dojo/topic',
  './tools/firefox_profile'
],
function (intern, topic, firefoxProfile) {
  var args = intern.args;
  var fxaAuthRoot = args.fxaAuthRoot || 'http://127.0.0.1:9000/v1';
  var fxaContentRoot = args.fxaContentRoot || 'http://127.0.0.1:3030/';
  var fxaOAuthRoot = args.fxaOAuthRoot || 'http://127.0.0.1:9010';
  var fxaProfileRoot = args.fxaProfileRoot || 'http://127.0.0.1:1111';
  var fxaTokenRoot = args.fxaTokenRoot || 'http://127.0.0.1:5000/token';
  var fxaEmailRoot = args.fxaEmailRoot || 'http://127.0.0.1:9001';
  var fxaOauthApp = args.fxaOauthApp || 'http://127.0.0.1:8080/';
  var fxaUntrustedOauthApp = args.fxaUntrustedOauthApp || 'http://127.0.0.1:10139/';
  const fxaTestPhoneNumber = args.fxaTestPhoneNumber || '9164400029'; // We're sorry, all circuits are busy now

  // "fxaProduction" is a little overloaded in how it is used in the tests.
  // Sometimes it means real "stage" or real production configuration, but
  // sometimes it also means fxa-dev style boxes like "latest". Configuration
  // parameter "fxaDevBox" can be used as a crude way to distinguish between
  // two.
  var fxaProduction = !! args.fxaProduction;
  var fxaDevBox = !! args.fxaDevBox;

  var fxaToken = args.fxaToken || 'http://';
  var asyncTimeout = parseInt(args.asyncTimeout || 5000, 10);

  // On Circle, we bail after the first failure.
  // args.bailAfterFirstFailure comes in as a string.
  var bailAfterFirstFailure = args.bailAfterFirstFailure === 'true';

  if (topic) {
    topic.subscribe('/suite/start', function (suite) {
      console.log('Running: ' + suite.name);
    });
  }

  var config = {
    asyncTimeout: asyncTimeout,
    bail: bailAfterFirstFailure,
    capabilities: {},
    defaultTimeout: 45000, // 30 seconds just isn't long enough for some tests.
    environments: [{
      browserName: 'firefox',
      marionette: true
    }],
    excludeInstrumentation: true,
    filterErrorStack: true,
    fixSessionCapabilities: false,
    functionalSuites: [
      'tests/functional/mocha',
      'tests/functional'
    ],
    fxaAuthRoot: fxaAuthRoot,
    fxaContentRoot: fxaContentRoot,
    fxaDevBox: fxaDevBox,
    fxaEmailRoot: fxaEmailRoot,
    fxaOAuthRoot: fxaOAuthRoot,
    fxaOauthApp: fxaOauthApp,
    fxaProduction: fxaProduction,
    fxaProfileRoot: fxaProfileRoot,
    fxaTestPhoneNumber,
    fxaToken: fxaToken,
    fxaTokenRoot: fxaTokenRoot,
    fxaUntrustedOauthApp: fxaUntrustedOauthApp,
    maxConcurrency: 3,
    pageLoadTimeout: 28000,
    proxyPort: 9090,
    proxyUrl: 'http://127.0.0.1:9090/',
    tunnel: 'SeleniumTunnel',
    tunnelOptions: {
      // this tells SeleniumTunnel to download geckodriver
      drivers: [{
        name: 'firefox',
        version: '0.19.0'
      }],
      // version of Selenium
      version: '3.6.0',
    }
  };
  config.capabilities['moz:firefoxOptions'] = {};
  // to create a profile, give it the `config` option.
  config.capabilities['moz:firefoxOptions'].profile = firefoxProfile(config); //eslint-disable-line camelcase

  // custom Firefox binary location, if specified then the default is ignored.
  // ref: https://code.google.com/p/selenium/wiki/DesiredCapabilities#WebDriver
  if (args.firefoxBinary) {
    config.capabilities['moz:firefoxOptions'].binary = args.firefoxBinary; //eslint-disable-line camelcase
  }

  if (args.useTeamCityReporter) {
    config.reporters = [ { id: 'TeamCity' } ];
  }

  return config;
});
