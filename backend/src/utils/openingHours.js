/**
 * Mapeia abreviações de dias da semana para getDay()
 * 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
 */
const DAY_MAP = {
  Dom: 0,
  Seg: 1,
  Ter: 2,
  Qua: 3,
  Qui: 4,
  Sex: 5,
  "Sáb": 6,
};

function parseTime(str) {
  const [h, m] = str.trim().split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Determina se um lugar está aberto agora com base na string opening_hours.
 * Retorna true, false ou null (quando não foi possível interpretar o formato).
 *
 * Formatos suportados:
 *   - "Aberto 24 horas"
 *   - "05:00 - 24:00"  (todos os dias)
 *   - "Ter-Dom 10:00 - 18:00"  (range de dias + horário)
 *   - "Seg-Sex 12:00 - 18:00 (observações)"
 *   - "Feiras aos domingos 09:00 - 18:00"  (dia individual)
 *
 * @param {string} openingHours
 * @returns {boolean|null}
 */
function isOpenNow(openingHours) {
  if (!openingHours) return null;

  if (/24\s*horas?/i.test(openingHours)) return true;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const timeMatch = openingHours.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!timeMatch) return null;

  const openMin = parseTime(timeMatch[1]);
  const closeRaw = timeMatch[2];
  const closeMin = closeRaw.startsWith("24") ? 24 * 60 : parseTime(closeRaw);
  const inTime = currentMinutes >= openMin && currentMinutes < closeMin;

  // Verifica range de dias: "Seg-Sex", "Ter-Dom", "Qua-Seg"
  const dayKeys = Object.keys(DAY_MAP).join("|");
  const dayRangeRx = new RegExp(`(${dayKeys})\\s*-\\s*(${dayKeys})`);
  const dayMatch = openingHours.match(dayRangeRx);

  if (dayMatch) {
    const startDay = DAY_MAP[dayMatch[1]];
    const endDay = DAY_MAP[dayMatch[2]];

    let inDayRange;
    if (startDay <= endDay) {
      inDayRange = currentDay >= startDay && currentDay <= endDay;
    } else {
      // Atravessa a virada da semana (ex: Sáb=6 a Ter=2)
      inDayRange = currentDay >= startDay || currentDay <= endDay;
    }

    return inDayRange && inTime;
  }

  // Verifica dia individual por extenso (ex: "domingos", "sábados")
  const SINGLE_DAYS = {
    domingo: 0,
    segunda: 1,
    "terça": 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    "sábado": 6,
  };
  const lower = openingHours.toLowerCase();
  for (const [name, dayNum] of Object.entries(SINGLE_DAYS)) {
    if (lower.includes(name)) {
      return currentDay === dayNum && inTime;
    }
  }

  // Sem informação de dia → assume todos os dias
  return inTime;
}

module.exports = { isOpenNow };
