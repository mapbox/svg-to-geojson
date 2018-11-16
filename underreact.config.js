'use strict';
const html = require('./html');
const mapboxAssembly = require('@mapbox/mbx-assembly');

module.exports = () => {
  return {
    siteBasePath: 'svg-to-geojson',
    browserslist: mapboxAssembly.browsersList,
    htmlSource: html,
    webpackConfigTransform: config => {
      config.output.globalObject = "this";
      return config;
    }
  };
};
