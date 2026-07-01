// ============================================================
//  STATE — données partagées
// ============================================================
var facades      = [];
var resFacades   = [];
var currentVisu  = 0;
var facadeCounter = 0;

function newFacade() {
  facadeCounter++;
  return {
    id:          Date.now(),
    num:         facadeCounter,
    nom:         '',
    type:        'facade',
    larg:        8000,
    largHG:      8000,
    largHD:      8000,
    hg:          4000,
    hd:          4000,
    hc:          6000,
    ouvertures:  [],
    typeMat:     'composite',
    lu:          1300,   // longueur lame (horizontal)
    hu:          200,    // largeur lame  (vertical)
    joint:       8,
    lameAir:     25,
    antiRongeur: 300,
    formatPP:    '25',
    zoneVent:    'normale',
    coteVent:    'gauche'
  };
}

function nomFacade(f) {
  return f.nom || ('Façade ' + f.num);
}
