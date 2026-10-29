import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { checkPhpDir, classifyFailures, dockerAvailable } from "../scripts/checkPhpSyntax";

describe("classifyFailures", () => {
  const allowlist = [
    { file: "a/Conhecido.php", reason: "x" },
    { file: "a/Corrigido.php", reason: "y" },
  ];

  it("separa falhas conhecidas das inesperadas e acusa entradas obsoletas da allowlist", () => {
    const result = classifyFailures(
      [
        { file: "a/Conhecido.php", message: "erro" },
        { file: "b/Novo.php", message: "erro" },
      ],
      allowlist,
    );

    expect(result.known.map((item) => item.file)).toEqual(["a/Conhecido.php"]);
    expect(result.unexpected.map((item) => item.file)).toEqual(["b/Novo.php"]);
    expect(result.staleAllowlist).toEqual(["a/Corrigido.php"]);
  });
});

// Precisa de Docker (e baixa a imagem do PHP na primeira vez), então só roda com PHP_DOCKER_TESTS=1.
// O CI cobre o caso feliz via `npm run lint:php`.
describe.skipIf(!process.env.PHP_DOCKER_TESTS || !dockerAvailable())("checagem de sintaxe PHP (Docker)", () => {
  it("aceita PHP válido e reprova PHP inválido, apontando o arquivo", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "crudmaker-php-test-"));
    try {
      fs.writeFileSync(path.join(dir, "Ok.php"), "<?php\n\nclass Ok {}\n");
      fs.mkdirSync(path.join(dir, "sub"));
      fs.writeFileSync(path.join(dir, "sub/Ruim.php"), "<?php\n\nclass Ruim {\n\tpublic function x( {\n}\n");

      const result = checkPhpDir(dir);

      expect(result.total).toBe(2);
      expect(result.failures.map((item) => item.file)).toEqual(["sub/Ruim.php"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("o script sai com código diferente de zero quando há PHP inválido", () => {
    const run = spawnSync("npx", ["tsx", "scripts/checkPhpSyntax.ts"], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, CRUDMAKER_INJECT_INVALID_PHP: "1" },
      encoding: "utf8",
    });

    expect(run.status).toBe(1);
    expect(run.stderr).toContain("__invalido__/Quebrado.php");
  });
});
