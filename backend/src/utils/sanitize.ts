import sanitizeHtml from "sanitize-html";

const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

export const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return sanitizeHtml(value.trim(), SANITIZE_CONFIG);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
    );
  }

  return value;
};
