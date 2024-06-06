import { ModelFile, ResourceFile, CollectionFile, ControllerFile, RequestFile, MigrationFile, ObserverFile } from "./fileCreators"
import { Entity } from "./models/Entity";
import { Manifest } from "./models/Manifest";
import { ManifestEntity } from "./types";
import fs from "fs";

const manifestObj = JSON.parse(fs.readFileSync(
  "./generated/une-api/laravel/manifest.json",
  { encoding: "utf8" }
));

const manifestClass = new Manifest(manifestObj)

manifestClass.lockManifest();
console.log(manifestClass.entities['user'].fields);


for (const key in manifestClass.entities) {
  const manifestEntity = manifestClass.entities[key];
  
  const entity = new Entity(key, manifestEntity);
  
  const modelFileClass = new ModelFile(entity, manifestClass.pkgCode, manifestClass.systemCode);
  const resourceFileClass = new ResourceFile(entity, manifestClass.pkgCode, manifestClass.systemCode);
  const collectionFileClass = new CollectionFile(entity, manifestClass.pkgCode, manifestClass.systemCode);
  const controllerFileClass = new ControllerFile(entity, manifestClass.pkgCode, manifestClass.systemCode);
  const requestFileClass = new RequestFile(entity, manifestClass.pkgCode, manifestClass.systemCode);
  const migrationFileClass = new MigrationFile(entity, manifestClass.pkgCode, manifestClass.systemCode);
  const observerFileClass = new ObserverFile(entity, manifestClass.pkgCode, manifestClass.systemCode);

  //

  modelFileClass.mountAndWriteFile();
  resourceFileClass.mountAndWriteFile();
  collectionFileClass.mountAndWriteFile();
  controllerFileClass.mountAndWriteFile();
  requestFileClass.mountAndWriteFile();
  migrationFileClass.mountAndWriteFile();
  observerFileClass.mountAndWriteFile();
}
