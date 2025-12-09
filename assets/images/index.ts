import { LazyRequireImages } from './lazy-require-image';

const imageProxyTarget: Record<PropertyKey, unknown> = {};

type LazyImageKey = keyof typeof LazyRequireImages;

const isLazyImageKey = (key: PropertyKey): key is LazyImageKey => {
    return typeof key === 'string' && key in LazyRequireImages;
};

const imageProxyHandler: ProxyHandler<typeof imageProxyTarget> = {
    get(_target, objectKey) {
        if (!isLazyImageKey(objectKey)) {
            if (typeof objectKey === 'string' && objectKey !== '$$typeof' && __DEV__) {
                throw new Error(`Image not found for ${objectKey}`);
            }
            return undefined;
        }

        const lazyImage = LazyRequireImages[objectKey];

        if (typeof lazyImage === 'function') {
            return lazyImage();
        }

        return lazyImage;
    },
};

type LazyImageValue<Key extends LazyImageKey> = (typeof LazyRequireImages)[Key] extends (
    ...args: never[]
) => infer Result
    ? Result
    : (typeof LazyRequireImages)[Key];

type ProxyImageType = {
    [Key in LazyImageKey]: LazyImageValue<Key>;
};
// Reason to use Proxy
// the prev image was a large object with inline requires which were getting evaluated during the very first import
// we wanted to lazily require it and it would have required changes from every pod which would took time and testing bandwidth from them
// that's why with Proxy we don't introduce any api change to dev api
// and it gave us smooth migration from import all assets at once to lazily evaluating them

const images = new Proxy(imageProxyTarget, imageProxyHandler) as ProxyImageType;
export default images;
