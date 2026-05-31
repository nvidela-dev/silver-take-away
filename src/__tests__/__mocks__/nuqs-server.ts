interface Parser<T> {
  parse: (value: string) => T;
  parseServerSide: (value: string | undefined) => T | null;
  serialize: (value: T) => string;
}

interface IntegerParser extends Parser<number> {
  withDefault: (defaultValue: number) => IntegerParser & { defaultValue: number };
  defaultValue?: number;
}

export const parseAsString: Parser<string> = {
  parse: (value) => value,
  parseServerSide: (value) => (value === undefined ? null : value),
  serialize: (value) => value,
};

export const parseAsFloat: Parser<number> = {
  parse: (value) => Number(value),
  parseServerSide: (value) => (value === undefined ? null : Number(value)),
  serialize: (value) => String(value),
};

export const parseAsInteger: IntegerParser = {
  parse: (value) => Number.parseInt(value, 10),
  parseServerSide: (value) => (value === undefined ? null : Number.parseInt(value, 10)),
  serialize: (value) => String(value),
  withDefault(defaultValue) {
    return {
      ...this,
      defaultValue,
      parseServerSide: (value) => (value === undefined ? defaultValue : Number.parseInt(value, 10)),
    };
  },
};

export function parseAsArrayOf<T>(item: Parser<T>): Parser<T[]> {
  return {
    parse: (value) => value.split(',').map((part) => item.parse(part)),
    parseServerSide: (value) => (
      value === undefined ? null : value.split(',').map((part) => item.parse(part))
    ),
    serialize: (value) => value.map((part) => item.serialize(part)).join(','),
  };
}
