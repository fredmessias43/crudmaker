export type UuidType = "uuid";
export type StringType = "string";
export type DateType = "date";
export type DoubleType = "double";
export type IntegerType = "integer";
export type EnumType = {
  type: "enum",
  enumItems: string[]
}

export type FieldType = {
  [key: string]: UuidType | StringType | DateType | DoubleType | IntegerType | EnumType
}

export type RelationshipKeys = "belongsTo" | "hasMany" | "hasOne";
export type RelationshipType = {
  [key in RelationshipKeys]?: string[];
};

export type IndexType = {
  type: string,
  fields: string | string[]
}

export type ManifestObject = {
  fields: FieldType,
  relationship: RelationshipType,
  indexes: IndexType[],
}