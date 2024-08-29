export const shopFilter = (shop) => {
  return (
    shop.active &&
    shop.d !== "amazon.de" &&
    shop.d !== "ebay.de" &&
    shop.d !== "sellercentral.amazon.de"
  );
};
