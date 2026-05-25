/**
 * Get cache statistics
 */
export async function getCacheStatus() {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker?.controller) {
      reject(new Error('Service Worker not available'));
      return;
    }

    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_STATUS') {
        resolve(event.data.data);
      } else if (event.data.type === 'ERROR') {
        reject(new Error(event.data.error));
      }
    };

    navigator.serviceWorker.controller.postMessage(
      {
        type: 'CACHE_STATUS',
      },
      [channel.port2]
    );
  });
}

/**
 * Clear service worker caches
 */
export async function clearServiceWorkerCache(cacheType = 'all') {
  if (!navigator.serviceWorker?.controller) {
    throw new Error('Service Worker not available');
  }

  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data.type === 'CACHE_CLEARED') {
        navigator.serviceWorker.removeEventListener('message', handler);
        resolve(event.data.payload);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);

    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE',
      payload: {
        type: cacheType,
        cacheTypes: cacheType === 'all' ? [] : [cacheType],
      },
    });
  });
}

/**
 * Request service worker update
 */
export async function updateServiceWorker() {
  if (!navigator.serviceWorker?.controller) {
    throw new Error('Service Worker not available');
  }

  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data.type === 'CACHE_UPDATED') {
        navigator.serviceWorker.removeEventListener('message', handler);
        resolve(event.data.version);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);

    navigator.serviceWorker.controller.postMessage({
      type: 'SKIP_WAITING',
    });
  });
}

/**
 * Listen for cache updates from service worker
 */
export function onCacheUpdate(callback) {
  if (!navigator.serviceWorker) {
    return () => {};
  }

  const handler = (event) => {
    if (event.data.type === 'API_UPDATED') {
      callback({
        type: 'API_UPDATED',
        url: event.data.url,
      });
    } else if (event.data.type === 'CACHE_UPDATED') {
      callback({
        type: 'CACHE_UPDATED',
        version: event.data.version,
      });
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);

  // Return unsubscribe function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

