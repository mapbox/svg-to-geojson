import { range } from 'lodash';

function pathToCoords(path, scale, numPoints, translateX, translateY) {
  const length = path.getTotalLength();
  const getRange = range(numPoints);
  const id = path.id ? path.id : '';

  // Always include the max value in the range.
  // This is helpful for detecting closed polygons vs lines
  getRange.push(numPoints);

  return {
    id,
    coords: getRange.map(function(i) {
      const point = path.getPointAtLength(length * i / numPoints);
      return [point.x * scale + translateX, point.y * scale + translateY];
    })
  }


}

export { pathToCoords };
