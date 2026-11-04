/**
 * Cálculo de aberto/fechado a partir da string de horário de funcionamento.
 *
 * Todos os horários são interpretados no fuso de São Paulo, independentemente
 * do fuso do servidor (containers costumam rodar em UTC).
 */

const TIME_ZONE = "America/Sao_Paulo";
const MINUTES_PER_DAY = 24 * 60;

/** Abreviações de dias usadas nos ranges ("Ter-Dom"). 0 = Domingo ... 6 = Sábado */
const DAY_ABBR = {
  Dom: 0,
  Seg: 1,
  Ter: 2,
  Qua: 3,
  Qui: 4,
  Sex: 5,
  "Sáb": 6,
};

/** Nomes por extenso para dias individuais ("Feiras aos domingos") */
const DAY_NAMES = {
  domingo: 0,
  segunda: 1,
  "terça": 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  "sábado": 6,
};

const WEEKDAY_EN = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const dayKeys = Object.keys(DAY_ABBR).join("|");
const DAY_RANGE_RX = new RegExp(`(${dayKeys})\\s*-\\s*(${dayKeys})`);
// Abreviação isolada ("Sáb 10:00 - 17:00"), sem casar com "Domingos" ou "Segunda"
const DAY_SINGLE_RX = new RegExp(`(?<!\\p{L})(${dayKeys})(?!\\p{L})`, "gu");
const TIME_RANGE_RX = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Dia da semana e minutos desde a meia-noite no fuso de São Paulo.
 * @param {Date} date
 * @returns {{ day: number, minutes: number }}
 */
function getLocalTime(date) {
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    day: WEEKDAY_EN[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function parseTime(str) {
  const [h, m] = str.trim().split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Dias da semana de um trecho do horário. Retorna null quando o trecho não
 * menciona dias (interpretado como "todos os dias").
 * @param {string} text
 * @returns {Set<number>|null}
 */
function parseDays(text) {
  const range = text.match(DAY_RANGE_RX);
  if (range) {
    const start = DAY_ABBR[range[1]];
    const end = DAY_ABBR[range[2]];
    const days = new Set();
    // Percorre a semana a partir do dia inicial (cobre ranges como Qua-Seg)
    for (let d = start; ; d = (d + 1) % 7) {
      days.add(d);
      if (d === end) break;
    }
    return days;
  }

  const singles = [...text.matchAll(DAY_SINGLE_RX)].map((m) => DAY_ABBR[m[1]]);
  if (singles.length > 0) return new Set(singles);

  const lower = text.toLowerCase();
  for (const [name, dayNum] of Object.entries(DAY_NAMES)) {
    if (lower.includes(name)) return new Set([dayNum]);
  }

  return null;
}

/**
 * Converte um trecho ("Seg-Dom 12:00 - 16:00, 18:30 - 00:00") em dias e
 * intervalos em minutos. Retorna null se o trecho não tiver horário.
 */
function parseSegment(text) {
  const ranges = [...text.matchAll(TIME_RANGE_RX)].map((m) => {
    const open = parseTime(m[1]);
    let close = parseTime(m[2]);
    // "00:00" e "24:00" como fechamento significam meia-noite do mesmo dia
    if (close === 0 || close >= MINUTES_PER_DAY) close = MINUTES_PER_DAY;
    return [open, close];
  });
  if (ranges.length === 0) return null;
  return { days: parseDays(text), ranges };
}

/**
 * Determina se um lugar está aberto no instante informado.
 * Retorna true, false ou null (quando não foi possível interpretar o formato,
 * como em "Conforme programação").
 *
 * Formatos suportados (trechos separados por ";"):
 *   - "Aberto 24 horas"
 *   - "05:00 - 24:00"                                   (todos os dias)
 *   - "Ter-Dom 10:00 - 18:00"                           (range de dias)
 *   - "Seg-Sex 12:00 - 18:00 (observações)"
 *   - "Feiras aos domingos 09:00 - 18:00"               (dia por extenso)
 *   - "Ter-Sex 10:00 - 21:30; Sáb-Dom 10:00 - 18:30"    (horários por dia)
 *   - "Seg-Dom 12:00 - 16:00, 18:30 - 00:00"            (dois turnos)
 *   - "Sex-Sáb 23:00 - 05:00"                           (vira a madrugada: o horário
 *                                                        após a meia-noite pertence
 *                                                        ao dia anterior)
 *
 * @param {string} openingHours
 * @param {Date} [now] instante de referência (padrão: agora)
 * @returns {boolean|null}
 */
function isOpenNow(openingHours, now = new Date()) {
  if (!openingHours) return null;

  if (/24\s*horas?/i.test(openingHours)) return true;

  const segments = openingHours.split(";").map(parseSegment).filter(Boolean);
  if (segments.length === 0) return null;

  const { day, minutes } = getLocalTime(now);
  const yesterday = (day + 6) % 7;

  return segments.some(({ days, ranges }) => {
    const opensOn = (d) => days === null || days.has(d);
    return ranges.some(([open, close]) => {
      if (close > open) return opensOn(day) && minutes >= open && minutes < close;
      // Atravessa a meia-noite: aberto do horário de abertura até o fim do
      // dia ou, no dia seguinte, da meia-noite até o fechamento.
      return (opensOn(day) && minutes >= open) || (opensOn(yesterday) && minutes < close);
    });
  });
}

module.exports = { isOpenNow, TIME_ZONE };
