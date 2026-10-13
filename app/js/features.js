/* Bivvo Fase 7 — chaves de segurança para desligar módulos sem afetar o núcleo. */
export const FEATURES = Object.freeze({ assistant:true, family:true, growthCenter:true, smartImport:true, clientErrorTracking:true });
export const featureOn = name => FEATURES[name] !== false;
