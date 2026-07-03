// ============================================================
//  PROJET — métadonnées, versions, logo
// ============================================================

var projet = {
  nom: 'Chantier BNA',
  client: '',
  chantier: '',
  numero: '',
  dateDebut: null,
  dateFinPrevue: null,
  notes: '',
  logo: 'img/logo-bna.png' // chemin vers le logo
};

var versions = [];
var currentVersionKey = null;

// --- Sauvegarder une version ---
function sauvegarderVersion(nomVersion) {
  var version = {
    projet: projet,
    facades: facades,
    resultats: resFacades,
    version: nomVersion || 'v' + new Date().toISOString().slice(0,10),
    savedAt: new Date().toISOString()
  };
  
  var key = 'calepinage_version_' + Date.now();
  localStorage.setItem(key, JSON.stringify(version));
  
  // Mettre à jour la liste des versions
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  list.push(key);
  localStorage.setItem('calepinage_versions', JSON.stringify(list));
  
  showToast('💾 Version sauvegardée : ' + version.version);
}

// --- Charger une version ---
function chargerVersion(key) {
  var data = JSON.parse(localStorage.getItem(key));
  if (!data) return;
  
  projet = data.projet || projet;
  facades = data.facades || [];
  resFacades = data.resultats || [];
  currentVersionKey = key;
  
  renderFacades();
  updateDashboard();
  afficherMetreTotal();
  showToast('📂 Version chargée : ' + data.version);
}

// --- Lister les versions disponibles ---
function listerVersions() {
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  return list.map(function(key) {
    var data = JSON.parse(localStorage.getItem(key));
    return {
      key: key,
      version: data ? data.version : 'inconnue',
      date: data ? new Date(data.savedAt).toLocaleDateString('fr-FR') : '?'
    };
  });
}

// --- Supprimer une version ---
function supprimerVersion(key) {
  localStorage.removeItem(key);
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  list = list.filter(function(k) { return k !== key; });
  localStorage.setItem('calepinage_versions', JSON.stringify(list));
  showToast('🗑️ Version supprimée');
}

// --- Charger le dernier projet au démarrage ---
function chargerDernierProjet() {
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  if (list.length > 0) {
    var last = list[list.length - 1];
    chargerVersion(last);
  }
}
