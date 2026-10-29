import fs from "fs";
import os from "os";
import path from "path";
import { CommandRunner } from "./commandRunner";
import { UserError } from "./readManifest";
import { LaravelMajor, PhpVersion } from "./targetVersion";

/** Bancos que o `sail:install` sabe configurar. */
export const SAIL_DATABASES = ["mysql", "pgsql", "mariadb", "sqlite"] as const;
export type SailDatabase = (typeof SAIL_DATABASES)[number];

/** Banco padrão do scaffold (o mesmo que o `sail:install` oferece como primeira opção). */
export const DEFAULT_DATABASE: SailDatabase = "mysql";

/**
 * Versões de PHP para as quais existe a imagem `laravelsail/phpXX-composer` (conferido no Docker Hub:
 * php81, php82, php83 e php84; não há php85-composer). O PHP alvo do manifest pode ser maior (o crudmaker aceita 8.1+),
 * mas o scaffold só consegue criar o projeto com estas.
 */
export const SAIL_COMPOSER_PHP: PhpVersion[] = ["8.1", "8.2", "8.3", "8.4"];

/** Pasta do projeto dentro do container. */
export const CONTAINER_PROJECT_DIR = "/var/www/html";
/** Pasta do COMPOSER_HOME (cache e config do composer) dentro do container. */
export const CONTAINER_COMPOSER_HOME = "/composer";

/** Imagem PHP + composer usada nos passos (`8.3` → `laravelsail/php83-composer:latest`). */
export function composerImage(php: PhpVersion): string {
  if (!SAIL_COMPOSER_PHP.includes(php)) {
    throw new UserError(
      `Não existe a imagem laravelsail/php${php.replace(".", "")}-composer para o PHP ${php}. ` +
        `O scaffold funciona com o PHP ${SAIL_COMPOSER_PHP.join(", ")}; use --php (ou pkg.target.php no manifest) com um desses.`,
    );
  }
  return `laravelsail/php${php.replace(".", "")}-composer:latest`;
}

/** Pasta de cache do composer no host, compartilhada entre projetos (respeita `XDG_CACHE_HOME`). */
export function defaultComposerHome(): string {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
  return path.join(base, "crudmaker", "composer");
}

export type ScaffoldOptions = {
  /** Diretório do projeto (absoluto), já vazio ou inexistente. */
  dir: string;
  laravel: LaravelMajor;
  php: PhpVersion;
  database: SailDatabase;
  /** Instala e configura o Sail. */
  sail: boolean;
  /** Pasta do host usada como COMPOSER_HOME. */
  composerHome: string;
  /** UID/GID do usuário do host (os arquivos criados no volume pertencem a ele). */
  user?: { uid: number; gid: number };
};

/** Um passo do scaffold: um comando (composer ou php) rodado dentro de um container. */
export type ScaffoldStep = {
  /** Nome mostrado ao usuário (no progresso e na mensagem de erro). */
  name: string;
  /** Programa e argumentos rodados dentro do container. */
  command: string[];
};

/** Os passos do scaffold, na ordem, para a versão pedida. */
export function scaffoldSteps(options: ScaffoldOptions): ScaffoldStep[] {
  const steps: ScaffoldStep[] = [
    {
      name: `composer create-project laravel/laravel:^${options.laravel}.0`,
      // "." porque o diretório já é o do projeto (montado vazio); o composer aceita um diretório vazio.
      command: ["composer", "create-project", `laravel/laravel:^${options.laravel}.0`, ".", "--no-interaction", "--prefer-dist"],
    },
  ];

  // Laravel 11+: o esqueleto não traz routes/api.php; o install:api cria o arquivo, registra no bootstrap/app.php
  // e instala o Sanctum. --without-migration-prompt evita a pergunta "rodar as migrations?" (e rodá-las aqui).
  // No Laravel 10 o routes/api.php já vem no esqueleto.
  if (options.laravel >= 11) {
    steps.push({ name: "php artisan install:api", command: ["php", "artisan", "install:api", "--no-interaction", "--without-migration-prompt"] });
  }

  // Pest, para os testes gerados (ticket 19). O --with-all-dependencies deixa o composer atualizar o phpunit do
  // esqueleto para a versão que o Pest pede. O `pest --init` cria tests/Pest.php e tests/TestCase.php (o plugin do Laravel não tem comando artisan pest:install).
  steps.push(
    {
      name: "composer require --dev pestphp/pest pestphp/pest-plugin-laravel",
      command: ["composer", "require", "--dev", "pestphp/pest", "pestphp/pest-plugin-laravel", "--with-all-dependencies", "--no-interaction"],
    },
    { name: "pest --init", command: ["php", "vendor/bin/pest", "--init", "--no-interaction"] },
  );

  if (options.sail) {
    // sqlite não é serviço do Sail: "none" instala o Sail só com o container da aplicação.
    const services = options.database === "sqlite" ? "none" : options.database;
    steps.push({
      name: `php artisan sail:install --with=${services}`,
      command: ["php", "artisan", "sail:install", `--with=${services}`, `--php=${options.php}`, "--no-interaction"],
    });
  }

  return steps;
}

/** Argumentos do `docker run` de um passo (sem o `docker` inicial). */
export function dockerRunArgs(options: ScaffoldOptions, step: ScaffoldStep): string[] {
  const args = ["run", "--rm"];
  // Mesmo UID/GID do host: nada fica com o root como dono e o container não roda como root.
  if (options.user) args.push("--user", `${options.user.uid}:${options.user.gid}`);
  args.push(
    "-v", `${options.dir}:${CONTAINER_PROJECT_DIR}`,
    "-w", CONTAINER_PROJECT_DIR,
    // Sem HOME gravável o composer reclama; o COMPOSER_HOME montado do host também guarda o cache entre execuções.
    "-v", `${options.composerHome}:${CONTAINER_COMPOSER_HOME}`,
    "-e", `COMPOSER_HOME=${CONTAINER_COMPOSER_HOME}`,
    composerImage(options.php),
    ...step.command,
  );
  return args;
}

/** Erro claro se o Docker não está instalado ou o daemon não responde. */
export function assertDockerAvailable(runner: CommandRunner): void {
  const result = runner.run("docker", ["info"], { stdio: "pipe" });
  if (result.error?.code === "ENOENT") {
    throw new UserError("Docker não encontrado. O crudmaker new roda o composer e o artisan em containers; instale o Docker (https://docs.docker.com/get-docker/) e tente de novo.");
  }
  if (result.error || result.status !== 0) {
    const detail = (result.stderr || result.error?.message || "").trim().split("\n")[0];
    throw new UserError(
      `O Docker está instalado, mas o daemon não respondeu (docker info falhou${detail ? `: ${detail}` : ""}). ` +
        "Inicie o Docker (ex.: sudo systemctl start docker) e confira se o seu usuário tem permissão (grupo docker).",
    );
  }
}

/** Um diretório "vazio" para o scaffold: não existe, ou existe e não tem nenhum item (nem oculto). */
export function assertEmptyTarget(dir: string): void {
  if (!fs.existsSync(dir)) return;
  if (!fs.statSync(dir).isDirectory()) throw new UserError(`${dir} existe e não é um diretório.`);
  if (fs.readdirSync(dir).length > 0) {
    throw new UserError(
      `${dir} já existe e não está vazio; não vou tocar nele. Escolha outro diretório, ou, para gerar num projeto que já existe, use: crudmaker generate <manifest> --out ${dir}`,
    );
  }
}

/**
 * Roda os passos do scaffold, um container por passo. Em falha, para e lança um erro que diz qual passo falhou.
 * Não apaga nada do que já foi criado: o diretório parcial pode ter dado útil (e o composer já baixou o que baixou).
 */
export function runScaffold(options: ScaffoldOptions, runner: CommandRunner, log: (text: string) => void): void {
  fs.mkdirSync(options.dir, { recursive: true });
  fs.mkdirSync(options.composerHome, { recursive: true });

  const steps = scaffoldSteps(options);
  steps.forEach((step, index) => {
    log(`\n[${index + 1}/${steps.length}] ${step.name}\n`);
    const args = dockerRunArgs(options, step);
    const result = runner.run("docker", args, { stdio: "inherit" });

    if (result.error || result.status !== 0) {
      const why = result.error ? result.error.message : `código de saída ${result.status}`;
      throw new UserError(
        `O passo ${index + 1}/${steps.length} falhou (${step.name}): ${why}.\n` +
          `O diretório ${options.dir} foi mantido com o que já foi criado. Veja a saída acima. Para tentar de novo, apague o diretório e rode o crudmaker new outra vez; ` +
          `ou continue à mão a partir deste passo com:\n  docker ${args.map(shellQuote).join(" ")}`,
      );
    }
  });
}

function shellQuote(arg: string): string {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, "'\\''")}'`;
}
