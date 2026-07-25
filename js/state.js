// ============================================================
//  STATE — données partagées
//  (dépend de materiaux.js — doit être chargé AVANT ce fichier)
// ============================================================
var facades       = [];
var resFacades    = [];
var currentVisu   = 0;
var facadeCounter = 0;

// Matériau par défaut pour une nouvelle façade
var FAMILLE_DEFAUT   = 'composite';
var SOUS_TYPE_DEFAUT = 'milieu';

function newFacade() {
  facadeCounter++;
  var mat = getMateriau(FAMILLE_DEFAUT, SOUS_TYPE_DEFAUT) || {
    luDefaut: 1300, huDefaut: 200, jointDefaut: 8
  };

  return {
    id:          Date.now(),
    num:         facadeCounter,
    nom:         '',
    type:        'facade',      // 'facade' | 'pignon'
    larg:        8000,
    largHG:      8000,
    largHD:      8000,
    hg:          4000,
    hd:          4000,
    hc:          6000,
    ouvertures:  [],

    // --- Matériau ---
    famille:     FAMILLE_DEFAUT,
    sousType:    SOUS_TYPE_DEFAUT,
    lu:          mat.luDefaut,    // longueur lame (horizontal)
    hu:          mat.huDefaut,    // largeur lame  (vertical)
    joint:       mat.jointDefaut,

    // --- Pose ---
    lameAir:     25,
    antiRongeur: 300,
    formatPP:    '25',
    zoneVent:    'normale',
    coteVent:    'gauche'
  };
}

// Applique les valeurs par défaut du matériau choisi à une façade existante.
// Appelé quand l'utilisateur change famille/sous-type dans le formulaire.
function appliquerMateriau(f, famille, sousType) {
  var mat = getMateriau(famille, sousType);
  if (!mat) return f;
  f.famille  = famille;
  f.sousType = sousType;
  f.lu       = mat.luDefaut;
  f.hu       = mat.huDefaut;
  f.joint    = mat.jointDefaut;
  return f;
}

function nomFacade(f) {
  return f.nom || ('Façade ' + f.num);
}

if (typeof window !== 'undefined') {
  window.newFacade         = newFacade;
  window.appliquerMateriau = appliquerMateriau;
  window.nomFacade         = nomFacade;
}
