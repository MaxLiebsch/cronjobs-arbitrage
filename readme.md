TO DO

Übersichtlichkeit Post:
Product Object Liste
"asin": String,         //check
"title": String,        //check
"categories": Long array, // ham wa
"eanList": String array, //check
"brand": String, //check with mnfctr
"numberOfItems": Integer, //check
The number of items of this product. -1 if not available.
"availabilityAmazon": Integer 
Availability of the Amazon offer. Possible values:
-1: no Amazon offer exists
0: Amazon offer is in stock and shippable
1: Amazon offer is currently not in stock, but will be in the future (pre-order)
2: Amazon offer availability is “unknown”
3: Amazon offer is currently not in stock, but will be in the future (back-order)
4: Amazon offer shipping is delayed - see “availabilityAmazonDelay” for more details
"salesRanks": Object, check
products[0].categoryTree to parse Name of category in sales Rank
"monthlySold": Integer, undefined for most asin

"offers": Marketplace Offer Object array - to expensive

Statistics Object Liste:
Preis???BSR?:
"avg": Integer array
"avg30": Integer array,
"avg90": Integer array,
"avg180": Integer array,
buyBoxIsAmazon
stockAmazon: The stock of the Amazon offer, if available. Otherwise undefined.
stockBuyBox: The stock of the buy box offer, if available. Otherwise undefined.
totalOfferCount
The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.

Kepla graph
Amazon history prices
products[0].csv[0] || null

Amazon new history prices
products[0].csv[1] || null

Amazon used history prices
products[0].csv[2] || null

Sales Rank nullable
products[0].csv[3] || null
