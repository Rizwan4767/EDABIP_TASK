const REGISTERED_EMAIL = "test@gmail.com";

export const verifyEmail = async (email) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (email.trim().toLowerCase() === REGISTERED_EMAIL) {
    return {
      success: true,
      message: "Email found",
    };
  }

  const error = new Error("No account is associated with this email address");
  error.title = "Email Not Found";
  error.message = "No account is associated with this email address";
  throw error;
};