export type ObjectType = {
  type: "uuid" | "string" | "date" | "double" | "integer" | "enum",
  required?: boolean,
  enumItems?: string[]
}

export type FieldName = string;
export type FieldType = "uuid" | "string" | "date" | "double" | "integer" | ObjectType;

export type Field = {
  [key: FieldName]: FieldType
}

export type RelationshipKeys = "belongsTo" | "hasMany" | "hasOne";
export type Relationship = {
  [key in RelationshipKeys]?: string[];
};

export type IndexType = {
  type: string,
  fields: string | string[]
}

export type ManifestObject = {
  fields: Field,
  relationship: Relationship,
  indexes: IndexType[],
}

export function isObjectType(value: any): value is ObjectType {
  return value?.constructor === Object && value.hasOwnProperty("type");
}