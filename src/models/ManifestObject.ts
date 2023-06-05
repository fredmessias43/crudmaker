type EnumType = {
  type: "enum",
  enumItems: string[]
}
type UuidType = "uuid";
type StringType = "string";
type DateType = "date";
type DoubleType = "double";
type IntegerType = "integer";

type Field = {
  [name: string]: UuidType | StringType | DateType | DoubleType | IntegerType | EnumType
}

type Relationship = {
  [key in "belongsTo" | "hasMany" | "hasOne"]: string[];
};


export type ManifestObject = {
  fields: Field;
  relationship: Relationship;
}