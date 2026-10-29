import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import { generate } from "./generate";
import { exampleManifestText } from "./initTemplate";
import { acceptedExtensionsText, manifestFormat, readManifest, UserError } from "./readManifest";
import { applyPlan, planWrites, PlannedWrite, WriteAction } from "./writeFiles";

export type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Diretório atual (padrão de `--out` e de `init`). */
  cwd: string;
  /** Data usada no nome das migrations novas. */
  now: () => Date;
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
  init [arquivo]        cria um manifest de exemplo

Opções:
  -h, --help            mostra esta ajuda (também funciona por comando)
  -v, --version         mostra a versão
`;

const generateHelp = `Uso: crudmaker generate <manifest> [--out <dir>] [--dry-run] [--normalize-names | --no-normalize-names]

Gera Model, Migration, Controller, Request, Resource e Collection de cada entidade,
mais o arquivo de rotas (routes/crudmaker.php), incluído uma única vez no routes/api.php.

Opções:
  -o, --out <dir>   raiz do projeto Laravel de destino (padrão: diretório atual)
  -n, --dry-run     não escreve nada; lista o que seria criado, sobrescrito ou preservado
  --normalize-names     liga a normalização de nomes (entidade singular camelCase, campo snake_case)
  --no-normalize-names  desliga a normalização: os nomes passam como estão (só avisa o que está fora da convenção)
                        As duas flags têm prioridade sobre pkg.normalizeNames do manifest (padrão: ligada).
  -h, --help        mostra esta ajuda

Atenção: arquivos existentes são sobrescritos, inclusive edições feitas à mão.
Use --dry-run primeiro e mantenha o projeto de destino sob controle de versão.
`;

const initHelp = `Uso: crudmaker init [arquivo]

Cria um manifest de exemplo (padrão: manifest.yaml no diretório atual).
O formato vem da extensão: .yaml/.yml (com comentários explicativos) ou .json.
Recusa se o arquivo já existir.

Opções:
  -h, --help   mostra esta ajuda
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

function missingApiRoutesWarning(outDir: string): string {
  return [
    "",
    `Aviso: ${path.join(outDir, "routes/api.php")} não existe, então as rotas geradas (routes/crudmaker.php) ainda não são carregadas.`,
    'No projeto Laravel, rode "php artisan install:api" (cria o arquivo e o registra em bootstrap/app.php) e rode o generate de novo.',
    "",
  ].join("\n");
}

function printPlan(plan: PlannedWrite[], warnings: string[], io: CliIo, baseDir: string, dryRun: boolean): void {
  const lines: string[] = [];
  const verb = dryRun ? "Seria" : "Resumo";

  lines.push(`${dryRun ? "Simulação (nada foi escrito)" : verb} em ${baseDir}`, "");

  for (const action of actionOrder) {
    const items = plan.filter((item) => item.action === action);
    if (items.length === 0) continue;

    lines.push(`${actionLabels[action]} (${items.length}):`);
    for (const item of items) lines.push(`  ${item.file.path}`);
    lines.push("");
  }

  const counts = actionOrder.map((action) => `${plan.filter((i) => i.action === action).length} ${actionLabels[action]}`);
  lines.push(`Total: ${plan.length} arquivos (${counts.join(", ")})`);

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
      "normalize-names": { type: "boolean" },
      "no-normalize-names": { type: "boolean" },
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

  const migrationsDir = path.join(outDir, "database/migrations");
  const existingMigrations = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];

  const apiRoutesPath = path.join(outDir, "routes/api.php");
  const existingApiRoutes = fs.existsSync(apiRoutesPath) ? fs.readFileSync(apiRoutesPath, "utf8") : null;

  const { files, warnings } = generate(manifestObj, { now: io.now(), existingMigrations, existingApiRoutes, normalizeNames });
  const plan = planWrites(files, outDir);

  if (!values["dry-run"]) applyPlan(plan);

  printPlan(plan, warnings, io, outDir, Boolean(values["dry-run"]));
  if (existingApiRoutes === null) io.stdout(missingApiRoutesWarning(outDir));
  return 0;
}

function runInit(args: string[], io: CliIo): number {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { help: { type: "boolean", short: "h" } },
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
  if (fs.existsSync(target)) {
    throw new UserError(`${target} já existe; não vou sobrescrever. Escolha outro nome: crudmaker init <arquivo>`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, exampleManifestText(format));

  io.stdout(`Manifest de exemplo criado em ${target}\nPróximo passo: crudmaker generate ${name} --out <projeto-laravel> --dry-run\n`);
  return 0;
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
    if (command === "init") return runInit(rest, io);

    throw new UserError(`Comando desconhecido: ${command}. Use crudmaker --help.`);
  } catch (e: any) {
    // Erros de uso (parseArgs) e de entrada (UserError, erros do Manifest) saem só com a mensagem.
    io.stderr(`Erro: ${e.message}\n`);
    if (process.env.CRUDMAKER_DEBUG) io.stderr(String(e.stack) + "\n");
    return 1;
  }
}
