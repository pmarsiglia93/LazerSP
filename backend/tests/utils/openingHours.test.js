const { isOpenNow } = require("../../src/utils/openingHours");

// Fixa a data em uma terça-feira às 14:00
const TUESDAY_14H = new Date("2025-03-25T14:00:00");
// Fixa a data em um domingo às 10:30
const SUNDAY_10H30 = new Date("2025-03-23T10:30:00");
// Fora do horário: terça às 20:00
const TUESDAY_20H = new Date("2025-03-25T20:00:00");

function withDate(date, fn) {
  const original = Date;
  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) return super(date);
      return super(...args);
    }
  };
  global.Date.now = () => date.getTime();
  try {
    return fn();
  } finally {
    global.Date = original;
  }
}

describe("isOpenNow", () => {
  it('retorna true para "Aberto 24 horas"', () => {
    expect(isOpenNow("Aberto 24 horas")).toBe(true);
  });

  it("retorna null para string vazia ou nula", () => {
    expect(isOpenNow(null)).toBeNull();
    expect(isOpenNow("")).toBeNull();
  });

  it("retorna null quando não consegue interpretar o formato", () => {
    expect(isOpenNow("Consulte o local")).toBeNull();
  });

  it("retorna true quando dentro do horário (sem dia)", () => {
    const result = withDate(TUESDAY_14H, () => isOpenNow("05:00 - 24:00"));
    expect(result).toBe(true);
  });

  it("retorna false quando fora do horário (sem dia)", () => {
    const result = withDate(TUESDAY_20H, () => isOpenNow("09:00 - 18:00"));
    expect(result).toBe(false);
  });

  it("retorna true para range de dias e horário corretos (Ter-Dom, terça às 14h)", () => {
    const result = withDate(TUESDAY_14H, () =>
      isOpenNow("Ter-Dom 10:00 - 18:00")
    );
    expect(result).toBe(true);
  });

  it("retorna false quando dia fora do range (Ter-Dom, segunda está fora)", () => {
    // Segunda-feira às 14:00
    const monday = new Date("2025-03-24T14:00:00");
    const result = withDate(monday, () => isOpenNow("Ter-Dom 10:00 - 18:00"));
    expect(result).toBe(false);
  });

  it("retorna false quando horário fora do range mesmo com dia correto", () => {
    const result = withDate(TUESDAY_20H, () =>
      isOpenNow("Ter-Dom 10:00 - 18:00")
    );
    expect(result).toBe(false);
  });

  it("ignora observações entre parênteses (Seg-Sex)", () => {
    const result = withDate(TUESDAY_14H, () =>
      isOpenNow("Seg-Sex 12:00 - 18:00 (visitas guiadas)")
    );
    expect(result).toBe(true);
  });

  it("trata range que atravessa virada de semana (Qua-Seg, domingo incluído)", () => {
    const result = withDate(SUNDAY_10H30, () =>
      isOpenNow("Qua-Seg 10:00 - 18:00")
    );
    expect(result).toBe(true);
  });

  it('reconhece "domingos" como dia individual', () => {
    const result = withDate(SUNDAY_10H30, () =>
      isOpenNow("Feiras aos domingos 09:00 - 18:00")
    );
    expect(result).toBe(true);
  });

  it('"domingos" retorna false em dia diferente (terça)', () => {
    const result = withDate(TUESDAY_14H, () =>
      isOpenNow("Feiras aos domingos 09:00 - 18:00")
    );
    expect(result).toBe(false);
  });
});
