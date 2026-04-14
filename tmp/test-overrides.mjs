import { parsePageId } from 'notion-utils';

function cleanPageUrlMap(pageUrlMap, { label }) {
  return Object.keys(pageUrlMap).reduce((acc, uri) => {
    const pageId = pageUrlMap[uri];
    const uuid = parsePageId(pageId, { uuid: false });

    if (!uuid) {
      throw new Error(`Invalid ${label} page id "${pageId}"`);
    }

    if (!uri) {
      throw new Error(`Missing ${label} value for page "${pageId}"`);
    }

    const path = uri.startsWith('/') ? uri.slice(1) : uri;

    return {
      ...acc,
      [path]: uuid
    };
  }, {});
}

function invertPageUrlOverrides(pageUrlOverrides) {
  return Object.keys(pageUrlOverrides).reduce((acc, uri) => {
    const pageId = pageUrlOverrides[uri];

    return {
      ...acc,
      [pageId]: uri
    };
  }, {});
}

const pageUrlOverridesRaw = {
  '/about': '8401785badf840e99bb988a5e63eacb8',
  '/works': '302392488fe580d4824accf5851dfe96'
};

const pageUrlOverrides = cleanPageUrlMap(pageUrlOverridesRaw, { label: 'pageUrlOverrides' });
const inversePageUrlOverrides = invertPageUrlOverrides(pageUrlOverrides);

console.log('pageUrlOverrides:', pageUrlOverrides);
console.log('inversePageUrlOverrides:', inversePageUrlOverrides);

const testId = '8401785badf840e99bb988a5e63eacb8';
const cleanTestId = parsePageId(testId, { uuid: false });
console.log('testId:', testId);
console.log('cleanTestId:', cleanTestId);
console.log('result:', inversePageUrlOverrides[cleanTestId]);
