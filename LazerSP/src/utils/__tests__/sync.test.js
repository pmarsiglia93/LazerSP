import { mergeFavorites, mergeVisits, visitsToPayload } from "../sync";

describe("mergeFavorites", () => {
  it("une os dois lados, mantém a ordem local e acrescenta os da conta", () => {
    const local = [{ id: 2, name: "Local 2" }, { id: 1, name: "Local 1" }];
    const remote = [{ id: 3, name: "Conta 3" }, { id: 1, name: "Conta 1" }];
    expect(mergeFavorites(local, remote).map((p) => p.id)).toEqual([2, 1, 3]);
  });

  it("prefere os dados da conta para lugares que estão nos dois lados", () => {
    const merged = mergeFavorites([{ id: 1, name: "Antigo", isOpen: false, distance: 2 }], [{ id: 1, name: "Novo", isOpen: true }]);
    expect(merged).toEqual([{ id: 1, name: "Novo", isOpen: true, distance: 2 }]);
  });

  it("funciona com um dos lados vazio", () => {
    expect(mergeFavorites([], [{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(mergeFavorites([{ id: 1 }], [])).toEqual([{ id: 1 }]);
  });
});

describe("mergeVisits", () => {
  const local = {
    1: { rating: 3, note: "local", visitedAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-05T10:00:00.000Z" },
    2: { rating: 5, note: "só local", visitedAt: "2026-10-02T10:00:00.000Z" },
  };

  it("acrescenta visitas que só existem na conta", () => {
    const merged = mergeVisits(local, [{ placeId: 9, rating: 4, note: "", visitedAt: "2026-09-01T10:00:00.000Z" }]);
    expect(Object.keys(merged).sort()).toEqual(["1", "2", "9"]);
  });

  it("mantém a versão local quando ela foi editada depois", () => {
    const remote = [{ placeId: 1, rating: 1, note: "conta", visitedAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-03T10:00:00.000Z" }];
    expect(mergeVisits(local, remote)[1].note).toBe("local");
  });

  it("usa a versão da conta quando ela foi editada depois", () => {
    const remote = [{ placeId: 1, rating: 4, note: "conta", visitedAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-09T10:00:00.000Z" }];
    expect(mergeVisits(local, remote)[1]).toEqual({
      rating: 4,
      note: "conta",
      visitedAt: "2026-10-01T10:00:00.000Z",
      updatedAt: "2026-10-09T10:00:00.000Z",
    });
  });

  it("não altera o objeto original", () => {
    mergeVisits(local, [{ placeId: 7, visitedAt: "2026-01-01T00:00:00.000Z" }]);
    expect(local[7]).toBeUndefined();
  });
});

describe("visitsToPayload", () => {
  it("converte o mapa local para a lista da API, usando visitedAt quando falta updatedAt", () => {
    expect(visitsToPayload({ 5: { rating: null, note: "", visitedAt: "2026-10-02T10:00:00.000Z" } })).toEqual([
      { placeId: 5, rating: null, note: "", visitedAt: "2026-10-02T10:00:00.000Z", updatedAt: "2026-10-02T10:00:00.000Z" },
    ]);
  });
});
