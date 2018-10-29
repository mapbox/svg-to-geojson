const { range } = require('lodash');
const path = require('svg-path-properties');

function pathToCoords(pathElement, scale, numPoints, translateX, translateY) {

  // Using `path` instead of native properties as methods like
  // `getTotalLength` and `getPointAtLength` are not supported via node.
  const properties = path.svgPathProperties(pathElement.getAttribute('d'));

  const length = properties.getTotalLength();
  const getRange = range(numPoints);

  // Always include the max value in the range.
  // This is helpful for detecting closed polygons vs lines
  getRange.push(numPoints);

  return getRange.map(i => {
    const point = properties.getPointAtLength(length * i / numPoints);
    return [point.x * scale + translateX, point.y * scale + translateY];
  });
}

module.exports = { pathToCoords };
