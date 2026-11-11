export const getEmbedToken = async () => {
  return Promise.resolve(null);
};

// Simulates the network round-trip for the reports list so the page can show
// its loading (skeleton) state, matching the pattern used by billingApi/dashboardApi.
export const getPowerBIReports = async () => {
  await new Promise((resolve) => setTimeout(resolve, 750));
  return true;
};
