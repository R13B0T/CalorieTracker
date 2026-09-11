import { describe, expect, it } from 'vitest';
import { isValidBarcode, looksLikeBarcode } from '@/lib/food/barcode';

describe('barcode validation', () => {
  it('accepts checksum-valid EAN and UPC values', () => {
    expect(isValidBarcode('3017620422003')).toBe(true);
    expect(isValidBarcode('036000291452')).toBe(true);
    expect(isValidBarcode('96385074')).toBe(true);
  });

  it('rejects likely one-frame misreads with a bad checksum', () => {
    expect(looksLikeBarcode('3017620422004')).toBe(true);
    expect(isValidBarcode('3017620422004')).toBe(false);
    expect(isValidBarcode('not a barcode')).toBe(false);
  });
});
