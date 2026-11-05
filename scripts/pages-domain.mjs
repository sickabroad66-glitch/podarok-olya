export function parsePagesDomain(contents) {
  if (contents === undefined) return undefined;
  const domain = contents.trim();
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    throw new Error('CNAME must contain one lowercase domain name, without a scheme, path or wildcard.');
  }
  return domain;
}

export function preservePagesDomain(previousContents, nextContents) {
  const previous = parsePagesDomain(previousContents);
  const next = parsePagesDomain(nextContents);
  if (previous && !next) {
    throw new Error('The published site has a custom domain. Preserve site/CNAME before publishing.');
  }
  return next;
}
