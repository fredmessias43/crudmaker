import { ModelFile, ResourceFile, CollectionFile, ControllerFile } from "./fileCreators"
import { Entity } from "./models/Entity";
import { ManifestObject } from "./types";

import fs from "fs";

const manifestObject = {
  leaseAgreement: {
    fields: {
      id: "uuid",
      business_id: "string",
      agreement_date: "date",
      start_date: "date",
      end_date: "date",
      amount: "double",
      period_type: {
        type: "enum",
        enumItems: [
          "morning",
          "afternoon",
          "night"
        ]
      }
    },
    relationship: {
      belongsTo: [
        "property",
        "tenant"
      ]
    },
    indexes: [
      {
        type: "unique",
        fields: "business_id"
      }
    ]
  }
};

const entity = new Entity("leaseAgreement", manifestObject["leaseAgreement"] as ManifestObject);

const modelFileClass = new ModelFile(entity);
const modelFileString = modelFileClass.mountFile();
fs.writeFileSync(`./generated/${modelFileClass.className}.php`, modelFileString);

const resourceFileClass = new ResourceFile(entity);
const resourceFileString = resourceFileClass.mountFile();
fs.writeFileSync(`./generated/${resourceFileClass.className}Resource.php`, resourceFileString);

const collectionFileClass = new CollectionFile(entity);
const collectionFileString = collectionFileClass.mountFile();
fs.writeFileSync(`./generated/${collectionFileClass.className}.php`, collectionFileString);

const controllerFileClass = new ControllerFile(entity);
const controllerFileString = controllerFileClass.mountFile();
fs.writeFileSync(`./generated/${controllerFileClass.className}.php`, controllerFileString);