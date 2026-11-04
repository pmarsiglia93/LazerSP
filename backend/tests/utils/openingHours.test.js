const { isOpenNow } = require("../../src/utils/openingHours");
const { places } = require("../../src/database/seed");

// Datas com offset explícito de São Paulo (-03:00), para que os testes não
// dependam do fuso da máquina que roda o Jest.
const at = (localIso) => new Date(`${localIso}-03:00`);

const TUESDAY_14H = at("2025-03-25T14:00:00");
const TUESDAY_20H = at("2025-03-25T20:00:00");
const SUNDAY_10H30 = at("2025-03-23T10:30:00");

describe("isOpenNow", () => {
  describe("formatos básicos", () => {
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
      expect(isOpenNow("05:00 - 24:00", TUESDAY_14H)).toBe(true);
    });

    it("retorna false quando fora do horário (sem dia)", () => {
      expect(isOpenNow("09:00 - 18:00", TUESDAY_20H)).toBe(false);
    });

    it("usa o horário atual quando nenhuma data é informada", () => {
      expect(typeof isOpenNow("09:00 - 18:00")).toBe("boolean");
    });
  });

  describe("dias da semana", () => {
    it("retorna true para range de dias e horário corretos (Ter-Dom, terça às 14h)", () => {
      expect(isOpenNow("Ter-Dom 10:00 - 18:00", TUESDAY_14H)).toBe(true);
    });

    it("retorna false quando dia fora do range (Ter-Dom, segunda está fora)", () => {
      expect(isOpenNow("Ter-Dom 10:00 - 18:00", at("2025-03-24T14:00:00"))).toBe(false);
    });

    it("retorna false quando horário fora do range mesmo com dia correto", () => {
      expect(isOpenNow("Ter-Dom 10:00 - 18:00", TUESDAY_20H)).toBe(false);
    });

    it("ignora observações entre parênteses (Seg-Sex)", () => {
      expect(isOpenNow("Seg-Sex 12:00 - 18:00 (visitas guiadas)", TUESDAY_14H)).toBe(true);
    });

    it("trata range que atravessa virada de semana (Qua-Seg, domingo incluído)", () => {
      expect(isOpenNow("Qua-Seg 10:00 - 18:00", SUNDAY_10H30)).toBe(true);
    });

    it('reconhece "domingos" como dia individual', () => {
      expect(isOpenNow("Feiras aos domingos 09:00 - 18:00", SUNDAY_10H30)).toBe(true);
    });

    it('"domingos" retorna false em dia diferente (terça)', () => {
      expect(isOpenNow("Feiras aos domingos 09:00 - 18:00", TUESDAY_14H)).toBe(false);
    });
  });

  describe("fechamento à meia-noite", () => {
    it('trata "00:00" como meia-noite do mesmo dia', () => {
      expect(isOpenNow("Seg-Dom 12:00 - 00:00", at("2025-03-25T23:30:00"))).toBe(true);
    });

    it('"00:00" fecha às 00:00 em ponto', () => {
      expect(isOpenNow("Seg-Dom 12:00 - 00:00", at("2025-03-26T00:00:00"))).toBe(false);
    });
  });

  describe("horários que atravessam a madrugada", () => {
    const BALADA = "Sex-Sáb 23:00 - 05:00";

    it("está aberto no próprio dia, depois da abertura (sexta 23h30)", () => {
      expect(isOpenNow(BALADA, at("2025-03-28T23:30:00"))).toBe(true);
    });

    it("continua aberto depois da meia-noite (madrugada de sábado, 02h)", () => {
      expect(isOpenNow(BALADA, at("2025-03-29T02:00:00"))).toBe(true);
    });

    it("a madrugada de domingo pertence ao sábado (domingo 04h)", () => {
      expect(isOpenNow(BALADA, at("2025-03-30T04:00:00"))).toBe(true);
    });

    it("fecha no horário de fechamento (sábado 05h)", () => {
      expect(isOpenNow(BALADA, at("2025-03-29T05:00:00"))).toBe(false);
    });

    it("está fechado na madrugada de sexta, porque quinta não abre (sexta 02h)", () => {
      expect(isOpenNow(BALADA, at("2025-03-28T02:00:00"))).toBe(false);
    });

    it("está fechado antes da abertura (sexta 22h)", () => {
      expect(isOpenNow(BALADA, at("2025-03-28T22:00:00"))).toBe(false);
    });
  });

  describe("fuso horário", () => {
    it("interpreta o horário em São Paulo mesmo com o servidor em UTC", () => {
      // 01:00 UTC de quarta = 22:00 de terça em São Paulo
      const instant = new Date("2025-03-26T01:00:00Z");
      expect(isOpenNow("Ter-Dom 18:00 - 21:00", instant)).toBe(false);
      expect(isOpenNow("Ter-Dom 18:00 - 23:00", instant)).toBe(true);
    });
  });

  describe("regressão: dados do seed", () => {
    // Antes da correção, 16 dos 45 lugares nunca apareciam abertos.
    it.each(places.map((p) => [p.name, p.opening_hours]))(
      "%s (%s) aparece aberto em algum momento da semana",
      (_name, hours) => {
        const start = at("2025-03-23T00:00:00").getTime(); // domingo
        let openSomeTime = false;
        for (let m = 0; m < 7 * 24 * 60 && !openSomeTime; m += 15) {
          openSomeTime = isOpenNow(hours, new Date(start + m * 60000)) === true;
        }
        expect(openSomeTime).toBe(true);
      }
    );
  });
});
