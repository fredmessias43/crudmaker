type EnumType = {
  type: "enum",
  enumItems: string[]
}
type UuidType = "uuid";
type StringType = "string";
type DateType = "date";
type DoubleType = "double";
type IntegerType = "integer";

type FieldType = {
  [name: string]: UuidType | StringType | DateType | DoubleType | IntegerType | EnumType
}

type RelationshipType = {
  [key in "belongsTo" | "hasMany" | "hasOne"]: string[];
};


export class ManifestObject {
  public fields: FieldType;
  public relationship = 
  
  constructor() {
    
  }
}