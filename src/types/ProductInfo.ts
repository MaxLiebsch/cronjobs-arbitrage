export type ProductInfo =
  | {
      value: string | number;
      key: string;
      defaultValue: string;
      targetKey: string;
    }
  | {
      value: string | number;
      key: string;
      defaultValue: number;
      targetKey: string;
    };
