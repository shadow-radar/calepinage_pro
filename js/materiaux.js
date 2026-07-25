// ============================================================
//  MATÉRIAUX — catalogue basé sur la grille de prix
//  Secteur Gironde (33) — 2026 (brouillon, estimations à affiner)
// ============================================================
//
// Structure : CATALOGUE_MATERIAUX[famille].sousTypes[code] = {...}
//
// Chaque sous-type porte :
//  - label        : nom affiché
//  - prixMin/Max/Moyen : €/m² fourni+posé TTC (indicatif)
//  - typePose     : texte descriptif (clips, cloué, fixations cachées...)
//  - complexite   : simple / moyenne / complexe
//  - fixation     : 'clips' | 'vis' | 'cloue'   (utilisé par calcul.js)
//  - tauxChute    : coefficient de chute forfaitaire (ex: 0.05 = 5%)
//  - luDefaut/huDefaut : dimensions de lame par défaut en mm (modifiables par l'utilisateur)
//  - jointDefaut  : joint de pose par défaut en mm

var CATALOGUE_MATERIAUX = {

  metallique: {
    label: '🔩 Métallique',
    sousTypes: {
      tole_simple: {
        label: 'Tôle simple (acier/alu)',
        prixMin: 30, prixMax: 45, prixMoyen: 38,
        typePose: 'Simple / double peau', complexite: 'simple',
        fixation: 'vis', tauxChute: 0.03,
        luDefaut: 1000, huDefaut: 200, jointDefaut: 0
      },
      tole_double_peau: {
        label: 'Tôle double peau (bac acier isolé)',
        prixMin: 55, prixMax: 100, prixMoyen: 78,
        typePose: 'Double peau ITE', complexite: 'moyenne',
        fixation: 'vis', tauxChute: 0.03,
        luDefaut: 1000, huDefaut: 200, jointDefaut: 0
      },
      cassette: {
        label: 'Cassette métallique',
        prixMin: 100, prixMax: 180, prixMoyen: 140,
        typePose: 'Fixations cachées', complexite: 'complexe',
        fixation: 'clips', tauxChute: 0.05,
        luDefaut: 1200, huDefaut: 300, jointDefaut: 8
      }
    }
  },

  sandwich: {
    label: '🧊 Panneau sandwich',
    sousTypes: {
      '30': { label: '30 mm — Abri, bardage léger',      prixMin: 30,  prixMax: 60,  prixMoyen: 45,  typePose: 'Fixations visibles', complexite: 'simple',  fixation: 'vis', tauxChute: 0.04, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 },
      '40': { label: '40 mm — Industriel léger',          prixMin: 40,  prixMax: 55,  prixMoyen: 48,  typePose: 'Fixations visibles', complexite: 'simple',  fixation: 'vis', tauxChute: 0.04, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 },
      '60': { label: '60 mm — Commercial',                prixMin: 50,  prixMax: 80,  prixMoyen: 65,  typePose: 'Fixations visibles/cachées', complexite: 'simple_moyenne', fixation: 'vis', tauxChute: 0.04, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 },
      '80': { label: '80 mm — Usine / Entrepôt',          prixMin: 60,  prixMax: 85,  prixMoyen: 73,  typePose: 'Fixations visibles/cachées', complexite: 'simple_moyenne', fixation: 'vis', tauxChute: 0.04, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 },
      '100': { label: '100 mm — Haute isolation',         prixMin: 70,  prixMax: 100, prixMoyen: 85,  typePose: 'Fixations cachées', complexite: 'moyenne', fixation: 'clips', tauxChute: 0.05, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 },
      '120': { label: '120 mm — Frigorifique',            prixMin: 80,  prixMax: 95,  prixMoyen: 88,  typePose: 'Fixations cachées', complexite: 'moyenne', fixation: 'clips', tauxChute: 0.05, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 },
      '150': { label: '150 mm — Laboratoire / Data center', prixMin: 95, prixMax: 120, prixMoyen: 108, typePose: 'Fixations cachées', complexite: 'complexe', fixation: 'clips', tauxChute: 0.06, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 },
      '200': { label: '200 mm — Isolation maximale',      prixMin: 120, prixMax: 250, prixMoyen: 185, typePose: 'Fixations cachées', complexite: 'complexe', fixation: 'clips', tauxChute: 0.06, luDefaut: 1000, huDefaut: 1000, jointDefaut: 0 }
    }
  },

  composite: {
    label: '🟩 Composite',
    sousTypes: {
      entree: {
        label: 'Entrée de gamme',
        prixMin: 50, prixMax: 70, prixMoyen: 60,
        typePose: 'Clips / languette', complexite: 'simple',
        fixation: 'clips', tauxChute: 0.05,
        luDefaut: 1300, huDefaut: 200, jointDefaut: 8
      },
      milieu: {
        label: 'Milieu de gamme',
        prixMin: 70, prixMax: 90, prixMoyen: 80,
        typePose: 'Clips / languette', complexite: 'simple_moyenne',
        fixation: 'clips', tauxChute: 0.05,
        luDefaut: 1300, huDefaut: 200, jointDefaut: 8
      },
      haut: {
        label: 'Haut de gamme',
        prixMin: 100, prixMax: 120, prixMoyen: 110,
        typePose: 'Clips premium', complexite: 'moyenne',
        fixation: 'clips', tauxChute: 0.05,
        luDefaut: 1300, huDefaut: 200, jointDefaut: 8
      }
    }
  },

  bois: {
    label: '🌲 Bois naturel',
    sousTypes: {
      pin_epicea:      { label: 'Pin / Épicéa (à traiter)',     prixMin: 30,  prixMax: 60,  prixMoyen: 45,  typePose: 'Cloué / vissé', complexite: 'simple',  fixation: 'cloue', tauxChute: 0.07, luDefaut: 4000, huDefaut: 120, jointDefaut: 5 },
      douglas:         { label: 'Douglas',                       prixMin: 60,  prixMax: 80,  prixMoyen: 70,  typePose: 'Cloué / vissé', complexite: 'simple_moyenne', fixation: 'cloue', tauxChute: 0.07, luDefaut: 4000, huDefaut: 120, jointDefaut: 5 },
      meleze:          { label: 'Mélèze',                        prixMin: 85,  prixMax: 120, prixMoyen: 103, typePose: 'Cloué / vissé', complexite: 'moyenne', fixation: 'cloue', tauxChute: 0.07, luDefaut: 4000, huDefaut: 120, jointDefaut: 5 },
      pin_nord_thermo: { label: 'Pin du Nord Thermo',            prixMin: 65,  prixMax: 120, prixMoyen: 93,  typePose: 'Cloué / vissé', complexite: 'moyenne', fixation: 'cloue', tauxChute: 0.07, luDefaut: 4000, huDefaut: 120, jointDefaut: 5 },
      red_cedar:       { label: 'Red Cedar (haut de gamme)',     prixMin: 150, prixMax: 450, prixMoyen: 300, typePose: 'Cloué / vissé', complexite: 'moyenne_complexe', fixation: 'cloue', tauxChute: 0.08, luDefaut: 4000, huDefaut: 120, jointDefaut: 5 },
      bois_brule:      { label: 'Bois brûlé (Shou Sugi Ban)',    prixMin: 150, prixMax: 270, prixMoyen: 210, typePose: 'Cloué / vissé', complexite: 'moyenne_complexe', fixation: 'cloue', tauxChute: 0.08, luDefaut: 4000, huDefaut: 120, jointDefaut: 5 }
    }
  },

  fibrociment: {
    label: '⬜ Fibrociment',
    sousTypes: {
      standard:        { label: 'Finition standard',            prixMin: 80,  prixMax: 160, prixMoyen: 120, typePose: 'Fixations mécaniques', complexite: 'simple_moyenne', fixation: 'vis', tauxChute: 0.07, luDefaut: 3000, huDefaut: 190, jointDefaut: 8 },
      lisse_premium:   { label: 'Finition lisse premium',        prixMin: 120, prixMax: 200, prixMoyen: 160, typePose: 'Fixations cachées',   complexite: 'moyenne', fixation: 'clips', tauxChute: 0.07, luDefaut: 3000, huDefaut: 190, jointDefaut: 8 },
      anti_corrosion:  { label: 'Finition anti-corrosion (bord de mer)', prixMin: 160, prixMax: 300, prixMoyen: 230, typePose: 'Fixations inox spéciales', complexite: 'complexe', fixation: 'vis', tauxChute: 0.08, luDefaut: 3000, huDefaut: 190, jointDefaut: 8 }
    }
  }
};

// --- Helpers ---

// Retourne les infos d'un sous-type précis, ou null si inconnu
function getMateriau(famille, sousType) {
  var fam = CATALOGUE_MATERIAUX[famille];
  if (!fam) return null;
  var st = fam.sousTypes[sousType];
  if (!st) return null;
  return Object.assign({ famille: famille, sousType: sousType, familleLabel: fam.label }, st);
}

// Retourne la liste des familles pour peupler un <select>
function listerFamilles() {
  return Object.keys(CATALOGUE_MATERIAUX).map(function(key) {
    return { code: key, label: CATALOGUE_MATERIAUX[key].label };
  });
}

// Retourne la liste des sous-types d'une famille pour peupler un <select> dépendant
function listerSousTypes(famille) {
  var fam = CATALOGUE_MATERIAUX[famille];
  if (!fam) return [];
  return Object.keys(fam.sousTypes).map(function(key) {
    return { code: key, label: fam.sousTypes[key].label };
  });
}

if (typeof window !== 'undefined') {
  window.CATALOGUE_MATERIAUX = CATALOGUE_MATERIAUX;
  window.getMateriau          = getMateriau;
  window.listerFamilles       = listerFamilles;
  window.listerSousTypes      = listerSousTypes;
}
