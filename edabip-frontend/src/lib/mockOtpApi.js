const MOCK_OTP = "4185";
const OTP_EXPIRY_MINUTES = 5;

let mockOtpData = {
  otp: null,
  expiresAt: null,
};

export const sendMockOtp = async () => {
  mockOtpData = {
    otp: MOCK_OTP,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  };

  console.log("Mock OTP:", MOCK_OTP);
  console.log("OTP expires at:", new Date(mockOtpData.expiresAt).toLocaleTimeString());

  return {
    success: true,
    otp: MOCK_OTP,
    expiresAt: mockOtpData.expiresAt,
  };
};

export const verifyMockOtp = async (enteredOtp) => {
  if (!mockOtpData.otp || !mockOtpData.expiresAt) {
    return {
      success: false,
      reason: "NO_OTP",
      message: "Please request OTP first.",
    };
  }

  if (Date.now() > mockOtpData.expiresAt) {
    return {
      success: false,
      reason: "OTP_EXPIRED",
      message: "OTP expired",
    };
  }

  if (enteredOtp !== mockOtpData.otp) {
    return {
      success: false,
      reason: "INVALID_OTP",
      message: "Invalid OTP",
    };
  }

  return {
    success: true,
    message: "OTP verified successfully",
  };
};