import { transform } from 'pathologist';

function pathologize(svg) {
  const expression = /<(text|style|metadata|pattern)[\s\S]*?<\/(text|style|metadata|pattern)>/g;
  const clean = svg.replace(expression, '');

  return new Promise((resolve, reject) => {
    const transformed = transform(clean);
    if (!transformed) return reject(svg);
    resolve(transformed);
  });
}

export { pathologize };
