#!/usr/bin/env node

const COMMAND = 'svg2geojson';

const Point = require('@mapbox/point-geometry');
const Transform = require('mapbox-gl/src/geo/transform');
const jsdom = require('jsdom');
const meow = require('meow');
const chalk = require('chalk');
const fileExtension = require('file-extension');
const { pathologize } = require('../src/pathologize');
const { pathToCoords } = require('../src/path-to-coordinates');
const SVGO = require('svgo');
const { JSDOM } = jsdom;
const fs = require('fs');

const svgo = new SVGO();

const cli = meow(`
  ${chalk.bold('Usage')}
    $ ${COMMAND} <input>

  ${chalk.bold('Options')}
    --scale, -s Default: 1. Changing scale adjusts the proportion of each path element
    --points, -p  Default: 250. The number of nodes making up a geometry feature. Lowering this number simplies the shape translated from SVG. Increasing this number retains higher translation but results in a larger file size.

  ${chalk.bold('Example')}
    $ ${COMMAND} foo.svg
    $ ${COMMAND} foo.svg --scale 2 --points 300
`, {
  flags: {
    scale: {
      type: 'number',
      alias: 's',
      default: 1
    },
    points: {
      type: 'number',
      alias: 'p',
      default: 250
    }
  }
});

const { scale: SCALE, points: POINTS } = cli.flags;
const svgFile = cli.input[0];

if (fileExtension(svgFile) !== 'svg') {
  console.log(`${chalk.yellow('An SVG must be provided as an input.')}`);
  cli.showHelp();
}

// Get the svg as json
svgo.optimize(fs.readFileSync(svgFile, 'utf-8'))
  .then(result => pathologize(result.data))
  .then(svgToGeoJSON)
  .catch(err => {
    console.log(`${chalk.red(`Error reading SVG: ${err.message}`)}`);
    cli.showHelp();
});

calculateCoords = svg => {
  let width = 0;
  let height = 0;

  if (svg.getAttribute('width')) {
    width = parseInt(svg.getAttribute('width'), 10);
  }

  if (svg.getAttribute('height')) {
    height = parseInt(svg.getAttribute('height'), 10);
  }

  return {
    x: Math.floor(width / 2),
    y: Math.floor(height / 2)
  }
};

function svgToGeoJSON(svg) {
  const { document } = (new JSDOM(svg)).window;

  const svgElement = document.querySelector('svg');
  const { x, y } = calculateCoords(svgElement);
  const paths = svgElement.querySelectorAll('path');

  Array.from(paths)
    .map(path => pathToCoords(path, SCALE, POINTS, x, y))
    .map(coords => {
      const coordinates = coords.map(d => {
        const point = new Point(d[0], d[1]);

        console.log('hI', Transform);
        // console.log('b: ', point);
        // const c = this.map.unproject(d);
        // return [c.lng, c.lat];
      });

      if (coords[0][0] === coords[coords.length - 1][0] &&
          coords[0][1] === coords[coords.length - 1][1]) {
        return {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      } else {
        return {
          type: 'LineString',
          coordinates
        };
      }
    });
  
  /*
  fs.writeFile(`${stripExtension(svgFile)}.json`, JSON.stringify(style, null, 2), e => {
    if (e) throw new Error(e);
  });
  */
}
