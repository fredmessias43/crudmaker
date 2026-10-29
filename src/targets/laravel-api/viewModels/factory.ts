import { pascalCase } from "change-case";
import { Entity } from "../../../models/Entity";
import { Field } from "../../../types";
import { EntityFileType } from "../fileType";
import { BASE_NAMESPACE, entityNames, generatedNamespace } from "../names";
import { classHeader, ClassPair, ClassRef } from "./classHeader";
import { enumClass } from "./enum";
import { foreignKeyTable, phpLiteral } from "./migration";
import { isUserEntity } from "./skeleton";

/** Namespace da factory final: o do Laravel (`database/factories`), onde o `HasFactory` a procura pelo nome da model. */
const FINAL_NAMESPACE = "Database\\Factories";
const FINAL_FOLDER = "database/factories";
/** A base mora na camada gerada, como as demais bases (`app/Generated/Factories`), e não em `database/`. */
const baseNamespace = generatedNamespace(`${BASE_NAMESPACE}\\Factories`);

const modelNamespace = `${BASE_NAMESPACE}\\Models`;

/** Par base × final da factory da entidade: `Database\Factories\ClientFactory` e `App\Generated\Factories\BaseClientFactory`. */
export function factoryPair(entity: Entity): ClassPair {
  const pascal = entityNames(entity).pascal;
  const ref = (namespace: string, className: string, folder: string): ClassRef => ({
    namespace,
    className,
    fqcn: `${namespace}\\${className}`,
    path: `${folder}/${className}.php`,
  });

  return {
    final: ref(FINAL_NAMESPACE, `${pascal}Factory`, FINAL_FOLDER),
    base: ref(baseNamespace, `Base${pascal}Factory`, "app/Generated/Factories"),
  };
}

/** Expressão da senha (cifrada uma vez por processo, como a factory do esqueleto do Laravel). */
const PASSWORD = "static::$password ??= Hash::make('password')";

/**
 * Heurísticas por nome, só para campos `string`: nome exato do campo → método do Faker.
 * É a tabela documentada em docs/como-usar.md; para mudar um valor, sobrescreva-o na factory final.
 */
const stringByName: { [name: string]: string } = {
  email: "safeEmail()",
  name: "name()",
  full_name: "name()",
  first_name: "firstName()",
  last_name: "lastName()",
  username: "userName()",
  phone: "phoneNumber()",
  telephone: "phoneNumber()",
  mobile: "phoneNumber()",
  cellphone: "phoneNumber()",
  url: "url()",
  website: "url()",
  city: "city()",
  state: "state()",
  country: "country()",
  zip: "postcode()",
  zip_code: "postcode()",
  postal_code: "postcode()",
  address: "streetAddress()",
  street: "streetAddress()",
  slug: "slug()",
  color: "hexColor()",
  company: "company()",
  currency: "currencyCode()",
  title: "sentence(3)",
  description: "sentence()",
};

/** Heurística para sufixos (`contact_email`, `billing_phone`, `avatar_url`): só e-mail, telefone e URL. */
const stringBySuffix: { [suffix: string]: string } = { email: "safeEmail()", phone: "phoneNumber()", url: "url()" };

/** Método do Faker de um campo `string`: pelo nome, senão três palavras. */
function stringFaker(name: string): string {
  const lower = name.toLowerCase();
  if (stringByName[lower] !== undefined) return stringByName[lower];

  const suffix = lower.slice(lower.lastIndexOf("_") + 1);
  return lower.includes("_") && stringBySuffix[suffix] !== undefined ? stringBySuffix[suffix] : "words(3, true)";
}

/** Método do Faker por tipo (os tipos com heurística de nome, `string`, e os especiais, `enum` e `json`, ficam em `fakeExpression`). */
const fakerByType: { [type: string]: string } = {
  uuid: "uuid()",
  text: "paragraph()",
  integer: "numberBetween(1, 1000)",
  double: "randomFloat(2, 0, 1000)",
  boolean: "boolean()",
  date: "date()",
  datetime: "dateTime()",
};

/** Tipos em que `unique: true` usa `fake()->unique()` (nos demais, o conjunto de valores é pequeno demais para valer a pena). */
const uniqueTypes = new Set(["uuid", "string", "text", "integer", "double", "date", "datetime"]);

/**
 * Expressão PHP do valor de um campo na `definition()`. `default` declarado vale para qualquer tipo
 * (enum incluso); sem ele, o valor sai do Faker por tipo (e por nome, em `string`).
 */
export function fakeExpression(entity: Entity, field: Field): { expression: string; imports: string[] } {
  if (field.default !== undefined) return { expression: phpLiteral(field.default), imports: [] };

  if (field.type === "enum") {
    const ref = enumClass(entity, field);
    return { expression: `fake()->randomElement(${ref.className}::cases())`, imports: [ref.fqcn] };
  }
  if (field.type === "json") return { expression: "[]", imports: [] };
  if (field.type === "string" && field.name.toLowerCase() === "password") return { expression: PASSWORD, imports: ["Illuminate\\Support\\Facades\\Hash"] };

  const method = field.type === "string" ? stringFaker(field.name) : fakerByType[field.type];
  return { expression: `fake()->${field.unique && uniqueTypes.has(field.type) ? "unique()->" : ""}${method}`, imports: [] };
}

type FactoryAttribute = { name: string; expression: string };

/**
 * Atributos da `definition()`: um por campo, menos o `id` (o `HasUuids` gera o uuid; no `users` do esqueleto, é do banco).
 * FK de `belongsTo` → `<Pai>::factory()`, que cria o pai junto. Auto-referência (`parent_id` na própria tabela) → `null`,
 * senão a factory se chamaria para sempre.
 */
function attributesOf(entity: Entity, authenticatable: boolean): { attributes: FactoryAttribute[]; imports: string[] } {
  const imports: string[] = [];
  const belongsTo = entity.relationships?.belongsTo ?? [];
  const attributes: FactoryAttribute[] = [];

  for (const field of Object.values(entity.fields)) {
    if (field.name === "id") continue;

    const parent = belongsTo.find((relationship) => relationship.field === field.name);
    if (parent !== undefined) {
      if (foreignKeyTable(parent) === entity.getTableName()) {
        attributes.push({ name: field.name, expression: "null" });
      } else {
        imports.push(`${modelNamespace}\\${pascalCase(parent.entity)}`);
        attributes.push({ name: field.name, expression: `${pascalCase(parent.entity)}::factory()` });
      }
      continue;
    }

    // Colunas de autenticação do esqueleto, mesmo declaradas no manifest, com o valor da UserFactory do Laravel.
    if (authenticatable && (field.name === "email_verified_at" || field.name === "remember_token")) {
      if (field.name === "remember_token") imports.push("Illuminate\\Support\\Str");
      attributes.push({ name: field.name, expression: field.name === "remember_token" ? "Str::random(10)" : "now()" });
      continue;
    }

    const fake = fakeExpression(entity, field);
    imports.push(...fake.imports);
    attributes.push({ name: field.name, expression: fake.expression });
  }

  // Colunas do esqueleto que o manifest pode não declarar: o que a UserFactory do Laravel preenche.
  if (authenticatable) {
    const has = (name: string) => attributes.some((attribute) => attribute.name === name);
    // `name` e `email` são NOT NULL na migration do esqueleto: sem eles no manifest a factory não conseguiria criar o usuário.
    if (!has("email")) attributes.unshift({ name: "email", expression: "fake()->unique()->safeEmail()" });
    if (!has("name")) attributes.unshift({ name: "name", expression: "fake()->name()" });
    if (!has("email_verified_at")) attributes.push({ name: "email_verified_at", expression: "now()" });
    if (!has("password")) {
      attributes.push({ name: "password", expression: PASSWORD });
      imports.push("Illuminate\\Support\\Facades\\Hash");
    }
    if (!has("remember_token")) {
      attributes.push({ name: "remember_token", expression: "Str::random(10)" });
      imports.push("Illuminate\\Support\\Str");
    }
  }

  return { attributes, imports };
}

/**
 * Base da factory: `definition()` gerado do manifest. O `$model` aponta para a model *final*; o Laravel encontra a
 * factory pelo nome da model (`App\Models\Client` → `Database\Factories\ClientFactory`, a final, que estende esta).
 */
export const factoryBaseFile: EntityFileType = {
  template: "factory.base",
  layer: "generated",
  build(entity, { skeletonUsers }) {
    const names = entityNames(entity);
    const pair = factoryPair(entity);
    const { attributes, imports } = attributesOf(entity, skeletonUsers && isUserEntity(entity));

    return {
      path: pair.base.path,
      view: {
        ...classHeader(entity, pair, {
          imports: ["Illuminate\\Database\\Eloquent\\Factories\\Factory", `${modelNamespace}\\${names.pascal}`, ...imports],
          extends: "Factory",
          layer: "base",
        }),
        model: names.pascal,
        attributes,
        usesPassword: attributes.some((attribute) => attribute.expression === PASSWORD),
      },
    };
  },
};

/** Final da factory: nasce vazia (com exemplos de estados em comentário), `create-once`. */
export const factoryFinalFile: EntityFileType = {
  template: "factory.final",
  layer: "custom",
  build(entity) {
    const pair = factoryPair(entity);

    return {
      path: pair.final.path,
      view: classHeader(entity, pair, { imports: [pair.base.fqcn], extends: pair.base.className, layer: "final" }),
      generatedBase: { fqcn: pair.base.fqcn, path: pair.base.path },
    };
  },
};
