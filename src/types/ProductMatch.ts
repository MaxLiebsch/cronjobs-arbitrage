export interface ProductMatchResponse {
  succeed: boolean;
  data: Data;
}

export interface Data {
  countryCode: string;
  merchantId: string;
  searchKey: string;
  myProducts: MyProducts;
  otherProducts: OtherProducts;
}

export interface MyProducts {
  totalProductCount: number;
  currentPage: number;
  products: any[];
}

export interface OtherProducts {
  totalProductCount: number;
  currentPage: number;
  products: Product[];
}

export interface Product {
  asin: string;
  imageUrl: string;
  thumbStringUrl: string;
  gl: string;
  title: string;
  weightUnit: string;
  weightUnitStringId: string;
  weight: number;
  dimensionUnit: string;
  dimensionUnitStringId: string;
  width: number;
  length: number;
  height: number;
  price: number;
  link: string;
  isMyProduct: boolean;
  salesRank: number;
  salesRankContextName: string;
  customerReviewsCount: number;
  customerReviewsRating: string;
  customerReviewsRatingfullStarCount: number;
  customerReviewsRatingValue: number;
  offerCount: number;
}
