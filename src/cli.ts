import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import { generate } from "./generate";
import { publishStubs, readStubs } from "./stubFiles";
import { stubsFolder, stubsLockPath } from "./targets/laravel-api/stubs";
import { detectTarget } from "./detectTarget";
import { capabilitiesFor, Capabilities } from "./targets/laravel-api/capabilities";
import { describeTarget, resolveTarget, ResolvedTarget } from "./targetVersion";
import { exampleManifestText } from "./initTemplate";
import { acceptedExtensionsText, manifestFormat, readManifest, UserError } from "./readManifest";
import { CommandRunner, spawnRunner } from "./commandRunner";
import { assertDockerAvailable, composerImage, assertEmptyTarget, DEFAULT_DATABASE, defaultComposerHome, runScaffold, SAIL_DATABASES, SailDatabase } from "./scaffold";
import { GENERATED_MARKER } from "./targets/types";
import { applyPlan, applyRemovals, legacyFinalWarnings, planRemovals, planWrites, PlannedRemoval, PlannedWrite, WriteAction } from "./writeFiles";

export type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Diretório atual (padrão de `--out` e de `init`). */
  cwd: string;
  /** Data usada no nome das migrations novas. */
  now: () => Date;
  /** Executor de comandos externos (Docker) do `new`. Padrão: o real; os testes injetam um falso. */
  runner?: CommandRunner;
  /** Pasta do host usada como COMPOSER_HOME nos containers do `new` (padrão: ~/.cache/crudmaker/composer). */
  composerHome?: string;
  /** UID/GID passados ao `docker run --user` (padrão: os do processo; sem eles, o container roda com o usuário da imagem). */
  user?: { uid: number; gid: number };
};

const defaultIo: CliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  cwd: process.cwd(),
  now: () => new Date(),
};

const mainHelp = `crudmaker: gera uma API Laravel a partir de um manifest.

Uso:
  crudmaker <comando> [opções]

Comandos:
  generate <manifest>   gera os arquivos da API a partir do manifest
  new <dir> <manifest>  cria um projeto Laravel do zero (via Docker) já com a API gerada
  init [arquivo]        cria um manifest de exemplo (--ai: também o guia para IA)
  stubs:publish [tipo...]  copia os templates embutidos para a pasta de stubs do projeto

Opções:
  -h, --help            mostra esta ajuda (também funciona por comando)
  -v, --version         mostra a versão
`;

const generateHelp = `Uso: crudmaker generate <manifest> [--out <dir>] [--dry-run] [--seeders] [--normalize-names | --no-normalize-names]
                                  [--laravel <10|11|12>] [--php <x.y>]

Gera Model, Factory, Migration, Controller, Request, Resource, Collection e o teste Pest de cada entidade
(mais os PHP enums dos campos enum e os controllers aninhados de hasMany/hasOne), e o arquivo de rotas
(routes/crudmaker.php), incluído uma única vez no routes/api.php.

Opções:
  -o, --out <dir>   raiz do projeto Laravel de destino (padrão: diretório atual)
  -n, --dry-run     não escreve nada; lista o que seria criado, sobrescrito, preservado ou removido
  --seeders         gera também os seeders: database/seeders/<Entidade>Seeder.php (criado uma vez) e o CrudmakerSeeder
                    (regravado), que chama todos na ordem das chaves estrangeiras. Sem a flag, nenhum seeder é gerado.
  --normalize-names     liga a normalização de nomes (entidade singular camelCase, campo snake_case)
  --no-normalize-names  desliga a normalização: os nomes passam como estão (só avisa o que está fora da convenção)
                        As duas flags têm prioridade sobre pkg.normalizeNames do manifest (padrão: ligada).
  --laravel <n>     major do Laravel de destino: 10, 11 ou 12
  --php <x.y>       versão do PHP de destino: 8.1 ou superior (mínimo do Laravel 10: 8.1; do 11 e do 12: 8.2)
                    A versão de cada parte vem, nesta ordem, de: flag, pkg.target do manifest, composer.lock/composer.json
                    do destino (--out), padrão (Laravel 12, PHP 8.2). O resumo mostra a versão usada e a origem.
  -h, --help        mostra esta ajuda

Stubs: se existir stubs/crudmaker/laravel-api/ no projeto de destino, cada arquivo dela substitui o template
embutido de mesmo nome (veja stubs:publish --help).

Cada classe tem duas camadas: a base, em app/Generated/ (sempre sobrescrita; não edite), e a classe final
no namespace normal (criada uma única vez e nunca sobrescrita; é onde vai o código seu, com os hooks).
Entidade que sai do manifest tem a base apagada; a final e a migration ficam e são listadas como órfãs.

Atenção: os demais arquivos existentes (a camada gerada, as migrations, as rotas) são sobrescritos,
inclusive edições feitas à mão. Use --dry-run primeiro e mantenha o projeto de destino sob controle de versão.
`;

const newHelp = `Uso: crudmaker new <dir> <manifest> [--laravel <10|11|12>] [--php <x.y>] [--db <banco>] [--no-sail] [--skip-generate] [--seeders]

Cria um projeto Laravel em <dir> e gera nele a API do manifest. Só precisa do Docker: o composer e o
artisan rodam em containers efêmeros (imagem laravelsail/phpXX-composer, com o seu UID/GID).

Passos: composer create-project laravel/laravel → artisan install:api (Laravel 11+) →
composer require --dev pestphp/pest pestphp/pest-plugin-laravel → pest --init →
artisan sail:install → generate.

Opções:
  --laravel <n>      major do Laravel: 10, 11 ou 12
  --php <x.y>        PHP da imagem: 8.1, 8.2, 8.3 ou 8.4 (mínimo do Laravel 10: 8.1; do 11 e do 12: 8.2)
                     A versão de cada parte vem, nesta ordem, de: flag, pkg.target do manifest, padrão (Laravel 12, PHP 8.2).
  --db <banco>       banco configurado no Sail: mysql (padrão), pgsql, mariadb ou sqlite
  --no-sail          não instala o Sail (não combina com --db)
  --seeders          gera também os seeders (veja crudmaker generate --help)
  --skip-generate    cria só o projeto, sem gerar a API (depois: crudmaker generate <manifest> --out <dir>)
  -h, --help         mostra esta ajuda

<dir> não pode existir com conteúdo: nesse caso nada é tocado. O manifest é validado antes de qualquer container.
Se um passo falhar, o diretório parcial é mantido e a mensagem diz qual passo falhou.
`;

/** Guia para IA gravado por `init --ai`; a fonte é docs/guia-ia.md (publicado no pacote). */
const aiGuidePath = path.join(__dirname, "../docs/guia-ia.md");
const aiGuideFileName = "CRUDMAKER.md";

const initHelp = `Uso: crudmaker init [arquivo] [--ai]

Cria um manifest de exemplo (padrão: manifest.yaml no diretório atual).
O formato vem da extensão: .yaml/.yml (com comentários explicativos) ou .json.
Recusa se o arquivo já existir.

Opções:
  --ai         grava também o guia para IA (CRUDMAKER.md, no diretório do manifest): formato do manifest, fluxo,
               hooks e o que não editar, em poucas centenas de tokens. Referencie-o no CLAUDE.md ou AGENTS.md do
               projeto (ex.: "@CRUDMAKER.md"). Se o manifest já existir, ele é mantido e só o guia é gravado;
               se o CRUDMAKER.md já existir, o comando recusa e nada é escrito.
  -h, --help   mostra esta ajuda
`;

const stubsPublishHelp = `Uso: crudmaker stubs:publish [tipo...] [--out <dir>] [--force | --refresh-lock]

Copia os templates embutidos da camada gerada para ${stubsFolder}/ no projeto de destino.
Os arquivos dessa pasta têm prioridade, um a um, sobre os embutidos na hora do generate.
Sem tipos, copia todos; com tipos, só os pedidos. O tipo curto é a base (controller = controller.base);
tipos: model, resource, collection, controller, request, factory, migration, routes. As classes finais não têm stub.

Opções:
  -o, --out <dir>   raiz do projeto de destino (padrão: diretório atual)
  --force           sobrescreve stubs que já existem (perde as suas edições neles; só vale para stubs)
  --refresh-lock    não copia nada: registra no ${stubsLockPath} o hash atual do embutido
                    para os stubs existentes, depois de você incorporar a mudança do embutido
  -h, --help        mostra esta ajuda

Um stub que já existe nunca é sobrescrito sem --force: o comando avisa e pula.
`;

const actionLabels: { [key in WriteAction]: string } = {
  created: "criados",
  overwritten: "sobrescritos",
  unchanged: "sem mudança",
  preserved: "preservados",
};

const actionOrder: WriteAction[] = ["created", "overwritten", "unchanged", "preserved"];

function readVersion(): string {
  // Funciona tanto em src/ (tsx) quanto em dist/ (build): o package.json fica um nível acima.
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
  return pkg.version;
}

function missingApiRoutesWarning(outDir: string, capabilities: Capabilities): string {
  const where = path.join(outDir, "routes/api.php");
  const how = capabilities.apiRoutesViaBootstrap
    ? 'No projeto Laravel, rode "php artisan install:api" (cria o arquivo e o registra em bootstrap/app.php) e rode o generate de novo.'
    : "No Laravel 10 o routes/api.php vem no esqueleto e o RouteServiceProvider o carrega; confira se --out aponta para a raiz do projeto " +
      "ou restaure o arquivo (ele só precisa do <?php e do use Illuminate\\Support\\Facades\\Route) e rode o generate de novo.";

  return ["", `Aviso: ${where} não existe, então as rotas geradas (routes/crudmaker.php) ainda não são carregadas.`, how, ""].join("\n");
}

function printPlan(plan: PlannedWrite[], removals: PlannedRemoval[], warnings: string[], io: CliIo, baseDir: string, dryRun: boolean, target: ResolvedTarget): void {
  const lines: string[] = [];
  const verb = dryRun ? "Seria" : "Resumo";

  lines.push(`${dryRun ? "Simulação (nada foi escrito)" : verb} em ${baseDir}`, `Versão alvo: ${describeTarget(target)}`, "");

  for (const action of actionOrder) {
    const items = plan.filter((item) => item.action === action);
    if (items.length === 0) continue;

    lines.push(`${actionLabels[action]} (${items.length}):`);
    for (const item of items) lines.push(`  ${item.file.path}`);
    lines.push("");
  }

  const removed = removals.filter((item) => item.action === "removed");
  if (removed.length > 0) {
    lines.push(`removidos (${removed.length}):`);
    for (const item of removed) lines.push(`  ${item.path}`);
    lines.push("");
  }

  const counts = actionOrder.map((action) => `${plan.filter((i) => i.action === action).length} ${actionLabels[action]}`);
  counts.push(`${removed.length} removidos`);
  lines.push(`Total: ${plan.length} arquivos (${counts.join(", ")})`);

  // Órfãos: arquivos seus de entidades que saíram do manifest. Ficam onde estão.
  const orphans = removals.filter((item) => item.action === "orphaned");
  if (orphans.length > 0) {
    lines.push("", `Órfãos (${orphans.length}): a entidade saiu do manifest, mas estes arquivos são seus e não foram apagados:`);
    for (const item of orphans) {
      lines.push(`  ${item.path}${item.kind === "migration" ? "  (migration: crie à mão uma migration que remova a tabela, se for o caso)" : ""}`);
    }
  }

  // Avisos de nomes: no stdout, junto do resumo (e do --dry-run), como o aviso do routes/api.php.
  if (warnings.length > 0) {
    lines.push("", `Avisos (${warnings.length}):`);
    for (const warning of warnings) lines.push(`  ${warning}`);
  }

  io.stdout(lines.join("\n") + "\n");
}

function runGenerate(args: string[], io: CliIo): number {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o" },
      "dry-run": { type: "boolean", short: "n" },
      seeders: { type: "boolean" },
      "normalize-names": { type: "boolean" },
      "no-normalize-names": { type: "boolean" },
      laravel: { type: "string" },
      php: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    io.stdout(generateHelp);
    return 0;
  }
  if (positionals.length !== 1) {
    throw new UserError("Informe o caminho do manifest: crudmaker generate <manifest> [--out <dir>] [--dry-run]");
  }

  if (values["normalize-names"] && values["no-normalize-names"]) {
    throw new UserError("Use só uma das flags: --normalize-names ou --no-normalize-names.");
  }
  // Sem flag, `undefined`: vale o manifest (padrão: ligada).
  const normalizeNames = values["normalize-names"] ? true : values["no-normalize-names"] ? false : undefined;

  const manifestPath = path.resolve(io.cwd, positionals[0]);
  const outDir = path.resolve(io.cwd, values.out ?? ".");
  const manifestObj = readManifest(manifestPath);

  generateProject(manifestObj, outDir, { dryRun: Boolean(values["dry-run"]), seeders: Boolean(values.seeders), normalizeNames, flags: { laravel: values.laravel, php: values.php } }, io);
  return 0;
}

/** O fluxo do `generate` (versão alvo, plano, escrita, resumo), compartilhado com o `new`. */
function generateProject(
  manifestObj: { [key: string]: any },
  outDir: string,
  options: { dryRun: boolean; seeders?: boolean; normalizeNames?: boolean; flags: { laravel?: string; php?: string } },
  io: CliIo,
): void {
  const normalizeNames = options.normalizeNames;

  // Versão alvo: flag → pkg.target do manifest → composer.lock/composer.json do destino → padrão.
  const detection = detectTarget(outDir);
  const pkg = manifestObj.pkg;
  const resolved = resolveTarget({
    flags: options.flags,
    manifest: typeof pkg === "object" && pkg !== null ? pkg.target : undefined,
    detected: detection.detected,
  });

  const migrationsDir = path.join(outDir, "database/migrations");
  const existingMigrations = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];
  // Sem o cabeçalho de gerado, a migration não é do crudmaker (a menos que o lock a registre): veja `unmarkedMigrations`.
  const unmarkedMigrations = existingMigrations.filter(
    (file) => file.endsWith(".php") && !fs.readFileSync(path.join(migrationsDir, file), "utf8").includes(GENERATED_MARKER),
  );

  const apiRoutesPath = path.join(outDir, "routes/api.php");
  const existingApiRoutes = fs.existsSync(apiRoutesPath) ? fs.readFileSync(apiRoutesPath, "utf8") : null;

  const databaseSeederPath = path.join(outDir, "database/seeders/DatabaseSeeder.php");
  const existingDatabaseSeeder = fs.existsSync(databaseSeederPath) ? fs.readFileSync(databaseSeederPath, "utf8") : null;

  // O lock da geração anterior diz quais entidades existiam; se não dá para lê-lo, só não detecta remoções.
  const lockWarnings: string[] = [];
  let previousLock = null;
  const lockPath = path.join(outDir, "manifest-lock.json");
  if (fs.existsSync(lockPath)) {
    try {
      previousLock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    } catch {
      lockWarnings.push("manifest-lock.json anterior ilegível (JSON inválido): não deu para detectar entidades removidas do manifest.");
    }
  }

  const projectStubs = readStubs(outDir);

  const { files, warnings, obsolete } = generate(manifestObj, {
    now: io.now(),
    existingMigrations,
    unmarkedMigrations,
    existingApiRoutes,
    seeders: options.seeders,
    existingDatabaseSeeder,
    normalizeNames,
    previousLock,
    stubs: projectStubs.stubs,
    stubHashes: projectStubs.hashes,
    target: resolved.target,
  });
  const plan = planWrites(files, outDir);
  const removals = planRemovals(obsolete, outDir);

  if (!options.dryRun) {
    applyPlan(plan);
    applyRemovals(removals, outDir);
  }

  printPlan(plan, removals, [...resolved.warnings, ...detection.warnings, ...warnings, ...lockWarnings, ...projectStubs.warnings, ...legacyFinalWarnings(plan)], io, outDir, options.dryRun, resolved);
  if (existingApiRoutes === null) io.stdout(missingApiRoutesWarning(outDir, capabilitiesFor(resolved.target)));
}

function runInit(args: string[], io: CliIo): number {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { help: { type: "boolean", short: "h" }, ai: { type: "boolean" } },
  });

  if (values.help) {
    io.stdout(initHelp);
    return 0;
  }
  if (positionals.length > 1) throw new UserError("Informe no máximo um arquivo: crudmaker init [arquivo]");

  const name = positionals[0] ?? "manifest.yaml";
  const format = manifestFormat(name);
  if (!format) {
    throw new UserError(`Extensão não suportada em ${name}. Use um destes: ${acceptedExtensionsText}.`);
  }

  const target = path.resolve(io.cwd, name);
  const guideTarget = path.join(path.dirname(target), aiGuideFileName);
  const manifestExists = fs.existsSync(target);
  if (manifestExists && !values.ai) {
    throw new UserError(`${target} já existe; não vou sobrescrever. Escolha outro nome: crudmaker init <arquivo>`);
  }
  if (values.ai && fs.existsSync(guideTarget)) {
    throw new UserError(`${guideTarget} já existe; não vou sobrescrever. Apague-o para gravar o guia de novo.`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  let output = "";
  if (manifestExists) {
    output += `Manifest ${target} já existe; mantido.\n`;
  } else {
    fs.writeFileSync(target, exampleManifestText(format));
    output += `Manifest de exemplo criado em ${target}\n`;
  }
  if (values.ai) {
    fs.writeFileSync(guideTarget, fs.readFileSync(aiGuidePath, "utf8"));
    output += `Guia para IA criado em ${guideTarget}\nReferencie-o no CLAUDE.md ou AGENTS.md do projeto (ex.: "@${aiGuideFileName}").\n`;
  }

  io.stdout(`${output}Próximo passo: crudmaker generate ${name} --out <projeto-laravel> --dry-run\n`);
  return 0;
}

function runStubsPublish(args: string[], io: CliIo): number {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o" },
      force: { type: "boolean" },
      "refresh-lock": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    io.stdout(stubsPublishHelp);
    return 0;
  }
  if (values.force && values["refresh-lock"]) throw new UserError("Use só uma das flags: --force ou --refresh-lock.");

  const outDir = path.resolve(io.cwd, values.out ?? ".");
  const result = publishStubs(outDir, positionals, { force: values.force, refreshLock: values["refresh-lock"] });
  const lines: string[] = [];

  if (values["refresh-lock"]) {
    lines.push(`Hash atualizado no ${stubsLockPath} (${result.refreshed.length}):`, ...result.refreshed.map((name) => `  ${name}`));
    if (result.refreshed.length === 0) lines.push("  (nenhum stub existente entre os pedidos)");
  } else {
    if (result.copied.length > 0) {
      lines.push(`Stubs copiados para ${path.join(outDir, stubsFolder)} (${result.copied.length}):`, ...result.copied.map((name) => `  ${name}.php.eta`));
    }
    if (result.skipped.length > 0) {
      lines.push(
        `Aviso: já existem e foram mantidos (${result.skipped.length}); use --force para sobrescrevê-los:`,
        ...result.skipped.map((name) => `  ${name}.php.eta`),
      );
    }
  }
  io.stdout(lines.join("\n") + "\n");
  return 0;
}

function runNew(args: string[], io: CliIo): number {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      laravel: { type: "string" },
      php: { type: "string" },
      db: { type: "string" },
      "no-sail": { type: "boolean" },
      "skip-generate": { type: "boolean" },
      seeders: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    io.stdout(newHelp);
    return 0;
  }
  if (positionals.length !== 2) throw new UserError("Informe o diretório e o manifest: crudmaker new <dir> <manifest> [opções]");

  const database = (values.db ?? DEFAULT_DATABASE) as SailDatabase;
  if (!SAIL_DATABASES.includes(database)) throw new UserError(`Banco inválido em --db: ${JSON.stringify(values.db)}. Use um destes: ${SAIL_DATABASES.join(", ")}.`);
  if (values["no-sail"] && values.db !== undefined) throw new UserError("--db configura o Sail e não combina com --no-sail.");
  const sail = !values["no-sail"];

  // Pré-checagens: nada aqui toca o disco nem o Docker, até a última.
  const dir = path.resolve(io.cwd, positionals[0]);
  const manifestObj = readManifest(path.resolve(io.cwd, positionals[1]));

  // Ainda não há composer.json no destino, então a versão vem só de flag → manifest → padrão.
  const pkg = manifestObj.pkg;
  const resolved = resolveTarget({
    flags: { laravel: values.laravel, php: values.php },
    manifest: typeof pkg === "object" && pkg !== null ? pkg.target : undefined,
  });

  // A validação do manifest é a do generate (função pura): um manifest inválido falha antes de criar o projeto.
  generate(manifestObj, { now: io.now(), existingMigrations: [], target: resolved.target });

  composerImage(resolved.target.php); // erro cedo se não existe imagem para esse PHP
  assertEmptyTarget(dir);
  const runner = io.runner ?? spawnRunner;
  assertDockerAvailable(runner);

  io.stdout(`Criando o projeto em ${dir}\nVersão alvo: ${describeTarget(resolved)}\n`);
  for (const warning of resolved.warnings) io.stdout(`Aviso: ${warning}\n`);

  const user = io.user ?? (process.getuid && process.getgid ? { uid: process.getuid(), gid: process.getgid() } : undefined);
  runScaffold(
    { dir, laravel: resolved.target.laravel, php: resolved.target.php, database, sail, composerHome: io.composerHome ?? defaultComposerHome(), user },
    runner,
    io.stdout,
  );

  if (!values["skip-generate"]) {
    io.stdout("\nGerando a API do manifest\n");
    generateProject(manifestObj, dir, { dryRun: false, seeders: Boolean(values.seeders), flags: { laravel: values.laravel, php: values.php } }, io);
  }

  io.stdout(newSummary(dir, io.cwd, resolved, { sail, database, generated: !values["skip-generate"], manifestArg: positionals[1] }));
  return 0;
}

function newSummary(dir: string, cwd: string, resolved: ResolvedTarget, o: { sail: boolean; database: SailDatabase; generated: boolean; manifestArg: string }): string {
  // Caminho relativo só quando o projeto está dentro do diretório atual; senão, o absoluto (evita ../../..).
  const relative = path.relative(cwd, dir);
  const rel = relative === "" ? "." : relative.startsWith("..") ? dir : relative;
  const lines = ["", `Projeto criado em ${dir}`, `Versão usada: ${describeTarget(resolved)}`, `Sail: ${o.sail ? `instalado (banco: ${o.database})` : "não instalado (--no-sail)"}`];
  lines.push(`API gerada: ${o.generated ? "sim" : `não (--skip-generate); rode: crudmaker generate ${o.manifestArg} --out ${rel}`}`, "", "Próximos passos:", `  cd ${rel}`);

  if (o.sail) {
    lines.push("  ./vendor/bin/sail up -d");
    if (o.database !== "sqlite") lines.push("  ./vendor/bin/sail artisan migrate");
    else lines.push("  ./vendor/bin/sail artisan migrate   # o banco é o sqlite do .env (Laravel 11+); no Laravel 10 ajuste DB_CONNECTION=sqlite no .env antes");
    lines.push("  # a API responde em http://localhost/api (rotas: ./vendor/bin/sail artisan route:list)");
    if (o.generated) lines.push("  ./vendor/bin/sail test             # testes Pest gerados (tests/Feature/Crudmaker); veja \"Testes gerados\" em docs/como-usar.md");
  } else {
    const image = `laravelsail/php${resolved.target.php.replace(".", "")}-composer:latest`;
    lines.push(
      "  # sem Sail e sem PHP local, via Docker (o banco do .env precisa estar acessível; no Laravel 11+ o padrão é sqlite):",
      `  docker run --rm --user $(id -u):$(id -g) -v "$PWD":/var/www/html -w /var/www/html ${image} php artisan migrate`,
      `  docker run --rm --user $(id -u):$(id -g) -v "$PWD":/var/www/html -w /var/www/html -p 8000:8000 ${image} php artisan serve --host=0.0.0.0`,
      "  # a API responde em http://localhost:8000/api",
      ...(o.generated ? [`  docker run --rm --user $(id -u):$(id -g) -v "$PWD":/var/www/html -w /var/www/html ${image} php vendor/bin/pest   # testes Pest gerados (veja "Testes gerados" em docs/como-usar.md)`] : []),
    );
  }
  return lines.join("\n") + "\n";
}

/** Executa a CLI com os argumentos (sem `node` e o script) e devolve o exit code. */
export function run(argv: string[], io: CliIo = defaultIo): number {
  try {
    const [command, ...rest] = argv;

    if (command === undefined || command === "--help" || command === "-h" || command === "help") {
      io.stdout(mainHelp);
      return command === undefined ? 1 : 0;
    }
    if (command === "--version" || command === "-v") {
      io.stdout(readVersion() + "\n");
      return 0;
    }
    if (command === "generate") return runGenerate(rest, io);
    if (command === "new") return runNew(rest, io);
    if (command === "init") return runInit(rest, io);
    if (command === "stubs:publish") return runStubsPublish(rest, io);

    throw new UserError(`Comando desconhecido: ${command}. Use crudmaker --help.`);
  } catch (e: any) {
    // Erros de uso (parseArgs) e de entrada (UserError, erros do Manifest) saem só com a mensagem.
    io.stderr(`Erro: ${e.message}\n`);
    if (process.env.CRUDMAKER_DEBUG) io.stderr(String(e.stack) + "\n");
    return 1;
  }
}
