/** Manifest de exemplo criado por `crudmaker init` (formato descrito em docs/manifest.md). */
export const exampleManifest = {
  system: { title: "Minha API", code: "minha-api" },
  pkg: {
    code: "minha-api",
    entities: {
      client: {
        fields: {
          id: "uuid",
          name: "string",
          email: { type: "string", unique: true },
          notes: { type: "text", required: false },
          status: { type: "enum", enumItems: ["active", "blocked"] },
        },
        relationships: {
          hasMany: ["order"],
        },
      },
      order: {
        fields: {
          id: "uuid",
          total: "double",
          paid: "boolean",
        },
        relationships: {
          belongsTo: ["client"],
        },
      },
    },
  },
};

export const exampleManifestText = JSON.stringify(exampleManifest, null, 2) + "\n";
