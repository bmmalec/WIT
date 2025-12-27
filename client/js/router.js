/**
 * Simple client-side router for WIT Application
 */

const { ref, shallowRef, markRaw } = Vue;

// Current route state
const currentRoute = ref({
  path: '/',
  params: {},
  query: {},
});

// Current component to render
const currentComponent = shallowRef(null);

// Route definitions
const routes = [];

// Auth guard function
let authGuard = null;

/**
 * Register routes
 * @param {Array} routeDefinitions
 */
function registerRoutes(routeDefinitions) {
  routes.length = 0;
  routes.push(...routeDefinitions);
}

/**
 * Set auth guard function
 * @param {Function} guard - (to, from) => boolean | string
 */
function setAuthGuard(guard) {
  authGuard = guard;
}

/**
 * Parse URL path and extract params
 * @param {string} pattern - Route pattern (e.g., '/items/:id')
 * @param {string} path - Actual path (e.g., '/items/123')
 * @returns {Object|null} Params object or null if no match
 */
function matchRoute(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

/**
 * Parse query string
 * @param {string} search
 * @returns {Object}
 */
function parseQuery(search) {
  const query = {};
  const params = new URLSearchParams(search);
  for (const [key, value] of params) {
    query[key] = value;
  }
  return query;
}

/**
 * Navigate to a path
 * @param {string} path
 * @param {Object} options - { replace?: boolean }
 */
async function navigate(path, options = {}) {
  const [pathname, search] = path.split('?');
  const query = parseQuery(search || '');

  // Find matching route
  let matchedRoute = null;
  let params = {};

  for (const route of routes) {
    const match = matchRoute(route.path, pathname);
    if (match !== null) {
      matchedRoute = route;
      params = match;
      break;
    }
  }

  if (!matchedRoute) {
    // 404 - try to find a catch-all route
    matchedRoute = routes.find((r) => r.path === '*');
    if (!matchedRoute) {
      console.error(`No route found for: ${pathname}`);
      return;
    }
  }

  // Check auth guard
  if (authGuard && matchedRoute.meta?.requiresAuth) {
    const guardResult = authGuard(
      { path: pathname, params, query, meta: matchedRoute.meta },
      currentRoute.value
    );

    if (guardResult === false) {
      return; // Navigation cancelled
    }

    if (typeof guardResult === 'string') {
      // Redirect to another path
      navigate(guardResult, { replace: true });
      return;
    }
  }

  // Check guest guard (redirect authenticated users away from login/register)
  if (authGuard && matchedRoute.meta?.guestOnly) {
    const guardResult = authGuard(
      { path: pathname, params, query, meta: matchedRoute.meta },
      currentRoute.value
    );

    if (guardResult === false) {
      return;
    }

    if (typeof guardResult === 'string') {
      navigate(guardResult, { replace: true });
      return;
    }
  }

  // Update browser history
  if (options.replace) {
    history.replaceState({ path: pathname }, '', path);
  } else {
    history.pushState({ path: pathname }, '', path);
  }

  // Update current route
  currentRoute.value = {
    path: pathname,
    params,
    query,
    meta: matchedRoute.meta || {},
  };

  // Load and set component
  if (typeof matchedRoute.component === 'function') {
    // Lazy loaded component
    const module = await matchedRoute.component();
    currentComponent.value = markRaw(module.default || module);
  } else {
    currentComponent.value = markRaw(matchedRoute.component);
  }
}

/**
 * Go back in history
 */
function back() {
  history.back();
}

/**
 * Go forward in history
 */
function forward() {
  history.forward();
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
  if (event.state?.path) {
    navigate(event.state.path, { replace: true });
  } else {
    navigate(window.location.pathname + window.location.search, { replace: true });
  }
});

// Router object
const router = {
  currentRoute,
  currentComponent,
  routes,
  registerRoutes,
  setAuthGuard,
  navigate,
  push: navigate,
  replace: (path) => navigate(path, { replace: true }),
  back,
  forward,
};

// Expose globally
window.router = router;

export default router;
