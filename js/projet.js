// ============================================================
//  PROJET — métadonnées, versions, gestion locale
// ============================================================

var projet = {
  nom:           '',
  client:        '',
  chantier:      '',
  numero:        '',
  dateDebut:     null,
  dateFinPrevue: null,
  notes:         '',
  logo:          'img/logo-bna.png'
};

var versions = [];
var currentVersionKey = null;

// ============================================================
//  VERSIONS LOCALES (localStorage)
// ============================================================

function sauvegarderVersion(nomVersion) {
  var version = {
    projet:    deepClone(projet),
    facades:   deepClone(facades),
    resultats: deepClone(resFacades),
    version:   nomVersion || 'v' + new Date().toISOString().slice(0,10),
    savedAt:   new Date().toISOString()
  };
  var key = 'calepinage_version_' + Date.now();
  localStorage.setItem(key, JSON.stringify(version));
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  list.push(key);
  localStorage.setItem('calepinage_versions', JSON.stringify(list));
  showToast('💾 Version sauvegardée : ' + version.version);
  mettreAJourListeVersions();
}

function chargerVersion(key) {
  var data = JSON.parse(localStorage.getItem(key));
  if (!data) return;
  projet     = data.projet    || projet;
  facades    = data.facades   || [];
  resFacades = data.resultats || [];
  currentVersionKey = key;
  chargerInfosProjet();
  renderFacades();
  updateDashboard();
  afficherMetreTotal();
  showToast('📂 Version chargée : ' + data.version);
}

function listerVersions() {
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  return list.map(function(key) {
    var data = JSON.parse(localStorage.getItem(key));
    return {
      key:     key,
      version: data ? data.version : 'inconnue',
      date:    data ? new Date(data.savedAt).toLocaleDateString('fr-FR') : '?'
    };
  });
}

function supprimerVersion(key) {
  localStorage.removeItem(key);
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  list = list.filter(function(k){ return k !== key; });
  localStorage.setItem('calepinage_versions', JSON.stringify(list));
  showToast('🗑️ Version supprimée');
  mettreAJourListeVersions();
}

function chargerDernierProjet() {
  var list = JSON.parse(localStorage.getItem('calepinage_versions') || '[]');
  if (list.length > 0) chargerVersion(list[list.length - 1]);
}

// ============================================================
//  INFOS PROJET
// ============================================================

function chargerInfosProjet() {
  var el = function(id){ return document.getElementById(id); };
  if (el('projetNom'))      el('projetNom').value      = projet.nom       || '';
  if (el('projetClient'))   el('projetClient').value   = projet.client    || '';
  if (el('projetChantier')) el('projetChantier').value = projet.chantier  || '';
  if (el('projetNumero'))   el('projetNumero').value   = projet.numero    || '';
  if (el('projetNotes'))    el('projetNotes').value    = projet.notes     || '';
  
  var dash = document.getElementById('dashboardProjet');
  if (dash) dash.textContent = projet.nom ? '— ' + projet.nom : '';
}

function enregistrerInfosProjet() {
  var el = function(id){ return document.getElementById(id); };
  projet.nom      = el('projetNom')      ? el('projetNom').value      : projet.nom;
  projet.client   = el('projetClient')   ? el('projetClient').value   : projet.client;
  projet.chantier = el('projetChantier') ? el('projetChantier').value : projet.chantier;
  projet.numero   = el('projetNumero')   ? el('projetNumero').value   : projet.numero;
  projet.notes    = el('projetNotes')    ? el('projetNotes').value    : projet.notes;
  
  localStorage.setItem('calepinage_projet', JSON.stringify(projet));
  
  var dash = document.getElementById('dashboardProjet');
  if (dash) dash.textContent = projet.nom ? '— ' + projet.nom : '';
  
  var logo = document.querySelector('.dashboard-logo');
  if (logo) {
    logo.textContent = '🏗️ Calepinage Pro' + (projet.nom ? ' — ' + projet.nom : '');
  }
  
  showToast('✅ Infos projet enregistrées');
}

function restaurerInfosProjet() {
  var saved = localStorage.getItem('calepinage_projet');
  if (saved) {
    try { projet = JSON.parse(saved); } catch(e) {}
    chargerInfosProjet();
  }
}

// ============================================================
//  LISTE VERSIONS (UI)
// ============================================================

function mettreAJourListeVersions() {
  var sel = document.getElementById('selectVersions');
  if (!sel) return;
  var versions = listerVersions();
  sel.innerHTML = '<option value="">— Aucune version —</option>' +
    versions.map(function(v) {
      return '<option value="' + v.key + '">' + v.version + ' (' + v.date + ')</option>';
    }).join('');
}

// ============================================================
//  INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  restaurerInfosProjet();
  mettreAJourListeVersions();

  var btnSauv = document.getElementById('btnProjetSauv');
  if (btnSauv) btnSauv.addEventListener('click', enregistrerInfosProjet);

  var btnSauvVersion = document.getElementById('btnSauvVersion');
  if (btnSauvVersion) btnSauvVersion.addEventListener('click', function() {
    var nom = prompt('Nom de la version :', 'v' + new Date().toISOString().slice(0,10));
    if (nom !== null) sauvegarderVersion(nom || undefined);
  });

  var btnCharger = document.getElementById('btnChargerVersion');
  if (btnCharger) btnCharger.addEventListener('click', function() {
    var sel = document.getElementById('selectVersions');
    if (sel && sel.value) chargerVersion(sel.value);
    else showToast('⚠️ Sélectionne une version');
  });

  var btnSuppr = document.getElementById('btnSupprVersion');
  if (btnSuppr) btnSuppr.addEventListener('click', function() {
    var sel = document.getElementById('selectVersions');
    if (sel && sel.value) { 
      if (confirm('Supprimer cette version ?')) {
        supprimerVersion(sel.value); 
        sel.value = ''; 
      }
    }
    else showToast('⚠️ Sélectionne une version');
  });

  var btnCloud = document.getElementById('btnSauvCloud');
  if (btnCloud) btnCloud.addEventListener('click', apiSauvegarderChantier);

  var btnListe = document.getElementById('btnListeChantiers');
  if (btnListe) btnListe.addEventListener('click', afficherChantiersList);
});
