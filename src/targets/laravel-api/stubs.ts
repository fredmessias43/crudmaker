import { createHash } from "crypto";
import { embeddedTemplate, Stubs, validateStub } from "./render";

/**
 * Templates que os stubs do projeto podem substituir: só os da camada gerada (bases, migration e rotas).
 * Os `*.final.php.eta` ficam de fora de propósito: a final é `create-once` e é do usuário, então o lugar
 * de mudar o comportamento dela é o PHP (hooks), e um stub só valeria para arquivos novos, criando
 * projetos com finais de padrões diferentes.
 */
export const replaceableTemplates = ["model.base", "resource.base", "collection.base", "controller.base", "request.base", "factory.base", "enum", "migration", "routes"];

/** Pasta dos stubs no projeto de destino, relativa à raiz do projeto. */
export const stubsFolder = "stubs/crudmaker/laravel-api";

/** Arquivo com os hashes dos embutidos no momento da publicação, relativo à raiz do projeto. */
export const stubsLockPath = "stubs/crudmaker/stubs-lock.json";

/** Hash (sha256, hex) do conteúdo de um template, usado para detectar que o embutido mudou. */
export function templateHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Hash do template embutido atual. */
export function embeddedHash(name: string): string {
  return templateHash(embeddedTemplate(name));
}

/**
 * Resolve os nomes pedidos em `stubs:publish` para nomes de template. Nome curto = a base
 * (`controller` → `controller.base`); `controller.base`, `migration` e `routes` também valem.
 * Lança erro com a lista de nomes válidos se algum for desconhecido (inclusive `*.final`).
 */
export function resolveStubNames(requested: string[]): string[] {
  const resolved = requested.map((name) => {
    const full = name.replace(/\.php\.eta$/, "");
    const candidate = replaceableTemplates.includes(full) ? full : `${full}.base`;
    if (!replaceableTemplates.includes(candidate)) {
      const hint = full.endsWith(".final") ? " Os stubs só substituem a camada gerada; as classes finais não têm stub." : "";
      throw new Error(`Stub desconhecido: ${name}.${hint} Disponíveis: ${replaceableTemplates.join(", ")}.`);
    }
    return candidate;
  });
  return [...new Set(resolved)];
}

/**
 * Valida os stubs recebidos e devolve os que valem (só os substituíveis) com os avisos:
 * stub que não substitui nada (ignorado) e stub publicado a partir de um embutido que mudou desde então.
 * `hashes` é o `stubs-lock.json`: nome → hash do embutido na publicação.
 */
export function prepareStubs(stubs: Stubs, hashes: { [name: string]: string }): { stubs: Stubs; warnings: string[] } {
  const accepted: Stubs = {};
  const warnings: string[] = [];

  for (const name of Object.keys(stubs).sort()) {
    if (!replaceableTemplates.includes(name)) {
      warnings.push(
        `stub ${name}: ignorado; só substituem templates da camada gerada (${replaceableTemplates.join(", ")}). ` +
          `Para mudar uma classe final, use os hooks em PHP.`,
      );
      continue;
    }

    validateStub(name, stubs[name]);
    accepted[name] = stubs[name];

    const published = hashes[name];
    if (published !== undefined && published !== embeddedHash(name)) {
      warnings.push(
        `stub ${name}: foi publicado a partir de uma versão anterior do template embutido; ` +
          `compare com "crudmaker stubs:publish ${name} --out <pasta temporária>" e, depois de incorporar a mudança, ` +
          `rode "crudmaker stubs:publish ${name} --refresh-lock".`,
      );
    }
  }

  return { stubs: accepted, warnings };
}
