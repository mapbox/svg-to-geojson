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

const svgo = new SVGO();
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

const SCALE = 1;
const NUM_POINTS = 250;

let App = class App extends React.PureComponent {
  mouseCoordinates = {
    x: 0,
    y: 0
  };
  mapContainer = null;

  constructor(props: Props) {
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

  trackCoordinates = e => {
    this.mouseCoordinates = {
      x: e.screenX,
      y: e.screenY
    }
  };

  setMapContainer = el => {
    this.mapContainer = el;
  };

  buildFeature = coords => {
    // If the first and last coords match it should be drawn as a polygon
    if (coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]) {

      return {
        type: 'Polygon',
        coordinates: [
          coords.map(d => {
            const c = this.map.unproject(d);
            return [c.lng, c.lat];
          })
        ]
      };
    } else {
      return {
        type: 'LineString',
        coordinates: coords.map(d => {
          const c = this.map.unproject(d);
          return [c.lng, c.lat];
        })
      };
    }
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
