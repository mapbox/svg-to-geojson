import { transform } from 'pathologist';
import SVGO from 'worker-loader!./web-workers/svgo.js';


const svgo = new SVGO({})

console.log(svgo)

function pathologize(svg) {
  const expression = /<(text|style|metadata|pattern)[\s\S]*?<\/(text|style|metadata|pattern)>/g;
  const clean = svg.replace(expression, '')

  const optimized = svgo.optimize(svg)
  console.log('optimis', optimized)

  return new Promise((resolve, reject) => {
    const transformed = transform(clean);
    if (!transformed) return reject(svg);
    resolve(transformed);
  });
}

export { pathologize };
