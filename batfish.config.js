'use strict';

const path = require('path');
const mapboxAssembly = require('@mapbox/mbx-assembly');

module.exports = () => {
  return {
    siteOrigin: 'https://mapbox.com',
    siteBasePath: 'svg-to-geojson',
    browserslist: mapboxAssembly.browsersList,
    stylesheets: [
      require.resolve('@mapbox/mbx-assembly/dist/assembly.css'),
      require.resolve('mapbox-gl/dist/mapbox-gl.css'),
      require.resolve('@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'),
      path.join(__dirname, './src/components/app.css')
    ],
    spa: true,
    webpackStaticStubReactComponent: [path.join(__dirname, './src/components/app.js')],
    staticHtmlInlineDeferCss: false,
    sitemap: false
  };
};
