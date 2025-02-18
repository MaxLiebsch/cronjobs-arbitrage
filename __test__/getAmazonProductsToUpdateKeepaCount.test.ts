import { getAmazonProductsToUpdateKeepaCount } from "../src/db/util/getKeepaProgress";


describe('getAmazonProductsToUpdateKeepaCount', () => {
  it('should return the correct count', async () => {
    const count = await getAmazonProductsToUpdateKeepaCount('idealo.de');
    expect(count).toBeGreaterThan(100);
  });
});

