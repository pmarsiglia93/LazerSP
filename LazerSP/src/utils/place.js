import theme from "../styles/theme";

/**
 * Situação do lugar a partir do `isOpen` da API:
 * true = aberto, false = fechado, null = funciona conforme programação.
 * @returns {"open"|"closed"|"schedule"}
 */
export function getPlaceStatus(place) {
  if (place?.isOpen === true) return "open";
  if (place?.isOpen === false) return "closed";
  return "schedule";
}

const STATUS_STYLE = {
  open: { labelKey: "details.open", color: theme.colors.success, background: "#E6F9F0" },
  closed: { labelKey: "details.closed", color: theme.colors.danger, background: "#FFF0F0" },
  schedule: { labelKey: "details.check_schedule", color: theme.colors.textLight, background: "#F1F3F5" },
};

/** Rótulo (chave i18n) e cores do selo de status. */
export function getStatusStyle(place) {
  return STATUS_STYLE[getPlaceStatus(place)];
}

/** Avaliação curada só é exibida quando existe (0 = ainda sem nota). */
export function hasRating(place) {
  return typeof place?.rating === "number" && place.rating > 0;
}

/** Quebra horários com vários trechos ("Ter-Sex ...; Sáb-Dom ...") em linhas. */
export function formatOpeningHours(openingHours) {
  if (!openingHours) return "";
  return openingHours
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

/** Link do Google Maps para rotas de transporte público, usando nome e endereço. */
export function directionsUrl(place) {
  const destination = encodeURIComponent(`${place.name}, ${place.address}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`;
}
