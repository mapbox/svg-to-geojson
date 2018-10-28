SVG to GeoJSON
---

A tool that is:

1. :computer: A React app that lets you drag and drop SVG on a map, returning GeoJSON back for additional editing or download.
1. :black_medium_square: A CLI tool that produces a GeoJSON file when you provide it an SVG file.

### CLI Usage

```sh
Upload SVG, return GeoJSON.

Usage
    $ svg2geojson <input>

Example
    $ svg2geojson foo.svg
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
