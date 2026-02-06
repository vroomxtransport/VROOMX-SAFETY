import { lazy } from 'react';

/**
 * Detects chunk/module loading errors caused by stale deployments.
 */
export function isChunkLoadError(error) {
  const message = error?.message || '';
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    message.includes('Unable to preload CSS')
  );
}

/**
 * Wraps React.lazy() with retry logic for chunk loading failures.
 * Retries 3 times with exponential backoff (1s, 2s, 4s) before giving up.
 */
export function lazyWithRetry(importFn) {
  return lazy(() => retryImport(importFn, 3));
}

function retryImport(importFn, retries, delay = 1000) {
  return importFn().catch((error) => {
    if (retries > 0 && isChunkLoadError(error)) {
      return new Promise((resolve) => setTimeout(resolve, delay)).then(() =>
        retryImport(importFn, retries - 1, delay * 2)
      );
    }
    throw error;
  });
}
