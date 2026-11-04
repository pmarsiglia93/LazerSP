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
const TIME_RANGE_RX = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/;

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
 * Dias da semana em que o lugar abre. Retorna null quando a string não
 * menciona dias (interpretado como "todos os dias").
 * @param {string} openingHours
 * @returns {Set<number>|null}
 */
function parseDays(openingHours) {
  const range = openingHours.match(DAY_RANGE_RX);
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

  const lower = openingHours.toLowerCase();
  for (const [name, dayNum] of Object.entries(DAY_NAMES)) {
    if (lower.includes(name)) return new Set([dayNum]);
  }

  return null;
}

/**
 * Determina se um lugar está aberto no instante informado.
 * Retorna true, false ou null (quando não foi possível interpretar o formato).
 *
 * Formatos suportados:
 *   - "Aberto 24 horas"
 *   - "05:00 - 24:00"                          (todos os dias)
 *   - "Ter-Dom 10:00 - 18:00"                  (range de dias + horário)
 *   - "Seg-Sex 12:00 - 18:00 (observações)"
 *   - "Feiras aos domingos 09:00 - 18:00"      (dia individual)
 *   - "Seg-Dom 12:00 - 00:00"                  (fecha à meia-noite)
 *   - "Sex-Sáb 23:00 - 05:00"                  (vira a madrugada: o horário após
 *                                               a meia-noite pertence ao dia anterior)
 *
 * @param {string} openingHours
 * @param {Date} [now] instante de referência (padrão: agora)
 * @returns {boolean|null}
 */
function isOpenNow(openingHours, now = new Date()) {
  if (!openingHours) return null;

  if (/24\s*horas?/i.test(openingHours)) return true;

  const timeMatch = openingHours.match(TIME_RANGE_RX);
  if (!timeMatch) return null;

  const openMin = parseTime(timeMatch[1]);
  let closeMin = parseTime(timeMatch[2]);
  // "00:00" e "24:00" como fechamento significam meia-noite do mesmo dia
  if (closeMin === 0 || closeMin >= MINUTES_PER_DAY) closeMin = MINUTES_PER_DAY;

  const days = parseDays(openingHours);
  const opensOn = (day) => days === null || days.has(day);

  const { day, minutes } = getLocalTime(now);
  const yesterday = (day + 6) % 7;

  if (closeMin > openMin) {
    return opensOn(day) && minutes >= openMin && minutes < closeMin;
  }

  // Atravessa a meia-noite: aberto do horário de abertura até o fim do dia
  // ou, no dia seguinte, da meia-noite até o fechamento.
  return (
    (opensOn(day) && minutes >= openMin) ||
    (opensOn(yesterday) && minutes < closeMin)
  );
}

module.exports = { isOpenNow, TIME_ZONE };
