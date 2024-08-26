const testShops = ["idealo.de", "dm.de", "cyberport.de", "sales"];

export const shopFilter = (shop) => {
  return shop.active && testShops.includes(shop.d);
  //   shop.d !== "amazon.de" &&
  //   shop.d !== "ebay.de" &&
  //   shop.d !== "sellercentral.amazon.de"
};
