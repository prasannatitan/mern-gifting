export const PRODUCT_META_SEP = "\n\nProduct Meta\n";
export const PRODUCT_CATEGORIES = [
  "FESTIVAL_GIFTS",
  "ANNIVERSARY_GIFTS",
  "PERSONALISED_GIFTS",
  "BIRTHDAY_GIFTS",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  FESTIVAL_GIFTS: "FESTIVAL GIFTS",
  ANNIVERSARY_GIFTS: "ANNIVERSARY GIFTS",
  PERSONALISED_GIFTS: "PERSONALISED GIFTS",
  BIRTHDAY_GIFTS: "BIRTHDAY GIFTS",
};

export type ProductFormFields = {
  name: string;
  sku: string;
  category: ProductCategory;
  brand: string;
  material: string;
  minOrderQty: string;
  maxOrderQty: string;
  stockQuantity: string;
  basePrice: string;
  discountPrice: string;
  currency: string;
  description: string;
  tags: string;
};

export function buildProductDescription(form: ProductFormFields): string {
  const lines: string[] = [];
  if (form.category) lines.push(`Category: ${form.category}`);
  if (form.brand) lines.push(`Brand: ${form.brand}`);
  if (form.material) lines.push(`Material: ${form.material}`);
  if (form.minOrderQty) lines.push(`Min Order Qty: ${form.minOrderQty}`);
  if (form.maxOrderQty) lines.push(`Max Order Qty: ${form.maxOrderQty}`);
  if (form.stockQuantity) lines.push(`Stock Quantity: ${form.stockQuantity}`);
  if (form.tags) lines.push(`Tags: ${form.tags}`);

  const metaBlock = lines.length > 0 ? `${PRODUCT_META_SEP}${lines.join("\n")}` : "";
  return `${form.description || ""}${metaBlock}`.trim();
}

export function parseProductDescription(full: string | null): { description: string; form: Partial<ProductFormFields> } {
  if (!full) return { description: "", form: {} };
  const idx = full.indexOf(PRODUCT_META_SEP);
  if (idx === -1) return { description: full, form: {} };
  const description = full.slice(0, idx).trim();
  const metaBlock = full.slice(idx + PRODUCT_META_SEP.length);
  const form: Partial<ProductFormFields> = {};
  for (const line of metaBlock.split("\n")) {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim();
    if (key === "Category" && PRODUCT_CATEGORIES.includes(val as ProductCategory)) form.category = val as ProductCategory;
    else if (key === "Brand") form.brand = val;
    else if (key === "Material") form.material = val;
    else if (key === "Min Order Qty") form.minOrderQty = val;
    else if (key === "Max Order Qty") form.maxOrderQty = val;
    else if (key === "Stock Quantity") form.stockQuantity = val;
    else if (key === "Tags") form.tags = val;
  }
  return { description, form };
}

export function emptyProductForm(): ProductFormFields {
  return {
    name: "",
    sku: "",
    category: "FESTIVAL_GIFTS",
    brand: "",
    material: "",
    minOrderQty: "1",
    maxOrderQty: "",
    stockQuantity: "0",
    basePrice: "",
    discountPrice: "",
    currency: "INR",
    description: "",
    tags: "",
  };
}
