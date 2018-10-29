SVG to GeoJSON
---

A tool that is:

1. :computer: A React app that lets you drag and drop SVG on a map, returning GeoJSON back for additional editing or download.
1. :black_medium_square: A CLI tool that produces a GeoJSON file when you provide it an SVG file.

### CLI Usage

```sh
Pass SVG, return GeoJSON.

Usage
    $ svg2geojson <input>

Options
    --scale, -s Default: 1. Changing scale adjusts the proportion of each path element
    --points, -p  Default: 250. The number of nodes making up a geometry feature. Lowering this number simplies the shape translated from SVG. Increasing this number retains higher translation but results in a larger file size.

Example
    $ svg2geojson foo.svg
    $ svg2geojson foo.svg --scale 2 --points 300
```

### Installation

```sh
git clone https://github.com/mapbox/svg-to-geojson.git

cd svg-to-geojson
npm install
npm link # To run the CLI tool
npm start # To run the react app
```

Runs the app from http://localhost:8080/svg-to-geojson/

---

Credit: https://github.com/spotify/coordinator/ for code to get started and inspiration!
