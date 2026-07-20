import { parseCorsOrigins } from './cors';

describe('parseCorsOrigins', () => {
  it('separa varios orígenes por coma y recorta espacios', () => {
    expect(
      parseCorsOrigins('http://localhost:3000, http://localhost:4000'),
    ).toEqual(['http://localhost:3000', 'http://localhost:4000']);
  });

  it('devuelve un arreglo con un solo origen', () => {
    expect(parseCorsOrigins('http://localhost:3000')).toEqual([
      'http://localhost:3000',
    ]);
  });

  it('devuelve un arreglo vacío si no hay valor', () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins('')).toEqual([]);
  });
});
