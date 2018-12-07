import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './app.css';
import React from 'react';
import HTML5Backend from 'react-dnd-html5-backend';
import SVGO from 'worker-loader!../web-workers/svgo.js';
import { DragDropContext, DropTarget } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw';
import { pathologize } from '../pathologize';
import { pathToCoords } from '../path-to-coordinates';
import { saveAs } from 'filesaver.js';
import ReactSlider from 'react-slider';

const turf = require('@turf/turf');
const svgo = new SVGO();
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

const SCALE = 1;
let NUM_POINTS = 250,
    currentFile;

let App = class App extends React.PureComponent {
  mouseCoordinates = {
    x: 0,
    y: 0
  };
  mapContainer = null;

  constructor(props) {
    super(props);
    this.state = {
      helpText: 'Drag and drop an SVG on the map.'
    };
  }

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/light-v9',
      center: [5, 34],
      zoom: 1.5
    });

    this.draw = new MapboxDraw();

    this.map.on('load', () => {
      this.map.addControl(this.draw);
      // Triggers a map redraw once the component has finished mounting to ensure the rendered map fills the entire container. See: https://www.mapbox.com/help/blank-tiles/#mapbox-gl-js
      this.map.resize();
    });
  }

  download = () => {
    const blob = new Blob([
      JSON.stringify(this.draw.getAll(), null, 2)
    ], {
      type: 'text/plain;charset=utf-8'
    });

    saveAs(blob, 'features.geojson');
  };

  updateHandle = val => {
    document.querySelector(".number").innerHTML = val;
  }

  sendValue = val => {
    this.draw.deleteAll();
    NUM_POINTS = val;
    if(currentFile){
      const reader = new FileReader();
      reader.addEventListener('load', d => {
        svgo.postMessage({
          svg: d.target.result
        });
      });
      reader.readAsText(currentFile);
    }
  }

  trackCoordinates = e => {
    this.mouseCoordinates = {
      x: e.screenX,
      y: e.screenY
    }
  };

  setMapContainer = el => {
    this.mapContainer = el;
  };

  buildFeature = data => {
    const {path, coords} = data;

    let feature = {
      type: 'Feature',
      properties: {},
      geometry: {}
    }

    if (path.id) {
      feature.properties.id = path.id;
    }

    if (path.getAttribute("fill")) {
      feature.properties.fill = path.getAttribute("fill");
    }

    // If the first and last coords match it should be drawn as a polygon
    if (coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]) {
          feature.geometry = {
            type: 'Polygon',
            coordinates: [
              coords.map(d => {
                const c = this.map.unproject(d);
                return [c.lng, c.lat];
              })
            ]
          };
    } else {
      const getSum = (total, num) => {
          return total + num;
      }
      try {
        // try to see if it should be a multipolygon
        let distances = [];
        let splits = [];
        coords.forEach((c, idx) => {
          if(idx > 0){
            const from = turf.point([this.map.unproject(coords[idx - 1])['lng'], this.map.unproject(coords[idx - 1])['lat']]);
            const to = turf.point([this.map.unproject(c)['lng'], this.map.unproject(c)['lat']]);
            const options = {units: 'miles'};

            const distance = turf.distance(from, to, options);
            // get distances between points
            distances.push(distance);
          }
        });

        const distAvg = distances.reduce(getSum)/distances.length;
        coords.forEach((c, idx) => {
          if(idx > 0){
            const from = turf.point([this.map.unproject(coords[idx - 1])['lng'], this.map.unproject(coords[idx - 1])['lat']]);
            const to = turf.point([this.map.unproject(c)['lng'], this.map.unproject(c)['lat']]);
            const options = {units: 'miles'};
            const distance = turf.distance(from, to, options);
            // if the following coordinate is ~2.5 farther away than average, it is most likely a new polygon
            if(distance > distAvg*2.5){
              splits.push(idx);
            }
          }
        });

        // idx only gets to last split - needs to get to the end of the shape
        splits.push(NUM_POINTS);

        let newShapeArray = [];
        splits.forEach((s, idx) => {
          let shape = [];
          if(idx === 0){
            for(let i = 0; i < s; i++){
              shape.push([this.map.unproject(coords[i])['lng'], this.map.unproject(coords[i])['lat']]);
            }
          } else {
            for(let i = splits[idx-1]; i < s; i++){
              shape.push([this.map.unproject(coords[i])['lng'], this.map.unproject(coords[i])['lat']]);
            }
          }
          newShapeArray.push([shape]);
        });

        newShapeArray.forEach(shape => {
          shape[0].push(shape[0][0]);
        });

        feature.geometry = {
          type: 'MultiPolygon',
          coordinates: newShapeArray
        };
      }
      catch(err) {
        feature.geometry = {
          type: 'LineString',
          coordinates: coords.map(d => {
            const c = this.map.unproject(d);
            return [c.lng, c.lat];
          })
        };
      }


    }

    return feature;
  };

  calculateCoords = svg => {
    const { x, y } = this.mouseCoordinates;

    // Attempt a couple methods to get width/height values on the SVG element
    // to return reasonable x/y coordinates on the map.
    let { width, height } = svg.getBBox();

    if (width === 0 && svg.getAttribute('width')) {
      width = parseInt(svg.getAttribute('width'), 10);
    }

    if (height === 0 && svg.getAttribute('height')) {
      height = parseInt(svg.getAttribute('height'), 10);
    }

    return {
      x: x - (width / 2),
      y: y - (height / 2)
    }
  };

  svgToGeoJSON = svgString => {

    // Create an empty container to fetch paths using the dom
    const empty = document.createElement('div');
    empty.innerHTML = svgString;

    const coordinates = this.calculateCoords(empty.querySelector('svg'));
    const paths = empty.querySelectorAll('path');

    if (!paths.length) {
      this.setState({
        helpText: 'No paths were found in this SVG'
      });
      return;
    }

    Array
      .from(paths)
      .map(path => pathToCoords(
        path,
        SCALE,
        NUM_POINTS,
        coordinates.x,
        coordinates.y
      ))
      .map(this.buildFeature)
      .forEach(this.draw.add);

    this.setState({
      helpText: 'Drag and drop an SVG on the map.'
    });
  };

  onUpload = files => {
    const file = files[0];
    currentFile = file;
    const { type } = file;

    this.setState({
      helpText: (
        <span className="loading loading--s loading--dark" />
      )
    });

    if (type !== 'image/svg+xml') {
      this.setState({
        helpText: 'File type must be SVG'
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', d => {

      svgo.postMessage({
        svg: d.target.result
      });

      svgo.addEventListener('message', e => {
        pathologize(e.data)
          .then(this.svgToGeoJSON)
          .catch(err => {
            console.error(err);
            this.setState({
              helpText: 'Error parsing SVG'
            });
            return;
          });
      });
    });

    reader.readAsText(file);
  };

  render() {
    const { helpText } = this.state;
    const { connectDropTarget, isOver } = this.props;

    return connectDropTarget(
      <div>
        <div className="sliderHolder">
          <ReactSlider orientation={'vertical'} invert={true} defaultValue={300} min={250} max={5000} onChange={this.updateHandle} onAfterChange={this.sendValue} />
          <div className="pointHolder"><div className="number">250</div>points</div>
        </div>
        <div onMouseMove={this.trackCoordinates}>
          <div className="flex-parent flex-parent--end-cross flex-parent--center-main absolute top right bottom left">
            <div className="flex-child mb24 z1 txt-s txt-bold flex-parent">
              <div className="flex-child bg-darken75 color-white inline-block pl24 pr12 py12 round-l-full">
                {helpText}
              </div>
              <button className="flex-child btn btn--purple px24 round-r-full" onClick={this.download}>
                Download
              </button>
            </div>
          </div>
      </div>

        {isOver && <div className="bg-darken25 fixed left right top bottom events-none z5" />}
        <div ref={this.setMapContainer} className="absolute top right left bottom" />
      </div>
    );
  }
}

const dropTarget = {
  drop: (props, monitor, component) =>
    component.onUpload(monitor.getItem().files)
};

const withDragDrop = DropTarget(
  NativeTypes.FILE,
  dropTarget,
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  })
);

export default DragDropContext(HTML5Backend)(withDragDrop(App));
