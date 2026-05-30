const prefixes = {
  user: "USR",
  patient: "PAT",
  record: "REC",
  doctor: "DOC",
  appointment: "APT",
} as const;

type Prefix = keyof typeof prefixes;

type GenerateIdOptions = {
  separator?: string;
};

export function generateId(
  prefixOrOptions?: Prefix | GenerateIdOptions,
  inputOptions: GenerateIdOptions = {},
) {
  // Determine if the first argument is options or prefix
  const isOptions =
    typeof prefixOrOptions === "object" && prefixOrOptions !== null;

  const finalOptions = isOptions ? prefixOrOptions : inputOptions;
  const prefix = isOptions ? undefined : prefixOrOptions;

  const { separator = "_" } = finalOptions;

  const id = crypto.randomUUID();

  if (prefix && prefix in prefixes) {
    return `${prefixes[prefix]}${separator}${id}`;
  }

  return id;
}
