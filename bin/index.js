#!/usr/bin/env node

const COMMAND = 'svg2geojson';

const meow =  require('meow');
const chalk =  require('chalk');
const fileExtension = require('file-extension');
const { pathologize } = require('../src/pathologize');

const SVGO = require('svgo');
const fs = require('fs');

const svgo = new SVGO();

const cli = meow(`
  ${chalk.bold('Usage')}
    $ ${COMMAND} <input>

  ${chalk.bold('Example')}
    $ ${COMMAND} foo.svg
`
);

const svgFile = cli.input[0];

if (fileExtension(svgFile) !== 'svg') {
  console.log(`${chalk.yellow('An SVG must be provided as an input.')}`);
  cli.showHelp();
}

// Get the svg as json
svgo.optimize(fs.readFileSync(svgFile, 'utf-8'))
  .then(result => pathologize(result.data))
  .then(convertToGeoJSON)
  .catch(err => {
    console.log(err);
    console.log(`${chalk.red(`Error reading SVG: ${err.message}`)}`);
    cli.showHelp();
});

function convertToGeoJSON(paths) {
  console.log('hey there', paths);

  /*
  fs.writeFile(`${stripExtension(svgFile)}.json`, JSON.stringify(style, null, 2), e => {
    if (e) throw new Error(e);
  });
  */
}
