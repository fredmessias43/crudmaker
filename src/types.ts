export type RelationshipKeys = "belongsTo" | "hasMany" | "hasOne" | "ownOne" | "ownMany" | "owned";
export type RelationshipValue = {
  entity: string,
  relationship: RelationshipKeys
};
export type Relationships = {
  [key in RelationshipKeys]?: RelationshipValue[];
};

export type Field = {
  type: "uuid" | "string" | "text" | "date" | "datetime" | "double" | "integer" | "boolean" | "json" | "enum",
  name: string,
  required: boolean,
  unique: boolean,
  enumItems: string[]
};

export type Fields = {
  [key: string]: Field
}

export type ManifestEntity = {
  fields: Fields,
  relationships: Relationships,
}

export type ManifestEntities = {
  [key: string]: ManifestEntity
}