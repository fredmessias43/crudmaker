import { Entity } from "../../../models/Entity";

/**
 * Colunas que o esqueleto oficial do Laravel (10, 11 e 12) cria para cada tabela que o crudmaker reconhece.
 * Hoje só `users`: `id` (bigint auto-incremento), `name`, `email` (único), `email_verified_at`, `password`,
 * `remember_token` e os timestamps. Para as demais tabelas que já existem e não são do crudmaker as colunas
 * são desconhecidas (veja `docs/manifest.md`).
 */
export const SKELETON_COLUMNS: { [table: string]: string[] } = {
  users: ["id", "name", "email", "email_verified_at", "password", "remember_token", "created_at", "updated_at"],
};

/** Tabela da entidade `user`, a única com model especial (Authenticatable). */
export const USERS_TABLE = "users";

/** A entidade `user` (tabela `users`), pelo nome já normalizado. */
export function isUserEntity(entity: Entity): boolean {
  return entity.getTableName() === USERS_TABLE;
}

/**
 * Nome da migration de criação da tabela entre as listadas (sufixo `_create_<tabela>_table.php`).
 * Serve tanto para as migrations do crudmaker quanto para as de fora (esqueleto, escritas à mão).
 */
export function createMigrationOf(table: string, files: string[]): string | undefined {
  return files.find((file) => file.endsWith(`_create_${table}_table.php`));
}
