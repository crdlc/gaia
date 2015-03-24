'use strict';

/* global require, exports, dump, Services */
var utils = require('utils');

var loadConfiguration = function(options) {
  var fileName = 'system-xhr';

  var defaultConfig = utils.getFile(options.GAIA_DIR, 'apps', 'system-xhr',
    'build', fileName + '.json');
  var configuration = utils.getJSON(defaultConfig);

  // Load device specific configuration
  var deviceConfig = utils.getFile(options.GAIA_DIR, 'build', 'config',
    options.GAIA_DEVICE_TYPE, fileName + '.json');
  if (deviceConfig.exists()) {
    configuration = utils.getJSON(deviceConfig);
  }

  // Load distribution specific configuration
  if (options.GAIA_DISTRIBUTION_DIR) {
    configuration = JSON.parse(utils.getDistributionFileContent(fileName,
        configuration, options.GAIA_DISTRIBUTION_DIR));
  }

  return configuration;
};

var SystemXHRAppBuilder = function() {

};

SystemXHRAppBuilder.prototype.execute = function(options) {
  var configuration = loadConfiguration(options);
  var stageDir = utils.getFile(options.STAGE_APP_DIR);
  var configFile = utils.getFile(stageDir.path, 'js', 'init.json');
  utils.writeContent(configFile, JSON.stringify(configuration));
};

exports.execute = function(options) {
  utils.copyToStage(options);
  (new SystemXHRAppBuilder()).execute(options);
};
