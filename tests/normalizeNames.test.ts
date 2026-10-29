import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate";
import { buildJsonSchema } from "../src/manifestSchema";
import { normalizeEntityName, normalizeFieldName } from "../src/normalizeNames";
import { ManifestValidationError } from "../src/validateManifest";

const now = new Date(2025, 0, 2, 3, 4, 5);
const fixturesDir = path.join(__dirname, "fixtures");

const loadManifest = (name: string) => JSON.parse(fs.readFileSync(path.join(fixturesDir, name, "manifest.json"), "utf8"));
const gen = (manifest: any, normalizeNames?: boolean) => generate(manifest, { now, existingMigrations: [], normalizeNames });
const lockOf = (manifest: any, normalizeNames?: boolean) =>
  JSON.parse(gen(manifest, normalizeNames).files.find((file) => file.path === "manifest-lock.json")!.content);
const contentOf = (manifest: any, p: string, normalizeNames?: boolean) =>
  gen(manifest, normalizeNames).files.find((file) => file.path === p)!.content;

function manifestWith(entities: any, pkgExtra: object = {}): any {
  return { system: { code: "s" }, pkg: { code: "p", entities, ...pkgExtra } };
}

function problemsOf(manifest: any, normalizeNames?: boolean) {
  try {
    gen(manifest, normalizeNames);
  } catch (e) {
    expect(e).toBeInstanceOf(ManifestValidationError);
    return (e as ManifestValidationError).problems;
  }
  throw new Error("deveria falhar");
}

describe("regras de nome", () => {
  it.each([
    ["awards", "award"],
    ["drawn_numbers", "drawnNumber"],
    ["player_invite", "playerInvite"],
    ["PlayerInvite", "playerInvite"],
    ["PlayerInvites", "playerInvite"],
    ["client", "client"],
    ["orderItem", "orderItem"],
    ["status", "status"],
    ["class", "class"],
  ])("entidade %s → %s", (from, to) => {
    expect(normalizeEntityName(from)).toBe(to);
    expect(normalizeEntityName(to)).toBe(to); // idempotente
  });

  it.each([
    ["alertDate", "alert_date"],
    ["alert_date", "alert_date"],
    ["AlertDate", "alert_date"],
    ["id", "id"],
    ["max_players", "max_players"],
  ])("campo %s → %s", (from, to) => {
    expect(normalizeFieldName(from)).toBe(to);
  });
});

describe("avisos e nomes normalizados", () => {
  it("campo em camelCase vira snake_case nas chaves, no name e nas colunas", () => {
    const m = manifestWith({
      alert: { fields: { id: "uuid", alertDate: "datetime", sentAt: { type: "datetime", name: "sentAt" }, other: { type: "string", name: "otherName" } } },
    });
    const { files, warnings } = gen(m);

    expect(warnings).toEqual([
      "pkg.entities.alert.fields.alertDate → alert_date",
      "pkg.entities.alert.fields.sentAt → sent_at",
      "pkg.entities.alert.fields.sentAt.name → sent_at",
      "pkg.entities.alert.fields.other.name → other_name",
    ]);
    const lock = JSON.parse(files[0].content);
    expect(Object.keys(lock.entities.alert.fields)).toEqual(["id", "alert_date", "sent_at", "other"]);
    expect(lock.entities.alert.fields.other.name).toBe("other_name");
    expect(files.find((f) => f.path.endsWith("create_alerts_table.php"))!.content).toContain("$table->datetime('alert_date')");
  });

  it("referências em forma de objeto (entity e field explícitos) são normalizadas", () => {
    const m = manifestWith({
      orders: { fields: { id: "uuid" }, relationships: { hasMany: [{ entity: "order_items" }] } },
      order_items: { fields: { id: "uuid", orderId: "uuid" }, relationships: { belongsTo: [{ entity: "orders", field: "orderId" }] } },
    });
    const { warnings } = gen(m);

    expect(new Set(warnings)).toEqual(new Set([
      "pkg.entities.orders.relationships.hasMany[0].entity: order_items → orderItem",
      "pkg.entities.orders → order",
      "pkg.entities.order_items.fields.orderId → order_id",
      "pkg.entities.order_items.relationships.belongsTo[0].entity: orders → order",
      "pkg.entities.order_items.relationships.belongsTo[0].field: orderId → order_id",
      "pkg.entities.order_items → orderItem",
    ]));

    const lock = lockOf(m);
    expect(Object.keys(lock.entities)).toEqual(["order", "orderItem"]);
    expect(lock.entities.orderItem.fields.order_id.relationship).toBe(true);
    expect(lock.entities.orderItem.fields.order_id.type).toBe("uuid");
  });

  it("não avisa nem muda nada quando os nomes já seguem a convenção", () => {
    const m = manifestWith({ client: { fields: { id: "uuid", email: "string" } } });
    expect(gen(m).warnings).toEqual([]);
    expect(gen(m, false).warnings).toEqual([]);
  });

  it("uma entidade inexistente é validada com o nome normalizado e o caminho original", () => {
    const m = manifestWith({
      games: { fields: { id: "uuid" }, relationships: { hasMany: ["awards", "ghosts"] } },
      award: { fields: { id: "uuid" } },
    });

    expect(problemsOf(m)).toEqual([{
      path: "pkg.entities.games.relationships.hasMany[1]",
      message: expect.stringContaining('entidade "ghost" não existe em pkg.entities (entidades: game, award)'),
    }]);
  });

  it("a referência plural passa a valer quando a entidade só existe no singular (awards → award)", () => {
    const m = manifestWith({
      game: { fields: { id: "uuid" }, relationships: { hasMany: ["awards"] } },
      award: { fields: { id: "uuid" } },
    });

    expect(() => gen(m)).not.toThrow();
    // desligada, "awards" não existe: o comportamento antigo (erro) continua
    expect(problemsOf(m, false)[0].message).toContain('entidade "awards" não existe');
  });
});

describe("FK derivada com snake_case", () => {
  const m = manifestWith({
    course: { fields: { id: "uuid" }, relationships: { hasMany: ["course_content"] } },
    course_content: { fields: { id: "uuid" }, relationships: { belongsTo: ["course"] } },
    note: { fields: { id: "uuid" }, relationships: { belongsTo: ["course_content", { entity: "course_content", field: "other_id" }] } },
  });

  it("belongsTo: [course_content] vira courseContent com FK course_content_id e tabela course_contents", () => {
    const lock = lockOf(m);

    expect(Object.keys(lock.entities)).toEqual(["course", "courseContent", "note"]);
    expect(lock.entities.note.fields.course_content_id).toMatchObject({ type: "uuid", relationship: true });
    expect(lock.entities.note.fields).not.toHaveProperty("courseContent_id");

    const migration = contentOf(m, "database/migrations/2025_01_02_030405_create_notes_table.php");
    expect(migration).toContain("$table->uuid('course_content_id');");
    expect(migration).toContain("->foreign('course_content_id')->references('id')->on('course_contents')");
    expect(gen(m).files.some((f) => f.path === "database/migrations/2025_01_02_030405_create_course_contents_table.php")).toBe(true);
  });

  it("a forma curta com entidade já em camelCase também usa snake_case", () => {
    const camel = manifestWith({
      orderItem: { fields: { id: "uuid" } },
      note: { fields: { id: "uuid" }, relationships: { belongsTo: ["orderItem"] } },
    });
    expect(Object.keys(lockOf(camel).entities.note.fields)).toEqual(["id", "order_item_id"]);
    expect(contentOf(camel, "database/migrations/2025_01_02_030405_create_notes_table.php")).toContain("->on('order_items')");
  });

  it("desligada, a forma curta mantém o comportamento antigo (course_content_id vem do nome sem conversão)", () => {
    const camel = manifestWith({
      orderItem: { fields: { id: "uuid" } },
      note: { fields: { id: "uuid" }, relationships: { belongsTo: ["orderItem"] } },
    });
    expect(Object.keys(lockOf(camel, false).entities.note.fields)).toEqual(["id", "orderItem_id"]);
  });
});

describe("FK declarada à mão e derivada", () => {
  const base = (gameId: any) => manifestWith({
    game: { fields: { id: "uuid" } },
    card: { fields: { id: "uuid", name: "string", game_id: gameId, extra: "string" }, relationships: { belongsTo: ["game"] } },
  });

  it("unifica num campo só, sem aviso, mantendo a posição", () => {
    const { warnings } = gen(base("uuid"));
    const fields = lockOf(base("uuid")).entities.card.fields;

    expect(warnings).toEqual([]);
    expect(Object.keys(fields)).toEqual(["id", "name", "game_id", "extra"]);
    expect(fields.game_id).toEqual({ type: "uuid", name: "game_id", required: true, unique: false, enumItems: [], relationship: true });
  });

  it("vale a declaração explícita (required, unique) completada com relationship", () => {
    const fields = lockOf(base({ type: "uuid", required: false, unique: true })).entities.card.fields;

    expect(fields.game_id).toEqual({ type: "uuid", name: "game_id", required: false, unique: true, enumItems: [], relationship: true });
  });

  it("desligada, o derivado sobrescreve o declarado (comportamento antigo)", () => {
    const fields = lockOf(base({ type: "uuid", required: false, unique: true }), false).entities.card.fields;

    expect(fields.game_id).toEqual({ type: "uuid", name: "game_id", required: true, unique: false, enumItems: [], relationship: true });
  });
});

describe("colisões", () => {
  it("duas entidades que viram o mesmo nome (card + cards)", () => {
    const m = manifestWith({ card: { fields: { id: "uuid" } }, cards: { fields: { id: "uuid" } } });

    expect(problemsOf(m)).toEqual([{
      path: "pkg.entities.cards",
      message: 'o nome vira "card", o mesmo de pkg.entities.card; renomeie uma das entidades',
    }]);
  });

  it("entidades player_invite + PlayerInvite + playerInvites", () => {
    const m = manifestWith({
      player_invite: { fields: { id: "uuid" } },
      PlayerInvite: { fields: { id: "uuid" } },
      playerInvites: { fields: { id: "uuid" } },
    });

    expect(problemsOf(m).map((p) => p.path)).toEqual(["pkg.entities.PlayerInvite", "pkg.entities.playerInvites"]);
  });

  it("dois campos da mesma entidade (alertDate + alert_date)", () => {
    const m = manifestWith({ alert: { fields: { id: "uuid", alertDate: "datetime", alert_date: "datetime" } } });

    expect(problemsOf(m)).toEqual([{
      path: "pkg.entities.alert.fields.alert_date",
      message: 'o nome vira "alert_date", o mesmo de pkg.entities.alert.fields.alertDate; renomeie um dos campos',
    }]);
  });

  it("o mesmo nome de campo em entidades diferentes não colide", () => {
    const m = manifestWith({ a: { fields: { id: "uuid", someDate: "date" } }, b: { fields: { id: "uuid", some_date: "date" } } });
    expect(() => gen(m)).not.toThrow();
  });

  it("junta colisões com outros problemas do manifest (enum sem itens) numa só lista", () => {
    const m = manifestWith({ card: { fields: { id: "uuid", kind: "enum" } }, cards: { fields: { id: "uuid" } } });
    expect(problemsOf(m).map((p) => p.path)).toEqual(["pkg.entities.card.fields.kind", "pkg.entities.cards"]);
  });

  it("com a normalização desligada não há colisão", () => {
    const m = manifestWith({ card: { fields: { id: "uuid" } }, cards: { fields: { id: "uuid" } } });
    expect(() => gen(m, false)).not.toThrow();
  });
});

describe("normalização desligada", () => {
  it("avisa o que está fora da convenção sem alterar nada", () => {
    const m = manifestWith({
      games: { fields: { id: "uuid", maxPlayers: "int", other: { type: "string", name: "otherName" } }, relationships: { hasMany: [{ entity: "cards", field: "cardId" }] } },
      cards: { fields: { id: "uuid" } },
    });
    const { warnings } = gen(m, false);

    expect(warnings).toEqual([
      "pkg.entities.games: fora da convenção (normalização desligada), viraria game",
      "pkg.entities.games.fields.maxPlayers: fora da convenção (normalização desligada), viraria max_players",
      "pkg.entities.games.fields.other.name: fora da convenção (normalização desligada), viraria other_name",
      "pkg.entities.games.relationships.hasMany[0].entity: cards fora da convenção (normalização desligada), viraria card",
      "pkg.entities.games.relationships.hasMany[0].field: cardId fora da convenção (normalização desligada), viraria card_id",
      "pkg.entities.cards: fora da convenção (normalização desligada), viraria card",
    ]);
    const lock = lockOf(m, false);
    expect(Object.keys(lock.entities)).toEqual(["games", "cards"]);
    expect(Object.keys(lock.entities.games.fields)).toEqual(["id", "maxPlayers", "other"]);
  });

  it("pkg.normalizeNames: false no manifest desliga", () => {
    const m = manifestWith({ cards: { fields: { id: "uuid" } } }, { normalizeNames: false });

    expect(Object.keys(lockOf(m).entities)).toEqual(["cards"]);
    expect(gen(m).warnings).toHaveLength(1);
  });

  it("a opção de generate vence o manifest, nos dois sentidos", () => {
    const off = manifestWith({ cards: { fields: { id: "uuid" } } }, { normalizeNames: false });
    const on = manifestWith({ cards: { fields: { id: "uuid" } } }, { normalizeNames: true });

    expect(Object.keys(lockOf(off, true).entities)).toEqual(["card"]);
    expect(Object.keys(lockOf(on, false).entities)).toEqual(["cards"]);
    expect(Object.keys(lockOf(manifestWith({ cards: { fields: { id: "uuid" } } })).entities)).toEqual(["card"]); // padrão: ligada
  });

  it("pkg.normalizeNames precisa ser booleano", () => {
    expect(problemsOf(manifestWith({ a: { fields: { id: "uuid" } } }, { normalizeNames: "nao" }))).toEqual([
      { path: "pkg.normalizeNames", message: "deve ser verdadeiro/falso (true/false), recebido texto" },
    ]);
  });

  it.each(["bingo", "curso", "vende-que-vende-api", "bingo-2"])("fixture %s: desligada gera a mesma saída que o manifest com normalizeNames: false", (name) => {
    const m = loadManifest(name);
    const viaOption = gen(m, false);
    const viaManifest = gen({ ...m, pkg: { ...m.pkg, normalizeNames: false } });

    expect(viaManifest).toEqual(viaOption);
  });
});

describe("generate é pura", () => {
  it("não altera o manifest recebido", () => {
    const m = loadManifest("bingo-2");
    const copy = JSON.parse(JSON.stringify(m));
    gen(m);
    gen(m, false);

    expect(m).toEqual(copy);
  });
});

describe("fixtures antigas com a normalização ligada", () => {
  it("bingo: avisos e entidades no singular", () => {
    const { warnings, files } = gen(loadManifest("bingo"));

    expect(warnings).toContain("pkg.entities.awards → award");
    expect(warnings).toContain("pkg.entities.drawn_numbers → drawnNumber");
    expect(files.map((f) => f.path)).toContain("app/Models/DrawnNumber.php");
    expect(files.find((f) => f.path === "app/Models/Game.php")!.content).toContain("$this->hasMany(Award::class)");
  });

  it("curso: course_content vira courseContent, com FK course_content_id e tabela course_contents; class continua class", () => {
    const m = loadManifest("curso");
    const { warnings, files } = gen(m);

    expect(warnings).toEqual([
      "pkg.entities.course.relationships.hasMany[0]: course_content → courseContent",
      "pkg.entities.course_content → courseContent",
      "pkg.entities.user.relationships.hasMany[0]: user_course → userCourse",
      "pkg.entities.user_course → userCourse",
      "pkg.entities.class.relationships.hasMany[0]: class_lesson → classLesson",
      "pkg.entities.class_lesson → classLesson",
      "pkg.entities.class_lesson.relationships.hasMany[0]: class_lesson_comment → classLessonComment",
      "pkg.entities.class_lesson_comment → classLessonComment",
      "pkg.entities.class_lesson_comment.relationships.hasMany[0]: class_lesson_comment → classLessonComment",
      "pkg.entities.class_lesson_comment.relationships.belongsTo[0]: class_lesson → classLesson",
      "pkg.entities.class_lesson_attendee → classLessonAttendee",
      "pkg.entities.class_lesson_attendee.relationships.belongsTo[0]: class_lesson → classLesson",
    ]);

    const lock = lockOf(m);
    expect(lock.entities).toHaveProperty("courseContent");
    expect(lock.entities).not.toHaveProperty("course_content");
    expect(lock.entities.courseContent.fields.course_id).toBeDefined();

    const paths = files.map((f) => f.path);
    expect(paths.some((p) => p.endsWith("_create_course_contents_table.php"))).toBe(true);
    expect(paths).toContain("app/Models/Class.php");

    // a saída em arquivos é a mesma da normalização desligada: só o lock muda
    const off = gen(m, false).files;
    for (const file of files) {
      if (file.path === "manifest-lock.json") continue;
      expect(off.find((f) => f.path === file.path)?.content, file.path).toBe(file.content);
    }
    expect(files.map((f) => f.path)).toEqual(off.map((f) => f.path));
  });

  it("vende-que-vende-api: alertDate vira alert_date na migration, model e resources", () => {
    const m = loadManifest("vende-que-vende-api");
    const { warnings } = gen(m);

    expect(warnings).toEqual(["pkg.entities.alert.fields.alertDate → alert_date"]);
    expect(contentOf(m, "database/migrations/2025_01_02_030405_create_alerts_table.php")).toContain("$table->datetime('alert_date');");
    expect(contentOf(m, "database/migrations/2025_01_02_030405_create_alerts_table.php", false)).toContain("$table->datetime('alertDate');");
    expect(contentOf(m, "app/Models/Alert.php")).toContain("'alert_date',");
    expect(contentOf(m, "app/Http/Resources/AlertResource.php")).toContain("'alert_date' => $this->alert_date,");
  });
});

describe("JSON Schema", () => {
  it("expõe pkg.normalizeNames, booleano e com descrição", () => {
    const schema: any = buildJsonSchema();
    const prop = schema.properties.pkg.properties.normalizeNames;

    expect(prop.type).toBe("boolean");
    expect(prop.description).toContain("snake_case");
    expect(schema.properties.pkg.required ?? []).not.toContain("normalizeNames");
  });

  it("o arquivo publicado inclui a propriedade (rode `npm run schema` se falhar)", () => {
    const published = JSON.parse(fs.readFileSync(path.join(__dirname, "../schema/manifest.schema.json"), "utf8"));
    expect(published.properties.pkg.properties.normalizeNames.type).toBe("boolean");
  });
});
