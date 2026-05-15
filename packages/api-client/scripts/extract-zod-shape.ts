/**
 * Extracts a structural shape from selected Zod schemas in
 * `packages/api-client/src/schemas/` and writes the result to
 * `packages/api-client/contracts/expected.json`. Consumed by the API
 * contract diff in CI.
 *
 * Output mirrors the backend `mix contracts.dump` snapshot:
 *
 *   { "users":         { "fields": { "id": "string", ... } },
 *     "messages":      { ... },
 *     "conversations": { ... },
 *     ... }
 *
 * The walker only handles the Zod constructs actually used by these
 * schemas: object, optional, nullable, array, primitives, enums, records.
 * Unknown nodes fall back to "any".
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ZodTypeAny } from 'zod';

import {
  UserSchema,
  FriendUserSchema,
  FriendRawSchema,
  NotificationSchema,
} from '../src/schemas/index.js';

interface FieldShape {
  fields: Record<string, string>;
}

interface ContractSnapshot {
  [endpoint: string]: FieldShape;
}

// Mirrors the hard-coded list in `apps/backend/lib/mix/tasks/contracts.dump.ex`.
// Keeps the same endpoint names so the diff lines up.
const ENDPOINTS: Array<{ name: string; schema: ZodTypeAny }> = [
  { name: 'users', schema: UserSchema },
  // The backend `friend_data` shape wraps a user under `user` plus a few
  // friendship fields — closest Zod analog is `FriendRawSchema`.
  { name: 'friends', schema: FriendRawSchema },
  // Notifications: backend renders `notification_data` with a top-level
  // shape that closely mirrors NotificationSchema.
  { name: 'notifications', schema: NotificationSchema },
  // Re-export for cross-checking the inner FriendUser shape.
  { name: 'friend_user', schema: FriendUserSchema },
];

interface ZodDef {
  typeName?: string;
  innerType?: ZodTypeAny;
  type?: ZodTypeAny;
  schema?: ZodTypeAny;
  values?: readonly string[];
}

function isRecord(node: unknown): node is Record<string, unknown> {
  return typeof node === 'object' && node !== null;
}

function isZodType(node: unknown): node is ZodTypeAny {
  return isRecord(node) && '_def' in node && isRecord(node._def);
}

function defOf(schema: ZodTypeAny): ZodDef {
  // ZodTypeAny._def is `unknown` once narrowed through isRecord; copy the
  // fields we care about into a plain object instead of a type assertion.
  const raw: unknown = schema._def;
  if (!isRecord(raw)) {
    return {};
  }
  const out: ZodDef = {};
  if (typeof raw.typeName === 'string') out.typeName = raw.typeName;
  if (isZodType(raw.innerType)) out.innerType = raw.innerType;
  if (isZodType(raw.type)) out.type = raw.type;
  if (isZodType(raw.schema)) out.schema = raw.schema;
  if (Array.isArray(raw.values) && raw.values.every((v) => typeof v === 'string')) {
    out.values = raw.values;
  }
  return out;
}

function unwrap(schema: ZodTypeAny): ZodTypeAny {
  let current: ZodTypeAny = schema;
  while (true) {
    const def = defOf(current);
    const wrapper =
      def.typeName === 'ZodOptional' ||
      def.typeName === 'ZodNullable' ||
      def.typeName === 'ZodDefault' ||
      def.typeName === 'ZodReadonly' ||
      def.typeName === 'ZodBranded';
    if (wrapper && def.innerType && isZodType(def.innerType)) {
      current = def.innerType;
      continue;
    }
    return current;
  }
}

function classify(schema: ZodTypeAny): string {
  const inner = unwrap(schema);
  const def = defOf(inner);
  const tn = def.typeName ?? '';
  switch (tn) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
    case 'ZodBigInt':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodNull':
      return 'null';
    case 'ZodArray':
      return 'array';
    case 'ZodObject':
      return 'object';
    case 'ZodEnum':
    case 'ZodNativeEnum':
      return 'string';
    case 'ZodLiteral':
      return 'any';
    case 'ZodRecord':
    case 'ZodMap':
      return 'object';
    case 'ZodUnion':
    case 'ZodDiscriminatedUnion':
    case 'ZodIntersection':
      return 'any';
    case 'ZodDate':
      return 'string';
    case 'ZodAny':
    case 'ZodUnknown':
      return 'any';
    default:
      return 'any';
  }
}

function extractObjectFields(schema: ZodTypeAny): Record<string, string> {
  const inner = unwrap(schema);
  const def = defOf(inner);
  if (def.typeName !== 'ZodObject') {
    throw new Error(
      `extract-zod-shape: top-level schema must be ZodObject, got ${def.typeName ?? 'unknown'}`
    );
  }
  // ZodObject exposes `.shape` as a getter in 3.25, with `._def.shape()`
  // as a fallback in older versions. Read both via duck typing.
  const shape = readShape(inner);
  if (!shape) {
    throw new Error('extract-zod-shape: could not read .shape from ZodObject');
  }
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(shape)) {
    if (isZodType(value)) {
      fields[key] = classify(value);
    }
  }
  return fields;
}

function readShape(schema: ZodTypeAny): Record<string, unknown> | null {
  if (!isRecord(schema)) return null;
  const direct: unknown = schema.shape;
  if (isRecord(direct)) return direct;
  const def: unknown = schema._def;
  if (isRecord(def) && typeof def.shape === 'function') {
    const result: unknown = def.shape();
    if (isRecord(result)) return result;
  }
  return null;
}

function build(): ContractSnapshot {
  const out: ContractSnapshot = {};
  for (const { name, schema } of ENDPOINTS) {
    out[name] = { fields: extractObjectFields(schema) };
  }
  return out;
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const outputPath = resolve(here, '..', 'contracts', 'expected.json');
  const snapshot = build();
  const json = JSON.stringify(snapshot, null, 2) + '\n';

  if (process.argv.includes('--stdout')) {
    process.stdout.write(json);
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, json, 'utf8');
  console.log(
    `[extract-zod-shape] wrote ${Object.keys(snapshot).length} contract(s) to ${outputPath}`
  );
}

main();
