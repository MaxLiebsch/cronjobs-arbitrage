

export interface PendingShop {
  d: string;
  pending: number;
}

export interface PendingShopWithBatch extends PendingShop {
  batch: number;
}

export type PendingShopsWithBatch = { [key: string]: PendingShopWithBatch };

export type PendingShops = PendingShop[];