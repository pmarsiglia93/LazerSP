import { directionsUrl, formatOpeningHours, getPlaceStatus, getStatusStyle, hasRating } from "../place";

describe("getPlaceStatus", () => {
  it.each([
    [true, "open"],
    [false, "closed"],
    [null, "schedule"],
    [undefined, "schedule"],
  ])("isOpen %p resulta em %s", (isOpen, expected) => {
    expect(getPlaceStatus({ isOpen })).toBe(expected);
  });

  it("devolve a chave de tradução do selo", () => {
    expect(getStatusStyle({ isOpen: null }).labelKey).toBe("details.check_schedule");
    expect(getStatusStyle({ isOpen: true }).labelKey).toBe("details.open");
  });
});

describe("hasRating", () => {
  it("esconde a avaliação zerada dos lugares novos", () => {
    expect(hasRating({ rating: 0 })).toBe(false);
    expect(hasRating({ rating: 4.7 })).toBe(true);
    expect(hasRating({})).toBe(false);
  });
});

describe("formatOpeningHours", () => {
  it("coloca cada trecho em uma linha", () => {
    expect(formatOpeningHours("Ter-Sex 10:00 - 21:30; Sáb-Dom 10:00 - 18:30")).toBe(
      "Ter-Sex 10:00 - 21:30\nSáb-Dom 10:00 - 18:30"
    );
  });

  it("mantém horários de um trecho só", () => {
    expect(formatOpeningHours("06:00 - 22:00")).toBe("06:00 - 22:00");
    expect(formatOpeningHours("")).toBe("");
  });
});

describe("directionsUrl", () => {
  it("usa nome e endereço no destino, codificados", () => {
    const url = directionsUrl({ name: "Sesc Pompeia", address: "Rua Clélia, 93 - Pompeia, São Paulo" });
    expect(url).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=Sesc%20Pompeia%2C%20Rua%20Cl%C3%A9lia%2C%2093%20-%20Pompeia%2C%20S%C3%A3o%20Paulo&travelmode=transit"
    );
  });
});
