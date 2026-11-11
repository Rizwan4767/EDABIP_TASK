/**
 * Turns a failed request into something a form can display.
 *
 * The Settings API answers with three different error bodies, all confirmed
 * against the running service:
 *
 *   400 business rule    { "detail": "Email already in use" }
 *   422 route rejection  { "detail": "Password must be at least 8 characters." }
 *   422 field validation { "detail": "Invalid request",
 *                          "errors": [{ "loc": ["body", "firstName"],
 *                                       "msg": "Value error, This field cannot be blank." }] }
 *
 * The third case is the useful one: `loc[1]` is the camelCase field name —
 * the same key the forms already use in their `errors` state — so it maps
 * straight onto a field without translation.
 *
 * NOTE: modules/auth/api/authApi.js has a narrower private copy of this idea.
 * Worth consolidating onto this file, but that touches the login flow, so it
 * was left alone here.
 */

// Pydantic prefixes anything raised by a custom validator. Users must not see it.
const VALUE_ERROR_PREFIX = "Value error, ";

function cleanMessage(message) {
  const text = String(message || "").trim();
  return text.startsWith(VALUE_ERROR_PREFIX)
    ? text.slice(VALUE_ERROR_PREFIX.length)
    : text;
}

/**
 * @returns {{ message: string, fieldErrors: Record<string, string> }}
 */
export function readApiError(error, fallbackMessage = "Something went wrong. Please try again.") {
  const response = error?.response;

  // No response at all — server down, wrong port, CORS, offline.
  if (!response) {
    return {
      message: "Cannot reach the settings service. Check that it is running.",
      fieldErrors: {},
    };
  }

  const data = response.data || {};
  const fieldErrors = {};

  // Field-level validation errors.
  const errors = Array.isArray(data.errors)
    ? data.errors
    : Array.isArray(data.detail)
      ? data.detail
      : [];

  errors.forEach((item) => {
    const field = Array.isArray(item?.loc)
      ? item.loc.find((part) => typeof part === "string" && part !== "body")
      : null;
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = cleanMessage(item.msg);
    }
  });

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  // Plain string detail — safe to show as-is.
  if (typeof data.detail === "string" && data.detail.trim()) {
    return { message: cleanMessage(data.detail), fieldErrors: {} };
  }

  if (response.status === 401 || response.status === 404) {
    return {
      message: "Your session could not be verified for settings. Please sign in again.",
      fieldErrors: {},
    };
  }

  return { message: fallbackMessage, fieldErrors: {} };
}

/**
 * Rethrows an axios failure as a plain Error carrying `.fieldErrors`, so the
 * calling component can `catch (err)` and read `err.message` directly.
 */
export function toDisplayError(error, fallbackMessage) {
  const { message, fieldErrors } = readApiError(error, fallbackMessage);
  const displayError = new Error(message);
  displayError.fieldErrors = fieldErrors;
  displayError.status = error?.response?.status ?? 0;
  return displayError;
}
