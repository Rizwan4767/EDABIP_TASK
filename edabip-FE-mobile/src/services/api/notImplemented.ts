/**
 * Marker for API surfaces whose backend routes do not exist yet.
 *
 * The EDABIP FastAPI service currently mounts only the auth routers. Rather
 * than invent request/response contracts, the remaining domain modules declare
 * their operations and fail loudly if something calls them before the backend
 * router ships. Each domain is also gated behind `appConfig.features.*`.
 */
export function notImplemented(operation: string): never {
  throw new Error(
    `${operation} is unavailable: the EDABIP backend does not expose this endpoint yet. ` +
      'Add the route to services/api/endpoints.ts and implement the call once it ships.',
  );
}
