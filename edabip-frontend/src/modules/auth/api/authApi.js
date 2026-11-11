import apiClient from "../../../lib/apiClient.js";
import { mockSignup } from "./mockSignupService.js";
import {
  mapBackendUser,
  // Phone normalization — maybe used in future
  // normalizePhoneForBackend,
} from "../utils/authSession.js";
import { isMockAuthEnabled } from "../utils/mockSession.js";

/** Internal mock OTP when VITE_ENABLE_MOCK_AUTH=true — never shown in the UI. */
const MOCK_EMAIL_OTP = "1234";
const MOCK_OTP_DELAY_MS = 300;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REGISTER_FIELD_LABELS = {
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  password: "Password",
};

function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "string") {
      return first;
    }
    if (first?.msg) {
      const field = Array.isArray(first.loc)
        ? first.loc.find((part) => typeof part === "string" && part !== "body")
        : "";
      const label = REGISTER_FIELD_LABELS[field];
      return label ? `${label}: ${first.msg}` : first.msg;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export async function login(credentials) {
  const { data } = await apiClient.post("/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });

  return {
    success: true,
    data: {
      user: mapBackendUser(data.user),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    },
  };
}

export async function signup(payload) {
  const firstName = (payload.firstName || "").trim();
  const lastName = (payload.lastName || "").trim();
  const fullName =
    (payload.fullName || `${firstName} ${lastName}`).trim();

  if (isMockAuthEnabled) {
    return mockSignup({
      ...payload,
      fullName,
    });
  }

  try {
    const { data } = await apiClient.post("/auth/register", {
      first_name: firstName,
      last_name: lastName,
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });

    return {
      success: true,
      status: 201,
      message: data.message || "Registered successfully.",
      data: {
        userId: data.user_id,
        email: payload.email.trim().toLowerCase(),
      },
    };
  } catch (error) {
    const status = error?.response?.status;
    const message = extractErrorMessage(error);

    if (status === 400 && /email/i.test(message)) {
      return {
        success: false,
        status,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message,
          field: "email",
        },
      };
    }

    if (status === 422) {
      const loc = error?.response?.data?.detail?.[0]?.loc;
      const backendField = Array.isArray(loc) ? loc.at(-1) : null;
      const fieldMap = {
        first_name: "firstName",
        last_name: "lastName",
        email: "email",
        password: "password",
      };
      return {
        success: false,
        status,
        error: {
          code: "VALIDATION_ERROR",
          message,
          field: fieldMap[backendField],
        },
      };
    }

    return {
      success: false,
      status: status || 500,
      error: {
        code: "SIGNUP_FAILED",
        message,
      },
    };
  }
}

export async function requestPasswordReset(email) {
  try {
    const { data } = await apiClient.post("/auth/forgot-password", { email });

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        success: false,
        error: {
          code: "EMAIL_NOT_FOUND",
          message: "Email not registered",
        },
      };
    }

    return {
      success: false,
      error: {
        message: extractErrorMessage(error),
      },
    };
  }
}

export async function resetPassword({ token, newPassword }) {
  try {
    const { data } = await apiClient.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: { message: extractErrorMessage(error) } };
  }
}

export async function verifyEmailOtp({ email, otp }) {
  if (isMockAuthEnabled) {
    await delay(MOCK_OTP_DELAY_MS);
    const normalized = String(otp || "").replace(/\D/g, "");

    if (normalized === MOCK_EMAIL_OTP) {
      return {
        success: true,
        isFullyVerified: true,
        message: "Email verified successfully.",
      };
    }

    const error = new Error("Invalid OTP");
    error.response = { status: 400, data: { detail: "Invalid OTP" } };
    throw error;
  }

  const { data } = await apiClient.post("/auth/verify-otp", { email, otp });
  return {
    success: true,
    isFullyVerified: Boolean(data.is_fully_verified),
    message: data.message,
  };
}

export async function resendEmailOtp(email) {
  if (isMockAuthEnabled) {
    await delay(MOCK_OTP_DELAY_MS);
    return {
      success: true,
      message: "OTP resent successfully.",
    };
  }

  const { data } = await apiClient.post("/auth/resend-otp", { email });
  return {
    success: true,
    message: data.message,
    isFullyVerified: Boolean(data.is_fully_verified),
  };
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    return { success: true };
  }

  await apiClient.post("/auth/logout", { refresh_token: refreshToken });
  return { success: true };
}

/**
 * `accessToken` is only for callers that hold a token which is not in storage
 * yet — the OAuth callback hydrates the user before it can persist a session.
 * Omit it and the request interceptor supplies the stored token as usual.
 */
export async function fetchCurrentUser(accessToken) {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : undefined;

  const { data } = await apiClient.get("/auth/me", config);
  return mapBackendUser(data);
}
export async function updateProfile({
  firstName,
  lastName,
  mobileNumber,
  applicationName,
  timezone,
  companySize,
  industry,
  emailNotifications,
}) {
  const { data } = await apiClient.patch("/auth/me", {
    first_name: firstName,
    last_name: lastName,
    mobile_number: mobileNumber || "",
    application_name: applicationName,
    timezone,
    company_size: companySize || "",
    industry: industry || "",
    email_notifications: Boolean(emailNotifications),
  });
  return mapBackendUser(data);
}

export async function refreshSession(refreshToken) {
  const { data } = await apiClient.post("/auth/refresh", {
    refresh_token: refreshToken,
  });

  return {
    user: mapBackendUser(data.user),
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

export { extractErrorMessage };
