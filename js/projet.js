// ============================================================
//  PROJET — métadonnées, versions, logo
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
    projet:    projet,
    facades:   facades,
    resultats: resFacades,
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
//  INFOS PROJET (formulaire)
// ============================================================

function chargerInfosProjet() {
  var el = function(id){ return document.getElementById(id); };
  if (el('projetNom'))      el('projetNom').value      = projet.nom       || '';
  if (el('projetClient'))   el('projetClient').value   = projet.client    || '';
  if (el('projetChantier')) el('projetChantier').value = projet.chantier  || '';
  if (el('projetNumero'))   el('projetNumero').value   = projet.numero    || '';
  if (el('projetNotes'))    el('projetNotes').value    = projet.notes     || '';
  // Dashboard titre
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
  // Sauvegarder en localStorage
  localStorage.setItem('calepinage_projet', JSON.stringify(projet));
  // Mettre à jour le dashboard
  var dash = document.getElementById('dashboardProjet');
  if (dash) dash.textContent = projet.nom ? '— ' + projet.nom : '';
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
//  FIREBASE — Sauvegarde cloud
// ============================================================

async function sauvegarderChantierCloud() {
  // Enregistrer les infos projet d'abord
  enregistrerInfosProjet();

  // Générer numéro si vide
  if (!projet.numero) {
    projet.numero = genererNumeroDossier();
    var el = document.getElementById('projetNumero');
    if (el) el.value = projet.numero;
  }

  await apiSauvegarderChantier();
}

async function afficherChantiersList() {
  var liste = await apiListerChantiers();
  var el    = document.getElementById('listeChantiers');
  if (!el) return;

  if (liste.length === 0) {
    el.innerHTML = '<p class="empty">Aucun chantier dans Firebase.</p>';
    return;
  }

  var etatLabel = {
    'en_cours': '🔵 En cours',
    'termine':  '✅ Terminé',
    'en_pause': '⏸️ En pause',
    'planifie': '📅 Planifié'
  };

  el.innerHTML = liste.map(function(c) {
    var pct = c.avancement || 0;
    return (
      '<div class="chantier-card">' +
        '<div class="chantier-header">' +
          '<div>' +
            '<div class="chantier-nom">' + (c.nomProjet || 'Sans nom') + '</div>' +
            '<div class="chantier-meta">' + c.id + ' · ' + (c.client || '') + '</div>' +
          '</div>' +
          '<span class="badge ' + (c.etatAvancement === 'termine' ? 'ok' : '') + '">' +
            (etatLabel[c.etatAvancement] || '🔵 En cours') +
          '</span>' +
        '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="chantier-footer">' +
          '<span>📍 ' + (c.adresse || '—') + '</span>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-primary btn-sm" onclick="apiChargerChantier(\'' + c.id + '\')">📂 Ouvrir</button>' +
            '<button class="btn btn-danger btn-sm" onclick="apiSupprimerChantier(\'' + c.id + '\')">🗑️</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
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

// Bouton enregistrer infos projet
document.addEventListener('DOMContentLoaded', function() {
  restaurerInfosProjet();
  mettreAJourListeVersions();

  var btnSauv = document.getElementById('btnProjetSauv');
  if (btnSauv) btnSauv.addEventListener('click', enregistrerInfosProjet);

  var btnSauvVersion = document.getElementById('btnSauvVersion');
  if (btnSauvVersion) btnSauvVersion.addEventListener('click', function() {
    sauvegarderVersion();
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
    if (sel && sel.value) { supprimerVersion(sel.value); sel.value = ''; }
    else showToast('⚠️ Sélectionne une version');
  });

  // Bouton sauvegarde cloud Firebase
  var btnCloud = document.getElementById('btnSauvCloud');
  if (btnCloud) btnCloud.addEventListener('click', sauvegarderChantierCloud);

  // Bouton liste chantiers Firebase
  var btnListe = document.getElementById('btnListeChantiers');
  if (btnListe) btnListe.addEventListener('click', afficherChantiersList);
});
