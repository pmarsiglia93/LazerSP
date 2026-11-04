const { isOpenNow } = require("../../src/utils/openingHours");
const { places } = require("../../src/database/seed");
const { NOVOS_LUGARES } = require("../../src/database/data/2026-11-novos-lugares");

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

  describe("vários trechos e turnos", () => {
    const SESC = "Ter-Sex 10:00 - 21:30; Sáb-Dom 10:00 - 18:30";

    it("usa o horário do trecho do dia (terça 21h: aberto)", () => {
      expect(isOpenNow(SESC, at("2025-03-25T21:00:00"))).toBe(true);
    });

    it("usa o horário do trecho do dia (sábado 19h: fechado)", () => {
      expect(isOpenNow(SESC, at("2025-03-29T19:00:00"))).toBe(false);
    });

    it("fica fechado no dia que não aparece em nenhum trecho (segunda)", () => {
      expect(isOpenNow(SESC, at("2025-03-24T12:00:00"))).toBe(false);
    });

    it("reconhece dia abreviado sozinho (\"Sáb 10:00 - 17:00\")", () => {
      const BIBLIOTECA = "Seg-Sex 08:30 - 20:30; Sáb 10:00 - 17:00";
      expect(isOpenNow(BIBLIOTECA, at("2025-03-29T16:00:00"))).toBe(true);
      expect(isOpenNow(BIBLIOTECA, at("2025-03-30T12:00:00"))).toBe(false);
    });

    it("aceita dois turnos no mesmo dia, fechando no intervalo", () => {
      const CANTINA = "Seg-Dom 12:00 - 16:00, 18:30 - 00:00";
      expect(isOpenNow(CANTINA, at("2025-03-25T13:00:00"))).toBe(true);
      expect(isOpenNow(CANTINA, at("2025-03-25T17:00:00"))).toBe(false);
      expect(isOpenNow(CANTINA, at("2025-03-25T23:00:00"))).toBe(true);
    });

    it("combina trechos com madrugada (sábado até 01h)", () => {
      const CASA = "Ter 11:30 - 15:30; Qua-Sex 11:30 - 00:00; Sáb 12:00 - 01:00; Dom 12:00 - 20:00";
      expect(isOpenNow(CASA, at("2025-03-30T00:30:00"))).toBe(true); // madrugada de domingo
      expect(isOpenNow(CASA, at("2025-03-25T18:00:00"))).toBe(false); // terça à noite
    });

    it("trata segunda isolada e pula a terça (\"Seg ...; Qua-Sex ...\")", () => {
      const OLIDO = "Seg 10:00 - 18:00; Qua-Sex 10:00 - 18:00; Sáb-Dom 13:00 - 18:00";
      expect(isOpenNow(OLIDO, at("2025-03-24T11:00:00"))).toBe(true);
      expect(isOpenNow(OLIDO, at("2025-03-25T11:00:00"))).toBe(false);
    });

    it("retorna null para texto sem horário, como \"Conforme programação\"", () => {
      expect(isOpenNow("Conforme programação", TUESDAY_14H)).toBeNull();
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
    it.each(
      [...places, ...NOVOS_LUGARES]
        .filter((p) => p.opening_hours !== "Conforme programação")
        .map((p) => [p.name, p.opening_hours])
    )(
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
