
export function getHRAnalyticsData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalHeadcount: "4,821",
        turnoverRate: "8.5%",
        enpsScore: "42",
        timeToHire: "34 Days",
      });
    }, 750);
  });
}