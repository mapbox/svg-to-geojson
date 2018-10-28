const { transform } = require('pathologist');

function pathologize(svg) {

  // TODO Now that SVGO Does some initial optimization, we can drop some
  // of these tags from omission.
  const expression = /<(text|style|metadata|pattern)[\s\S]*?<\/(text|style|metadata|pattern)>/g;
  const clean = svg.replace(expression, '');
  return new Promise((resolve, reject) => {
    const transformed = transform(clean);
    if (!transformed) return reject(svg);
    resolve(transformed);
  });
}

module.exports = { pathologize };
