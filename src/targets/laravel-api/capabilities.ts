import { comparePhp, TargetVersion } from "../../targetVersion";

/**
 * Recursos que dependem da versão do Laravel/PHP de destino. É o único lugar que compara números de
 * versão: view models e templates consultam estas flags (`it.capabilities.<flag>`), nunca a versão.
 * Para uma diferença nova entre versões, acrescente uma flag aqui.
 */
export type Capabilities = {
  /** Laravel 11+: casts da model como método `protected function casts(): array`; no 10, a propriedade `$casts`. */
  castsMethod: boolean;
  /** Laravel 11+: `routes/api.php` não vem no esqueleto, é criado e registrado em `bootstrap/app.php` pelo `php artisan install:api`. No 10 ele já existe e o `RouteServiceProvider` o carrega. */
  apiRoutesViaBootstrap: boolean;
  /** Laravel 11+: `->change()` nativo na migration. No 10 exige o pacote `doctrine/dbal`. */
  nativeColumnChange: boolean;
  /** PHP 8.1+: backed enums (e `Rule::enum`). Sempre verdadeiro hoje, já que 8.1 é o mínimo; usado pelo ticket 16. */
  backedEnums: boolean;
  /** PHP 8.2+: classes `readonly` e `true`/`false`/`null` como tipos. Ainda não usada. */
  readonlyClasses: boolean;
  /** PHP 8.3+: constantes de classe tipadas. Ainda não usada. */
  typedClassConstants: boolean;
};

/** Traduz a versão alvo nas flags de recurso. */
export function capabilitiesFor(target: TargetVersion): Capabilities {
  return {
    castsMethod: target.laravel >= 11,
    apiRoutesViaBootstrap: target.laravel >= 11,
    nativeColumnChange: target.laravel >= 11,
    backedEnums: comparePhp(target.php, "8.1") >= 0,
    readonlyClasses: comparePhp(target.php, "8.2") >= 0,
    typedClassConstants: comparePhp(target.php, "8.3") >= 0,
  };
}
