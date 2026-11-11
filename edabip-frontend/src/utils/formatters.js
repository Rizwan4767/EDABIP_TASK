export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount) => {
  return `$${amount.toLocaleString()}`;
};

export const formatNumber = (num) => {
  return num.toLocaleString();
};
