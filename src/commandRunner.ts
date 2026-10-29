import { spawnSync } from "child_process";

export type RunOptions = {
  /** Diretório de trabalho do processo. */
  cwd?: string;
  /** `inherit`: a saída aparece em tempo real no terminal; `pipe`: é capturada (padrão). */
  stdio?: "inherit" | "pipe";
};

export type RunResult = {
  /** Código de saída; `null` se o processo nem chegou a rodar (ex.: programa não encontrado). */
  status: number | null;
  stdout: string;
  stderr: string;
  /** Erro ao iniciar o processo (ex.: `ENOENT` quando o `docker` não está instalado). */
  error?: NodeJS.ErrnoException;
};

/**
 * Único ponto por onde o crudmaker executa programas externos (hoje, só o `docker`).
 * É uma interface para os testes trocarem a implementação real por uma falsa, que só registra as chamadas.
 */
export interface CommandRunner {
  run(command: string, args: string[], options?: RunOptions): RunResult;
}

/**
 * Implementação real. Usa `spawnSync` com stdio herdado: o processo escreve direto no terminal do usuário,
 * então a saída do composer/artisan aparece em tempo real, mesmo com a chamada bloqueando até o fim.
 */
export const spawnRunner: CommandRunner = {
  run(command, args, options = {}) {
    const stdio = options.stdio ?? "pipe";
    const result = spawnSync(command, args, { cwd: options.cwd, stdio, encoding: "utf8" });
    return {
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      error: result.error as NodeJS.ErrnoException | undefined,
    };
  },
};
