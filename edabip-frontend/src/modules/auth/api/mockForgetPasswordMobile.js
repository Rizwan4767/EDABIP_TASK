const REGISTERED_MOBILE = "9000000000";

export const verifyMobile = async (mobile) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (mobile === REGISTERED_MOBILE) {
    return {
      success: true,
      message: "Mobile number found",
    };
  }

  return {
    success: false,
    message: "No account is associated with this mobile number",
  };
};