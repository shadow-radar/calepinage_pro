// ============================================================
//  MÉTÉO — front-end
//  Dépend de api.js (apiGetMeteo) — doit être chargé AVANT ce fichier
//  Seuils vert/orange/rouge : brouillon, à affiner avec Gaël
// ============================================================

// --- Classifie un jour météo en statut vert/orange/rouge ---
function classifierJour(jour) {
  if (!jour) return { statut: 'inconnu', label: '❔', couleur: '#94a3b8' };

  var pluieForte  = jour.precipitation >= 5;
  var pluieLegere = jour.precipitation > 0 && jour.precipitation < 5;
  var ventFort    = jour.vent >= 60 || jour.rafales >= 70;
  var ventModere  = jour.vent >= 40 && jour.vent < 60;
  var tempExtreme = jour.tempMax > 40 || jour.tempMin < 0;
  var tempLimite  = (jour.tempMax >= 35 && jour.tempMax <= 40) || (jour.tempMin >= 0 && jour.tempMin <= 5);

  if (pluieForte || ventFort || tempExtreme) {
    return { statut: 'rouge', label: '🔴', couleur: '#ef4444' };
  }
  if (pluieLegere || ventModere || tempLimite) {
    return { statut: 'orange', label: '🟠', couleur: '#f97316' };
  }
  return { statut: 'vert', label: '🟢', couleur: '#22c55e' };
}

// --- Charge la météo pour l'adresse du chantier et classe chaque jour ---
async function chargerMeteoChantier(adresse) {
  if (!adresse) return null;
  var data = await apiGetMeteo(adresse);
  if (!data || !data.jours) return null;
  data.jours.forEach(function(j) { j.statut = classifierJour(j); });
  return data;
}

// --- Affiche le chip météo du jour dans le dashboard ---
function afficherMeteoDashboard(meteoData) {
  var el = document.getElementById('meteoChip');
  if (!el) return;

  if (!meteoData || !meteoData.jours || !meteoData.jours[0]) {
    el.innerHTML = '<span class="meteo-chip meteo-inconnu">❔ Météo indisponible</span>';
    return;
  }

  var j = meteoData.jours[0];
  el.innerHTML =
    '<span class="meteo-chip meteo-' + j.statut.statut + '">' +
      j.statut.label + ' ' + Math.round(j.tempMax) + '°C · ' + j.conditions +
    '</span>';
  el.title = meteoData.resume ? meteoData.resume.message : '';
}

// --- Retourne le statut météo (vert/orange/rouge) pour une date donnée (YYYY-MM-DD) ---
// Utilisé par le planning pour colorer chaque étape (métré/prép/pose/réception)
function meteoPourDate(meteoData, dateStr) {
  if (!meteoData || !meteoData.jours || !dateStr) return null;
  var jour = meteoData.jours.find(function(j) { return j.date === dateStr; });
  return jour ? jour.statut : null;
}

if (typeof window !== 'undefined') {
  window.classifierJour        = classifierJour;
  window.chargerMeteoChantier   = chargerMeteoChantier;
  window.afficherMeteoDashboard = afficherMeteoDashboard;
  window.meteoPourDate          = meteoPourDate;
}
