const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatINR = (amount) => {
  const value = Number(amount || 0);
  return inrFormatter.format(Number.isFinite(value) ? value : 0);
};
