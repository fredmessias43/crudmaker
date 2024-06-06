export type RelationshipKeys = "belongsTo" | "hasMany" | "hasOne" | "morphTo" |"ownOne" | "ownMany" | "owned" | "morphOne" | "morphMany" | "morphed";
export type RelationshipValue = {
  entity: string,
  field: string,
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
  enumItems: string[],
  relationship?: boolean
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