export interface AdditionalProductInfoResponse {
    succeed: boolean
    data: Data
  }
  
  export interface Data {
    asin: string
    soldBy: string
    condition: string
    shipsFrom: string
    price: Price
    shipping: Shipping
  }
  
  export interface Price {
    amount: number
    currency: string
  }
  
  export interface Shipping {
    amount: number
    currency: string
  }