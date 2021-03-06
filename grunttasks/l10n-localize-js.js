/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creates localized JavaScript bundles from the original uglified bundle.
 * translations are fetched from disk and inserted into __translations__:{} in
 * the bundle.
 */
module.exports = function (grunt) {
  var path = require('path');

  grunt.registerTask('l10n-localize-js', 'Generate localized versions of the Javascript', function () {
    // server config is set in the selectconfig task
    var supportedLanguages = grunt.config.get('server.i18n.supportedLanguages');
    var i18n = require('../server/lib/i18n')(grunt.config.get('server.i18n'));

    var jsDir = grunt.config('yeoman.dist');
    var jsSourcePath = path.join(jsDir, 'scripts', 'main.js');

    supportedLanguages.forEach((language) => {
      var locale = i18n.localeFrom(language);
      var translationPath = path.join(grunt.config.get('yeoman.app'), 'i18n', locale, 'client.json');

      var jsDestPath = path.join(jsDir, 'scripts', 'main.' + locale + '.js');

      var translations = grunt.file.readJSON(translationPath);
      grunt.log.writeln('writing', jsDestPath);
      grunt.file.copy(jsSourcePath, jsDestPath, {
        process: (contents) => {
          // `__translations__:{},` is written in
          // the replace:fetch_translations task.
          return contents.replace(/__translations__:{},/, '__translations__:' + JSON.stringify(translations) + ',');
        }
      });
    });
  });
};
