import { haversineKm, sortByDistance } from "../distance";

const PRACA_DA_SE = { latitude: -23.5505, longitude: -46.6333 };
const IBIRAPUERA = { latitude: -23.5874, longitude: -46.6576 };

describe("haversineKm", () => {
  it("retorna 0 para o mesmo ponto", () => {
    expect(haversineKm(PRACA_DA_SE, PRACA_DA_SE)).toBe(0);
  });

  it("calcula a distância entre a Praça da Sé e o Ibirapuera (cerca de 4,8 km)", () => {
    expect(haversineKm(PRACA_DA_SE, IBIRAPUERA)).toBeCloseTo(4.8, 1);
  });

  it("é simétrica", () => {
    expect(haversineKm(PRACA_DA_SE, IBIRAPUERA)).toBeCloseTo(haversineKm(IBIRAPUERA, PRACA_DA_SE), 10);
  });
});

describe("sortByDistance", () => {
  it("ordena do mais próximo ao mais distante e deixa lugares sem distância no fim", () => {
    const places = [
      { id: 1, distance: 5 },
      { id: 2, distance: null },
      { id: 3, distance: 1.2 },
      { id: 4, distance: null },
      { id: 5, distance: 3 },
    ];
    expect(sortByDistance(places).map((p) => p.id)).toEqual([3, 5, 1, 2, 4]);
  });

  it("não altera o array original", () => {
    const places = [{ distance: 2 }, { distance: 1 }];
    sortByDistance(places);
    expect(places.map((p) => p.distance)).toEqual([2, 1]);
  });
});
