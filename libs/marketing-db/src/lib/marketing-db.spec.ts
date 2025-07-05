import { marketingDb } from './marketing-db';

describe('marketingDb', () => {
  it('should work', () => {
    expect(marketingDb()).toEqual('marketing-db');
  });
});
