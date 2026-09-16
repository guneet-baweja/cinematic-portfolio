import { extend, type ThreeElement } from "@react-three/fiber";
import * as THREE from "three";
import { HudMaterial } from "./hudMaterial";
import { DistortionMaterial } from "./imageDistortion";
import { PrismMaterial } from "./prismMaterial";
import {
  Portrait25DMaterial,
  IrisApertureMaterial,
  SynapseMaterial,
  BloodstreamMaterial,
} from "./genesisShaders";

extend({
  HudMaterial,
  DistortionMaterial,
  PrismMaterial,
  ThreeLine: THREE.Line,
  Portrait25DMaterial,
  IrisApertureMaterial,
  SynapseMaterial,
  BloodstreamMaterial,
});

declare module "@react-three/fiber" {
  interface ThreeElements {
    hudMaterial: ThreeElement<typeof HudMaterial>;
    distortionMaterial: ThreeElement<typeof DistortionMaterial>;
    prismMaterial: ThreeElement<typeof PrismMaterial>;
    threeLine: ThreeElement<typeof THREE.Line>;
    portrait25DMaterial: ThreeElement<typeof Portrait25DMaterial>;
    irisApertureMaterial: ThreeElement<typeof IrisApertureMaterial>;
    synapseMaterial: ThreeElement<typeof SynapseMaterial>;
    bloodstreamMaterial: ThreeElement<typeof BloodstreamMaterial>;
  }
}

