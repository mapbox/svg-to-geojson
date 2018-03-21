import React from 'react';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext, DropTarget } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import mapboxgl from 'mapbox-gl';
import { pathologize } from '../pathologize';
import { pathToCoords } from '../path-to-coordinates';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

const SCALE = 1;
const NUM_POINTS = 1000;

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
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [5, 34],
      zoom: 1.5
    });

    this.map.on('load', () => {
      this.map.addSource('geojson', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      this.map.addLayer({
        id: 'fill',
        type: 'fill',
        source: 'geojson',
        paint: {
          'fill-color': '#027dbd',
          'fill-opacity': 0.25
        },
        filter: ['==', '$type', 'Polygon']
      });

      this.map.addLayer({
        id: 'line',
        type: 'line',
        source: 'geojson',
        paint: {
          'line-color': '#027dbd',
          'line-width': 2
        },
        filter: ['==', '$type', 'Polygon']
      });

      this.map.addLayer({
        id: 'line',
        type: 'line',
        source: 'geojson',
        paint: {
          'line-color': '#027dbd',
          'line-width': 2
        },
        filter: ['==', '$type', 'LineString']
      });
    });
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

  draw = features => {
    const geojson = {
      type: 'FeatureCollection',
      features
    };

    this.map.getSource('geojson').setData(geojson);

    this.setState({
      helpText: 'Drag and drop an SVG on the map.'
    });
  };

  buildFeature = coords => {
    const feature = {
      type: 'Feature',
      properties: {}
    };

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
      feature.geometry = {
        type: 'LineString',
        coordinates: coords.map(d => {
          const c = this.map.unproject(d);
          return [c.lng, c.lat];
        })
      };
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

  parseSVG = svgString => {

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

    const features = Array
      .from(paths)
      .map(path => pathToCoords(
        path,
        SCALE,
        NUM_POINTS,
        coordinates.x,
        coordinates.y
      ))
      .map(this.buildFeature);

    this.draw(features);
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
      pathologize(d.target.result)
        .then(this.parseSVG)
        .catch(() => {
          this.setState({
            helpText: 'Error parsing SVG'
          });
          return;
        });
    });

    reader.readAsText(file);
  };

  render() {
    const { helpText } = this.state;
    const { connectDropTarget, isOver } = this.props;

    return connectDropTarget(
      <div onMouseMove={this.trackCoordinates}>
        {helpText && <div className="flex-parent flex-parent--end-cross flex-parent--center-main absolute top right bottom left">
          <div className="flex-child mb24 bg-darken50 color-white z1 py12 px24 round-full txt-s txt-bold">
            {helpText}
          </div>
        </div>}

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

App = DragDropContext(HTML5Backend)(withDragDrop(App));

export { App };
