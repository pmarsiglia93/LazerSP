const { z } = require("zod");

const LABELS = {
  name: "Nome",
  category: "Categoria",
  address: "Endereço",
  description: "Descrição",
  imageUrl: "URL da imagem",
  rating: "Avaliação",
  openingHours: "Horário de funcionamento",
  priceLevel: "Preço",
  highlight: "Destaque",
  isOpen: "Status",
  latitude: "Latitude",
  longitude: "Longitude",
  instagram: "Instagram",
  tags: "Tags",
};

const optionalText = (max) => z.string().trim().max(max).optional().default("");

const placeSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(60),
    address: z.string().trim().min(1).max(200),
    description: optionalText(2000),
    imageUrl: z
      .union([z.literal(""), z.url({ protocol: /^https?$/ })])
      .optional()
      .default(""),
    rating: z.coerce.number().min(0).max(5).optional().default(0),
    openingHours: optionalText(120),
    priceLevel: z.string().trim().max(40).optional().default("Gratuito"),
    highlight: optionalText(300),
    isOpen: z.boolean().optional().default(true),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    instagram: z
      .string()
      .trim()
      .regex(/^@?[A-Za-z0-9._]{0,30}$/, { error: "deve conter apenas o nome de usuário" })
      .transform((v) => v.replace(/^@/, "") || null)
      .nullable()
      .optional()
      .default(null),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  })
  .refine((p) => !(p.latitude === 0 && p.longitude === 0), {
    path: ["latitude"],
    error: "Informe a localização (latitude e longitude)",
  });

/** Converte um problema do zod em mensagem em português. */
function describeIssue(issue) {
  const field = issue.path[0];
  const label = LABELS[field] || String(field ?? "Campo");
  const isText = issue.origin === "string";

  switch (issue.code) {
    case "too_small":
      if (isText && Number(issue.minimum) === 1) return `${label} é obrigatório`;
      if (issue.origin === "array") return `${label} deve ter ao menos ${issue.minimum} item(ns)`;
      return `${label} deve ser no mínimo ${issue.minimum}`;
    case "too_big":
      if (isText) return `${label} deve ter no máximo ${issue.maximum} caracteres`;
      if (issue.origin === "array") return `${label}: no máximo ${issue.maximum} itens`;
      return `${label} deve ser no máximo ${issue.maximum}`;
    case "invalid_type":
      return /received undefined/.test(issue.message) ? `${label} é obrigatório` : `${label} é inválido`;
    case "invalid_union":
    case "invalid_format":
      return field === "imageUrl" ? `${label} deve ser um endereço http(s) válido` : `${label} é inválido`;
    case "custom":
      return issue.path.length > 0 && !issue.message.startsWith("Informe")
        ? `${label} ${issue.message}`
        : issue.message;
    default:
      return issue.message.startsWith(label) ? issue.message : `${label} ${issue.message}`;
  }
}

/**
 * Valida o corpo de criação/edição de lugar.
 * @returns {{ ok: true, data: object } | { ok: false, errors: string[] }}
 */
function parsePlace(body) {
  const result = placeSchema.safeParse(body ?? {});
  if (result.success) return { ok: true, data: result.data };
  const errors = [...new Set(result.error.issues.map(describeIssue))];
  return { ok: false, errors };
}

module.exports = { parsePlace };
