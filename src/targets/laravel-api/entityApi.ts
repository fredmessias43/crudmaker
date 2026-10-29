import { pascalCase } from "change-case";
import { Entity } from "../../models/Entity";
import { relationName } from "../../relationNames";
import { ApiAction, Field, RelationshipValue } from "../../types";
import { BASE_NAMESPACE } from "./names";

/** Ordem das actions na rota (`->only([...])`) e no controller base. */
export const ACTION_ORDER: ApiAction[] = ["index", "store", "show", "update", "destroy"];

/** Itens por página quando o manifest não diz nada (valor de sempre). */
export const DEFAULT_PER_PAGE = 15;

/** Literal de string do PHP entre aspas simples (escapa `\` e `'`). */
export function phpString(value: string): string {
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

export type WithRelation = {
  /** Nome do método da model, também a chave no JSON da resource. */
  name: string;
  /** `hasMany` vira coleção na resource; `belongsTo` e `hasOne`, um item. */
  many: boolean;
  /** Resource final da entidade relacionada (`App\Http\Resources\AlertResource`). */
  resourceFqcn: string;
  resourceClass: string;
};

/** Opções do bloco `api` da entidade com os padrões do gerador aplicados (todas as actions, 15 por página...). */
export type EntityApi = {
  /** Actions mantidas, na ordem de `ACTION_ORDER`. */
  actions: ApiAction[];
  /** `true` quando mantém todas (a rota fica sem `->only`). */
  allActions: boolean;
  middleware: string[];
  perPage: number;
  filters: { column: string; field: Field | undefined }[];
  search: string[];
  sort: string[];
  /** Coluna e sentido; `undefined` sem `defaultSort`. */
  defaultSort?: { column: string; direction: "asc" | "desc" };
  with: WithRelation[];
  /** Rotas aninhadas dos hasMany/hasOne: `true` (todos), `false` (nenhum) ou os nomes de método dos relacionamentos que geram rota. */
  nested: boolean | string[];
  /** Gera os testes Pest da entidade (padrão: sim). */
  tests: boolean;
};

/** Resolve o `entity.api` (já mesclado com `pkg.defaults.api` e validado) nas opções que os view models usam. */
export function entityApi(entity: Entity): EntityApi {
  const api = entity.api ?? {};
  const actions = ACTION_ORDER.filter((action) => (api.actions ?? ACTION_ORDER).includes(action));
  const fieldByColumn = (column: string) => Object.values(entity.fields).find((field) => field.name === column);

  const relations = new Map<string, RelationshipValue>();
  for (const relationship of Object.values(entity.relationships).flat()) {
    relations.set(relationName(relationship), relationship);
  }

  let defaultSort: EntityApi["defaultSort"];
  if (api.defaultSort !== undefined) {
    const descending = api.defaultSort.startsWith("-");
    defaultSort = { column: descending ? api.defaultSort.slice(1) : api.defaultSort, direction: descending ? "desc" : "asc" };
  }

  return {
    actions,
    allActions: actions.length === ACTION_ORDER.length,
    middleware: api.middleware ?? [],
    perPage: api.perPage ?? DEFAULT_PER_PAGE,
    filters: (api.filters ?? []).map((column) => ({ column, field: fieldByColumn(column) })),
    search: api.search ?? [],
    sort: api.sort ?? [],
    defaultSort,
    nested: api.nested ?? true,
    tests: api.tests ?? true,
    // Um nome sem relacionamento só aparece num lock antigo ou editado à mão (o manifest é validado): ignora.
    with: (api.with ?? []).flatMap((name) => {
      const relationship = relations.get(name);
      if (relationship === undefined) return [];

      const pascal = pascalCase(relationship.entity);
      return [{
        name,
        many: relationship.relationship === "hasMany",
        resourceFqcn: `${BASE_NAMESPACE}\\Http\\Resources\\${pascal}Resource`,
        resourceClass: `${pascal}Resource`,
      }];
    }),
  };
}
