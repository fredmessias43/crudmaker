import { ModelFile, ResourceFile, CollectionFile, ControllerFile, RequestFile, MigrationFile } from "./fileCreators"
import { Entity } from "./models/Entity";
import { Manifest } from "./models/ManifestObject";
import { ManifestEntity } from "./types";
import fs from "fs";

const manifestObj = JSON.parse(fs.readFileSync(
  "./generated/fredmessias/manifest.json",
  { encoding: "utf8" }
));

const manifestClass = new Manifest(manifestObj)

manifestClass.lockManifest();

for (const key in manifestClass.entities) {
  const manifestEntity = manifestClass.entities[key];
  
  const entity = new Entity(key, manifestEntity);
  
  const modelFileClass = new ModelFile(entity);
  const resourceFileClass = new ResourceFile(entity);
  const collectionFileClass = new CollectionFile(entity);
  const controllerFileClass = new ControllerFile(entity);
  const requestFileClass = new RequestFile(entity);
  const migrationFileClass = new MigrationFile(entity);

  //

  modelFileClass.mountAndWriteFile();
  resourceFileClass.mountAndWriteFile();
  collectionFileClass.mountAndWriteFile();
  controllerFileClass.mountAndWriteFile();
  requestFileClass.mountAndWriteFile();
  migrationFileClass.mountAndWriteFile();
}
