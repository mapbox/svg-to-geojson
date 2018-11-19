'use strict';
const html = require('./html');

module.exports = () => {
  return {
    siteBasePath: 'svg-to-geojson',
    htmlSource: html,
    webpackConfigTransform: config => {
      config.output.globalObject = "this";
      return config;
    }
  };
};
