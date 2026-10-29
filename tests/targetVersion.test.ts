import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliIo, run } from "../src/cli";
import { detectTarget, lowestOfConstraint } from "../src/detectTarget";
import { generate, GeneratedFile } from "../src/generate";
import { capabilitiesFor } from "../src/targets/laravel-api/capabilities";
import { assertSupported, DEFAULT_TARGET, resolveTarget, TargetVersion, TargetVersionError } from "../src/targetVersion";

// Ticket 15: versão alvo (Laravel/PHP). Resolução por prioridade, detecção no composer, capacidades e a saída por versão.

const fixturesDir = path.join(__dirname, "fixtures");
const composerDir = (name: string) => path.join(fixturesDir, "composer", name);
const snapshotsDir = path.join(__dirname, "__snapshots__");
const now = new Date(2025, 0, 2, 3, 4, 5);

describe("lowestOfConstraint", () => {
  it.each([
    ["^11.31", [11, 31]],
    ["~8.2.0", [8, 2]],
    [">=8.1 <8.4", [8, 1]],
    ["^10.0 || ^11.0", [10, 0]],
    ["^8.3|^8.2", [8, 2]],
    ["8.2.*", [8, 2]],
    ["v12.1.0", [12, 1]],
    ["<9.0 || ^10.0", [10, 0]],
    ["^8", [8, 0]],
  ])("%s → %j", (constraint, expected) => {
    expect(lowestOfConstraint(constraint)).toEqual(expected);
  });

  it.each(["*", "dev-main", "", "<9"])("%j não tem versão", (constraint) => {
    expect(lowestOfConstraint(constraint)).toBeNull();
  });
});

describe("detectTarget (composer.json / composer.lock de exemplo)", () => {
  it("composer.lock: versão instalada do laravel/framework; PHP pela restrição require.php", () => {
    const { detected, warnings } = detectTarget(composerDir("laravel-11-lock"));

    expect(detected.laravel).toEqual({ value: 11, source: "composer.lock", exact: true });
    expect(detected.php).toEqual({ value: "8.2", source: "composer.json", exact: false });
    expect(warnings).toEqual([]);
  });

  it("sem lock: restrição do laravel/framework no composer.json", () => {
    const { detected } = detectTarget(composerDir("laravel-10-json"));

    expect(detected.laravel).toEqual({ value: 10, source: "composer.json", exact: false });
    expect(detected.php).toEqual({ value: "8.1", source: "composer.json", exact: false });
  });

  it("restrição com mais de uma alternativa vale pela menor", () => {
    const { detected } = detectTarget(composerDir("laravel-multi"));

    expect(detected.laravel?.value).toBe(11);
    expect(detected.php?.value).toBe("8.2");
  });

  it("config.platform.php do composer.json é a versão fixada e vale mais que require.php", () => {
    const { detected } = detectTarget(composerDir("pinned-platform"));

    expect(detected.php).toEqual({ value: "8.3", source: "composer.json", exact: true });
    expect(detected.laravel?.value).toBe(12);
  });

  it("pasta sem composer: nada detectado, sem avisos", () => {
    expect(detectTarget(fixturesDir)).toEqual({ detected: {}, warnings: [] });
  });

  describe("arquivos problemáticos", () => {
    let tmp: string;
    beforeEach(() => void (tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-detect-"))));
    afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

    it("composer.lock ilegível: avisa e cai no composer.json", () => {
      fs.writeFileSync(path.join(tmp, "composer.lock"), "{ não é json");
      fs.writeFileSync(path.join(tmp, "composer.json"), JSON.stringify({ require: { "laravel/framework": "^11.0" } }));

      const { detected, warnings } = detectTarget(tmp);

      expect(detected.laravel).toEqual({ value: 11, source: "composer.json", exact: false });
      expect(warnings).toEqual(["composer.lock ilegível (JSON inválido): ignorado na detecção da versão."]);
    });

    it("restrição que não dá para interpretar: avisa e não detecta", () => {
      fs.writeFileSync(path.join(tmp, "composer.json"), JSON.stringify({ require: { "laravel/framework": "dev-master" } }));

      const { detected, warnings } = detectTarget(tmp);

      expect(detected.laravel).toBeUndefined();
      expect(warnings[0]).toContain("não deu para interpretar a restrição de laravel/framework");
    });

    it("platform-overrides do lock fixa o PHP quando o composer.json não fixa", () => {
      fs.writeFileSync(path.join(tmp, "composer.lock"), JSON.stringify({ packages: [], "platform-overrides": { php: "8.4.1" } }));
      fs.writeFileSync(path.join(tmp, "composer.json"), JSON.stringify({ require: { php: "^8.2" } }));

      expect(detectTarget(tmp).detected.php).toEqual({ value: "8.4", source: "composer.lock", exact: true });
    });
  });
});

describe("resolveTarget", () => {
  const lock11 = detectTarget(composerDir("laravel-11-lock")).detected;

  it("sem nada: padrão (Laravel 12, PHP 8.2), com a origem 'padrão'", () => {
    expect(resolveTarget({})).toEqual({ target: DEFAULT_TARGET, sources: { laravel: "padrão", php: "padrão" }, warnings: [] });
    expect(DEFAULT_TARGET).toEqual({ laravel: 12, php: "8.2" });
  });

  it("detecção no destino vale mais que o padrão", () => {
    const resolved = resolveTarget({ detected: lock11 });

    expect(resolved.target).toEqual({ laravel: 11, php: "8.2" });
    expect(resolved.sources).toEqual({ laravel: "composer.lock", php: "composer.json" });
    expect(resolved.warnings).toEqual([]);
  });

  it("manifest vale mais que a detecção; flag vale mais que o manifest", () => {
    const fromManifest = resolveTarget({ manifest: { laravel: 10, php: "8.1" }, detected: lock11 });
    expect(fromManifest.target).toEqual({ laravel: 10, php: "8.1" });
    expect(fromManifest.sources).toEqual({ laravel: "manifest", php: "manifest" });

    const fromFlags = resolveTarget({ flags: { laravel: "12", php: "8.4" }, manifest: { laravel: 10, php: "8.1" }, detected: lock11 });
    expect(fromFlags.target).toEqual({ laravel: 12, php: "8.4" });
    expect(fromFlags.sources).toEqual({ laravel: "flag", php: "flag" });
  });

  it("cada parte resolve de forma independente", () => {
    const resolved = resolveTarget({ flags: { php: "8.3" }, manifest: { laravel: 10 }, detected: lock11 });

    expect(resolved.target).toEqual({ laravel: 10, php: "8.3" });
    expect(resolved.sources).toEqual({ laravel: "manifest", php: "flag" });

    const mixed = resolveTarget({ flags: { laravel: "10" }, detected: { php: { value: "8.3", source: "composer.json", exact: false } } });
    expect(mixed.sources).toEqual({ laravel: "flag", php: "composer.json" });
    expect(mixed.target).toEqual({ laravel: 10, php: "8.3" });
  });

  it("aceita formas variadas: número, texto, 11.x, 8.2.5 e o número do YAML (8.2)", () => {
    expect(resolveTarget({ flags: { laravel: "11.x", php: "8.2.5" } }).target).toEqual({ laravel: 11, php: "8.2" });
    expect(resolveTarget({ manifest: { laravel: "v11", php: 8.3 } }).target).toEqual({ laravel: 11, php: "8.3" });
  });

  describe("aviso de divergência", () => {
    it("Laravel explícito diferente do instalado", () => {
      const { warnings, target } = resolveTarget({ flags: { laravel: "12" }, detected: lock11 });

      expect(target.laravel).toBe(12);
      expect(warnings).toEqual([expect.stringContaining("Laravel 12 (flag) diverge do instalado no destino: Laravel 11 (composer.lock)")]);
    });

    it("do manifest também avisa; restrição do composer.json é 'declarado'", () => {
      const { warnings } = resolveTarget({ manifest: { laravel: 11 }, flags: { php: "8.2" }, detected: detectTarget(composerDir("laravel-10-json")).detected });

      expect(warnings).toEqual([expect.stringContaining("Laravel 11 (manifest) diverge do declarado no destino: Laravel 10 (composer.json)")]);
    });

    it("sem divergência, sem aviso (igual ao detectado)", () => {
      expect(resolveTarget({ flags: { laravel: "11" }, detected: lock11 }).warnings).toEqual([]);
    });

    it("PHP: igual ou acima do mínimo da restrição é compatível; abaixo avisa; fixado diferente avisa", () => {
      const ok = resolveTarget({ flags: { php: "8.4" }, detected: lock11 });
      expect(ok.warnings).toEqual([]);

      const pinned = detectTarget(composerDir("pinned-platform")).detected;
      const diverges = resolveTarget({ flags: { php: "8.4" }, detected: pinned });
      expect(diverges.warnings).toEqual([expect.stringContaining("PHP 8.4 (flag) diverge do fixado no destino: PHP 8.3 (composer.json)")]);

      const below = resolveTarget({ flags: { laravel: "10", php: "8.1" }, detected: lock11 });
      expect(below.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining("PHP 8.1 (flag) diverge do mínimo declarado no destino: PHP 8.2 (composer.json)")]),
      );
    });
  });

  describe("erros", () => {
    const fails = (input: Parameters<typeof resolveTarget>[0], message: string | RegExp) => {
      expect(() => resolveTarget(input)).toThrow(TargetVersionError);
      expect(() => resolveTarget(input)).toThrow(message);
    };

    it("Laravel não suportado (< 10 ou > 12), dizendo a origem e as versões válidas", () => {
      fails({ flags: { laravel: "9" } }, "Laravel 9 (flag) não é suportado. O crudmaker gera código para o Laravel 10, 11, 12.");
      fails({ flags: { laravel: "13" } }, "Laravel 13 (flag) não é suportado");
      fails({ manifest: { laravel: 8 } }, "Laravel 8 (manifest) não é suportado");
    });

    it("versão detectada não suportada também falha, apontando o arquivo", () => {
      fails({ detected: { laravel: { value: 9, source: "composer.lock", exact: true } } }, "Laravel 9 (composer.lock) não é suportado");
    });

    it("PHP abaixo de 8.1 ou da série 8", () => {
      fails({ flags: { php: "7.4" } }, "PHP 7.4 (flag) não é suportado. O crudmaker gera código para o PHP 8.1 ou superior");
      fails({ flags: { php: "8.0" } }, "PHP 8.0 (flag) não é suportado");
      fails({ manifest: { php: "9.0" } }, "PHP 9.0 (manifest) não é suportado");
    });

    it("PHP abaixo do mínimo do Laravel escolhido", () => {
      fails({ flags: { php: "8.1" } }, "PHP 8.1 (flag) é anterior ao mínimo do Laravel 12 (PHP 8.2)");
      fails({ flags: { laravel: "11", php: "8.1" } }, "mínimo do Laravel 11 (PHP 8.2)");
      expect(resolveTarget({ flags: { laravel: "10", php: "8.1" } }).target).toEqual({ laravel: 10, php: "8.1" });
    });

    it("valores mal formados", () => {
      fails({ flags: { laravel: "onze" } }, 'Versão do Laravel inválida em --laravel: "onze"');
      fails({ flags: { php: "8" } }, 'Versão do PHP inválida em --php: "8"');
      fails({ manifest: { laravel: true } }, "Versão do Laravel inválida em pkg.target.laravel do manifest");
      fails({ manifest: "11" }, "pkg.target do manifest deve ser um objeto");
    });
  });
});

describe("generate: versão alvo", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(fixturesDir, "curso/manifest.json"), "utf8"));
  const gen = (target?: TargetVersion) => generate(manifest, { now, existingMigrations: [], normalizeNames: false, target });

  it("recusa versão não suportada e PHP abaixo do mínimo, sem a CLI", () => {
    expect(() => gen({ laravel: 9, php: "8.2" } as any)).toThrow("Laravel 9 (target.laravel) não é suportado");
    expect(() => gen({ laravel: 12, php: "8.1" })).toThrow("anterior ao mínimo do Laravel 12");
  });

  it("registra a versão usada no lock; sem target vale o padrão", () => {
    const lockOf = (files: GeneratedFile[]) => JSON.parse(files.find((file) => file.path === "manifest-lock.json")!.content);

    expect(lockOf(gen({ laravel: 10, php: "8.1" }).files).target).toEqual({ laravel: 10, php: "8.1" });
    expect(lockOf(gen().files).target).toEqual({ laravel: 12, php: "8.2" });
  });

  it("avisa quando a versão do lock anterior é outra", () => {
    const first = gen({ laravel: 10, php: "8.1" });
    const previousLock = JSON.parse(first.files[0].content);
    const second = generate(manifest, { now, existingMigrations: [], normalizeNames: false, previousLock, target: { laravel: 12, php: "8.2" } });

    const changes = (warnings: string[]) => warnings.filter((warning) => warning.startsWith("A versão alvo mudou"));
    expect(changes(second.warnings)).toEqual([expect.stringContaining("A versão alvo mudou desde a última geração (Laravel 10, PHP 8.1 → Laravel 12, PHP 8.2)")]);

    const same = generate(manifest, { now, existingMigrations: [], normalizeNames: false, previousLock, target: { laravel: 10, php: "8.1" } });
    expect(changes(same.warnings)).toEqual([]);

    // lock sem target (anterior ao ticket 15): sem aviso
    const { target: _target, ...legacy } = previousLock;
    expect(changes(generate(manifest, { now, existingMigrations: [], normalizeNames: false, previousLock: legacy }).warnings)).toEqual([]);
  });
});

describe("capacidades", () => {
  it.each([
    [{ laravel: 10, php: "8.1" }, { castsMethod: false, apiRoutesViaBootstrap: false, nativeColumnChange: false, backedEnums: true, readonlyClasses: false, typedClassConstants: false }],
    [{ laravel: 11, php: "8.2" }, { castsMethod: true, apiRoutesViaBootstrap: true, nativeColumnChange: true, backedEnums: true, readonlyClasses: true, typedClassConstants: false }],
    [{ laravel: 12, php: "8.4" }, { castsMethod: true, apiRoutesViaBootstrap: true, nativeColumnChange: true, backedEnums: true, readonlyClasses: true, typedClassConstants: true }],
  ] as [TargetVersion, object][])("%j", (target, expected) => {
    assertSupported(target);
    expect(capabilitiesFor(target)).toEqual(expected);
  });
});

/**
 * Saída por versão. Os snapshots completos de todas as fixtures rodam no padrão (Laravel 12). Para 10 e 11 não se
 * triplica tudo: a saída é comparada com a do 12 (as únicas diferenças permitidas são listadas) e as
 * diferenças ganham snapshot próprio em `__snapshots__/laravel-10`.
 */
describe.each(["bingo", "curso", "vende-que-vende-api", "field-options"])("saída por versão (%s)", (name) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
  const at = (target: TargetVersion) => generate(manifest, { now, existingMigrations: [], normalizeNames: false, target });
  const contents = (files: GeneratedFile[]) => new Map(files.map((file) => [file.path, file.content]));
  const withoutTarget = (content: string) => JSON.stringify({ ...JSON.parse(content), target: undefined });

  const l12 = contents(at({ laravel: 12, php: "8.2" }).files);

  it("Laravel 11 gera a mesma saída do 12 (o lock só difere na versão registrada)", () => {
    const l11 = contents(at({ laravel: 11, php: "8.2" }).files);

    expect([...l11.keys()]).toEqual([...l12.keys()]);
    for (const [file, content] of l11) {
      if (file === "manifest-lock.json") expect(withoutTarget(content)).toBe(withoutTarget(l12.get(file)!));
      else expect(content).toBe(l12.get(file));
    }
  });

  it("Laravel 10 só difere do 12 no cast da model base (propriedade $casts) e no lock", async () => {
    const files = at({ laravel: 10, php: "8.1" }).files;
    const l10 = contents(files);
    const different = [...l10.keys()].filter((file) => l10.get(file) !== l12.get(file));

    expect([...l10.keys()]).toEqual([...l12.keys()]);
    expect(different.filter((file) => file !== "manifest-lock.json" && !file.startsWith("app/Generated/Models/") && !file.startsWith("app/Models/"))).toEqual([]);

    // A model final só difere no nome do mecanismo de casts citado nos comentários.
    for (const file of different.filter((file) => file.startsWith("app/Models/"))) {
      expect(l10.get(file)).toContain("$casts");
      expect(l12.get(file)).toContain("casts()");
      expect(l10.get(file)!.replaceAll("$casts", "casts()")).toBe(l12.get(file));
    }
    expect(different).toContain("manifest-lock.json");
    expect(withoutTarget(l10.get("manifest-lock.json")!)).toBe(withoutTarget(l12.get("manifest-lock.json")!));

    for (const file of different.filter((file) => file.startsWith("app/Generated/Models/"))) {
      const content = l10.get(file)!;
      expect(content).toContain("protected $casts = [");
      expect(content).not.toContain("function casts()");
      expect(l12.get(file)).toContain("protected function casts(): array");
      expect(l12.get(file)).not.toContain("$casts");
      await expect(content).toMatchFileSnapshot(path.join(snapshotsDir, "laravel-10", name, file));
    }
  });
});

describe("alter: comentário do ->change() por versão", () => {
  const before = { system: { code: "x" }, pkg: { code: "x", entities: { client: { fields: { id: "uuid", age: "string" } } } } };
  const after = { system: { code: "x" }, pkg: { code: "x", entities: { client: { fields: { id: "uuid", age: "integer" } } } } };
  const alterAt = (target: TargetVersion) => {
    const first = generate(before, { now, existingMigrations: [], target });
    const second = generate(after, {
      now,
      existingMigrations: first.files.filter((file) => file.path.startsWith("database/migrations/")).map((file) => path.basename(file.path)),
      previousLock: JSON.parse(first.files[0].content),
      target,
    });
    return second.files.find((file) => file.path.includes("_alter_"))!.content;
  };

  it("só o Laravel 10 lembra do doctrine/dbal", async () => {
    const l10 = alterAt({ laravel: 10, php: "8.1" });

    expect(l10).toContain("// No Laravel 10, ->change() exige o pacote doctrine/dbal (composer require doctrine/dbal).");
    expect(alterAt({ laravel: 11, php: "8.2" })).not.toContain("doctrine");
    expect(alterAt({ laravel: 12, php: "8.2" })).not.toContain("doctrine");
    await expect(l10).toMatchFileSnapshot(path.join(snapshotsDir, "laravel-10", "alter-migration.php"));
  });
});

describe("stubs enxergam as capacidades (it.capabilities e it.target)", () => {
  it("um stub do projeto pode ramificar por capacidade", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(fixturesDir, "curso/manifest.json"), "utf8"));
    const stub = "// casts: <%~ it.capabilities.castsMethod ? 'metodo' : 'propriedade' %> / Laravel <%~ it.target.laravel %>\n";
    const routes = (target: TargetVersion) =>
      generate(manifest, { now, existingMigrations: [], target, stubs: { routes: stub } }).files.find((file) => file.path === "routes/crudmaker.php")!.content;

    expect(routes({ laravel: 10, php: "8.1" })).toBe("// casts: propriedade / Laravel 10\n");
    expect(routes({ laravel: 12, php: "8.2" })).toBe("// casts: metodo / Laravel 12\n");
  });
});

describe("CLI: versão alvo", () => {
  const manifestPath = path.join(fixturesDir, "curso/manifest.json");
  let tmp: string;
  let out: string;
  let stdout: string;
  let stderr: string;

  const io = (): CliIo => ({ stdout: (t) => (stdout += t), stderr: (t) => (stderr += t), cwd: tmp, now: () => now });
  const copyComposer = (name: string) => {
    fs.mkdirSync(out, { recursive: true });
    for (const file of fs.readdirSync(composerDir(name))) fs.copyFileSync(path.join(composerDir(name), file), path.join(out, file));
  };
  const lock = () => JSON.parse(fs.readFileSync(path.join(out, "manifest-lock.json"), "utf8"));

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-target-"));
    out = path.join(tmp, "projeto");
    stdout = "";
    stderr = "";
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("sem nada: padrão, e o resumo mostra a versão e a origem", () => {
    expect(run(["generate", manifestPath, "--out", out], io())).toBe(0);

    expect(stdout).toContain("Versão alvo: Laravel 12 (padrão), PHP 8.2 (padrão)");
    expect(lock().target).toEqual({ laravel: 12, php: "8.2" });
  });

  it("projeto Laravel 11 com composer.lock: detecta, sem aviso, e a model usa casts()", () => {
    copyComposer("laravel-11-lock");

    expect(run(["generate", manifestPath, "--out", out, "--dry-run"], io())).toBe(0);
    expect(stdout).toContain("Versão alvo: Laravel 11 (composer.lock), PHP 8.2 (composer.json)");
    expect(stdout).not.toContain("diverge");

    stdout = "";
    run(["generate", manifestPath, "--out", out], io());
    expect(lock().target).toEqual({ laravel: 11, php: "8.2" });
    expect(fs.readFileSync(path.join(out, "app/Generated/Models/BaseStudent.php"), "utf8")).toContain("protected function casts(): array");
  });

  it("flag vale mais que o composer e avisa da divergência", () => {
    copyComposer("laravel-11-lock");

    expect(run(["generate", manifestPath, "--out", out, "--laravel", "10", "--php", "8.1"], io())).toBe(0);

    expect(stdout).toContain("Versão alvo: Laravel 10 (flag), PHP 8.1 (flag)");
    expect(stdout).toContain("Laravel 10 (flag) diverge do instalado no destino: Laravel 11 (composer.lock)");
    expect(fs.readFileSync(path.join(out, "app/Generated/Models/BaseStudent.php"), "utf8")).toContain("protected $casts = [");
  });

  it("pkg.target do manifest vale mais que o composer, e a flag mais que o manifest", () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.pkg.target = { laravel: 10, php: "8.1" };
    const file = path.join(tmp, "manifest.json");
    fs.writeFileSync(file, JSON.stringify(manifest));
    copyComposer("laravel-11-lock");

    run(["generate", file, "--out", out, "--dry-run"], io());
    expect(stdout).toContain("Versão alvo: Laravel 10 (manifest), PHP 8.1 (manifest)");

    stdout = "";
    run(["generate", file, "--out", out, "--dry-run", "--php", "8.3"], io());
    expect(stdout).toContain("Versão alvo: Laravel 10 (manifest), PHP 8.3 (flag)");
  });

  it("versão não suportada: erro claro, exit code 1 e nada escrito", () => {
    expect(run(["generate", manifestPath, "--out", out, "--laravel", "9"], io())).toBe(1);
    expect(stderr).toBe("Erro: Laravel 9 (flag) não é suportado. O crudmaker gera código para o Laravel 10, 11, 12.\n");
    expect(fs.existsSync(out)).toBe(false);

    stderr = "";
    expect(run(["generate", manifestPath, "--out", out, "--laravel", "12", "--php", "8.1"], io())).toBe(1);
    expect(stderr).toContain("PHP 8.1 (flag) é anterior ao mínimo do Laravel 12 (PHP 8.2)");
  });

  it("projeto detectado com versão não suportada falha, e a flag resolve", () => {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "composer.json"), JSON.stringify({ require: { php: "^8.1", "laravel/framework": "^9.19" } }));

    expect(run(["generate", manifestPath, "--out", out], io())).toBe(1);
    expect(stderr).toContain("Laravel 9 (composer.json) não é suportado");

    stderr = "";
    expect(run(["generate", manifestPath, "--out", out, "--laravel", "10"], io())).toBe(0);
    expect(stdout).toContain("Laravel 10 (flag) diverge do declarado no destino: Laravel 9 (composer.json)");
  });

  it("mudar a versão entre gerações avisa", () => {
    run(["generate", manifestPath, "--out", out, "--laravel", "10", "--php", "8.1"], io());
    stdout = "";
    run(["generate", manifestPath, "--out", out], io());

    expect(stdout).toContain("A versão alvo mudou desde a última geração (Laravel 10, PHP 8.1 → Laravel 12, PHP 8.2)");
  });

  it("routes/api.php ausente: a mensagem segue a versão", () => {
    run(["generate", manifestPath, "--out", out, "--laravel", "11"], io());
    expect(stdout).toContain("php artisan install:api");

    stdout = "";
    fs.rmSync(out, { recursive: true });
    run(["generate", manifestPath, "--out", out, "--laravel", "10", "--php", "8.1"], io());
    expect(stdout).not.toContain("install:api");
    expect(stdout).toContain("No Laravel 10 o routes/api.php vem no esqueleto e o RouteServiceProvider o carrega");
  });

  it("routes/api.php existente recebe o include em qualquer versão", () => {
    fs.mkdirSync(path.join(out, "routes"), { recursive: true });
    fs.writeFileSync(path.join(out, "routes/api.php"), "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n");

    for (const laravel of ["10", "11", "12"]) {
      expect(run(["generate", manifestPath, "--out", out, "--laravel", laravel, "--php", "8.2"], io())).toBe(0);
      expect(fs.readFileSync(path.join(out, "routes/api.php"), "utf8").match(/crudmaker\.php/g)).toHaveLength(2);
    }
  });
});
