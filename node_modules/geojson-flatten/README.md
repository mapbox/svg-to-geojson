# geojson-flatten

[![build status](https://secure.travis-ci.org/tmcw/geojson-flatten.svg)](http://travis-ci.org/tmcw/geojson-flatten)
[![Greenkeeper badge](https://badges.greenkeeper.io/tmcw/geojson-flatten.svg)](https://greenkeeper.io/)

Flatten MultiPoint, MultiPolygon, MultiLineString, and GeometryCollection
geometries in [GeoJSON](http://geojson.org/) files into simple non-complex
geometries.

## install

    npm install --save geojson-flatten

Or download `geojson-flatten.js` for non-[browserify](http://browserify.org/) usage.

## example

```js
var flatten = require('geojson-flatten');

flattened = flatten(geojsonObject);
```

## cli

	cat input.geojson | geojson-flatten > flattened.geojson
