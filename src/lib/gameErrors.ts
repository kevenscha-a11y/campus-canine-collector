export function translateGameError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid_qr")) return "QR Code inválido ou inativo.";
  if (m.includes("not_authenticated")) return "Faça login para escanear.";
  if (m.includes("no_normal_biscuits")) return "Sem biscoitos normais! Volte amanhã.";
  if (m.includes("no_premium_biscuits")) return "Sem biscoitos premium!";
  if (m.includes("forbidden")) return "Sem permissão para esta ação.";
  if (m.includes("invalid_biscuit")) return "Tipo de biscoito inválido.";
  return message;
}
