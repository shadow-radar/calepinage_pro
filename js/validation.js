// ============================================================
//  VALIDATION — contrôle de cohérence des façades + utilitaires
//  (dépend de materiaux.js — doit être chargé AVANT ce fichier)
// ============================================================

function validerFacade(f) {
  var errors   = [];
  var warnings = [];

  // Dimensions de base
  if (!f.larg || f.larg <= 0) errors.push('La largeur (bas) doit être supérieure à 0');
  if (!f.hg   || f.hg   <= 0) errors.push('La hauteur gauche doit être supérieure à 0');
  if (!f.hd   || f.hd   <= 0) errors.push('La hauteur droite doit être supérieure à 0');

  // Champs spécifiques pignon
  if (f.type === 'pignon') {
    if (!f.largHG || f.largHG <= 0) errors.push('La largeur haut gauche doit être supérieure à 0');
    if (!f.largHD || f.largHD <= 0) errors.push('La largeur haut droite doit être supérieure à 0');
    if (!f.hc     || f.hc     <= 0) errors.push('La hauteur au faîtage doit être supérieure à 0');
  }

  // Matériau : famille/sous-type doivent exister dans le catalogue
  var mat = getMateriau(f.famille, f.sousType);
  if (!mat) {
    errors.push('Matériau non reconnu (famille/sous-type invalide)');
  }

  // Lame
  if (!f.lu || f.lu <= 0) errors.push('La longueur de lame doit être supérieure à 0');
  if (!f.hu || f.hu <= 0) errors.push('La largeur de lame doit être supérieure à 0');
  if (f.joint == null || f.joint < 0) errors.push('Le joint ne peut pas être négatif');

  // Ouvertures : cohérence par rapport à la façade
  var hauteurMax = Math.max(f.hg || 0, f.hd || 0, f.hc || 0);
  if (f.ouvertures && f.ouvertures.length > 0) {
    f.ouvertures.forEach(function(o, i) {
      if (!o.larg || o.larg <= 0 || !o.haut || o.haut <= 0) {
        errors.push('Ouverture #' + (i + 1) + ' : dimensions invalides');
      }
      if (f.larg && (o.x + o.larg) > f.larg) {
        warnings.push('Ouverture #' + (i + 1) + ' : dépasse la largeur de la façade');
      }
      if (hauteurMax && (o.y + o.haut) > hauteurMax) {
        warnings.push('Ouverture #' + (i + 1) + ' : dépasse la hauteur de la façade');
      }
    });
  }

  // Avertissements non bloquants
  if (f.joint === 0) {
    warnings.push('Joint à 0 mm : pensez à la dilatation du matériau');
  }
  if (mat && mat.famille === 'metallique' && !f.coteVent) {
    warnings.push('Côté vent non renseigné (bardage métallique)');
  }
  if (!f.antiRongeur || f.antiRongeur <= 0) {
    warnings.push('Anti-rongeur non renseigné');
  }
  if (!f.lameAir || f.lameAir <= 0) {
    warnings.push('Lame d\'air non renseignée');
  }

  return {
    valid:    errors.length === 0,
    errors:   errors,
    warnings: warnings
  };
}

// --- Copie profonde d'un objet/tableau (facades, projet, résultats…) ---
function deepClone(obj) {
  if (obj == null) return obj;
  try {
    if (typeof structuredClone === 'function') return structuredClone(obj);
  } catch (e) { /* fallback ci-dessous */ }
  return JSON.parse(JSON.stringify(obj));
}

if (typeof window !== 'undefined') {
  window.validerFacade = validerFacade;
  window.deepClone      = deepClone;
}
