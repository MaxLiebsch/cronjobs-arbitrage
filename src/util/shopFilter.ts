import { Shop } from "@dipmaxtech/clr-pkg";

export const shopFilter = (shop: Shop) => {
  return (
    shop.active &&
    shop.d !== "amazon.de" &&
    shop.d !== "ebay.de" &&
    shop.d !== "sellercentral.amazon.de"
  );
};

export const includeFilter = (shop: Shop) => {
  return (
    shop.active &&
    shop.d !== "amazon.de" &&
    shop.d !== "ebay.de" &&
    shop.d !== "sellercentral.amazon.de" &&
    (shop.d === "idealo.de" || shop.d === "mueller.de" || shop.d === "dm.de")
  );
};
