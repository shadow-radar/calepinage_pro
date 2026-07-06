// ============================================================
//  FIREBASE — Initialisation + Firestore
//  BNA Bardage — Calepinage Pro
// ============================================================

// Import via CDN (compatible site statique, pas de bundler)
import { initializeApp }                        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, doc,
         getDocs, getDoc, setDoc,
         addDoc, updateDoc, deleteDoc,
         query, orderBy, serverTimestamp }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAnalytics }                         from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

// --- Config ---
const firebaseConfig = {
  apiKey:            'AIzaSyAc_xI16oa0Wn8uegAXNr1-pMcLmUeibY4',
  authDomain:        'bna-bardage33.firebaseapp.com',
  projectId:         'bna-bardage33',
  storageBucket:     'bna-bardage33.firebasestorage.app',
  messagingSenderId: '529382712991',
  appId:             '1:529382712991:web:ae4e91aa09ce6c928624aa',
  measurementId:     'G-YKX9S64DQZ'
};

// --- Init ---
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getFirestore(app);

// ============================================================
//  CHANTIERS — CRUD
// ============================================================

// --- Lister tous les chantiers ---
async function afficherChantiers() {
  try {
    var el = document.getElementById('listeChantiers');
    if (el) el.innerHTML = '<p class="empty">Chargement...</p>';

    var q     = query(collection(db, 'chantiers'), orderBy('dateDebut', 'desc'));
    var snap  = await getDocs(q);
    var liste = [];

    snap.forEach(function(docSnap) {
      liste.push({ id: docSnap.id, ...docSnap.data() });
    });

    _renderChantiers(liste);
    return liste;
  } catch(err) {
    console.error('Erreur afficherChantiers :', err);
    showToast('❌ Erreur chargement chantiers');
    return [];
  }
}

// --- Sauvegarder / mettre à jour un chantier ---
async function sauvegarderChantier(data) {
  try {
    var numeroDossier = data.numeroDossier || genererNumeroDossier();
    var ref = doc(db, 'chantiers', numeroDossier);
    await setDoc(ref, {
      numeroDossier:    numeroDossier,
      nomProjet:        data.nomProjet        || '',
      client:           data.client           || '',
      adresse:          data.adresse          || '',
      dateDebut:        data.dateDebut        || '',
      datefinPrevue:    data.datefinPrevue    || '',
      avancement:       data.avancement       || 0,
      planning: {
        metre:       data.planning?.metre       || false,
        preparation: data.planning?.preparation || false,
        pose:        data.planning?.pose        || false,
        reception:   data.planning?.reception   || false
      },
      facades:          data.facades          || [],
      resultats:        data.resultats        || [],
      inventaire:       data.inventaire       || '',
      notes:            data.notes            || '',
      etatAvancement:   data.etatAvancement   || 'en_cours',
      updatedAt:        serverTimestamp()
    }, { merge: true });

    showToast('✅ Chantier sauvegardé dans Firebase !');
    return numeroDossier;
  } catch(err) {
    console.error('Erreur sauvegarderChantier :', err);
    showToast('❌ Erreur sauvegarde Firebase');
  }
}

// --- Charger un chantier par N° dossier ---
async function chargerChantier(numeroDossier) {
  try {
    var ref  = doc(db, 'chantiers', numeroDossier);
    var snap = await getDoc(ref);
    if (!snap.exists()) {
      showToast('❌ Chantier introuvable');
      return null;
    }
    var data = { id: snap.id, ...snap.data() };
    // Restaurer dans l'appli
    if (data.facades && data.facades.length > 0) {
      facades      = data.facades;
      resFacades   = data.resultats || facades.map(function(){ return null; });
      facadeCounter = facades.reduce(function(m, f){ return Math.max(m, f.num || 0); }, 0);
      renderFacades();
      afficherMetreTotal();
      updateDashboard();
    }
    showToast('📂 Chantier chargé : ' + (data.nomProjet || numeroDossier));
    return data;
  } catch(err) {
    console.error('Erreur chargerChantier :', err);
    showToast('❌ Erreur chargement');
    return null;
  }
}

// --- Supprimer un chantier ---
async function supprimerChantier(numeroDossier) {
  try {
    await deleteDoc(doc(db, 'chantiers', numeroDossier));
    showToast('🗑️ Chantier supprimé');
    afficherChantiers();
  } catch(err) {
    console.error('Erreur supprimerChantier :', err);
    showToast('❌ Erreur suppression');
  }
}

// ============================================================
//  AFFICHAGE LISTE CHANTIERS
// ============================================================
function _renderChantiers(liste) {
  var el = document.getElementById('listeChantiers');
  if (!el) return;

  if (liste.length === 0) {
    el.innerHTML = '<p class="empty">Aucun chantier enregistré.</p>';
    return;
  }

  var etatLabel = {
    'en_cours':  '🔵 En cours',
    'termine':   '✅ Terminé',
    'en_pause':  '⏸️ En pause',
    'planifie':  '📅 Planifié'
  };

  el.innerHTML = liste.map(function(c) {
    var pct = c.avancement || 0;
    return (
      '<div class="chantier-card" data-id="' + c.id + '">' +
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
          '<span>📅 ' + (c.dateDebut || '—') + '</span>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-primary btn-sm" onclick="chargerChantier(\'' + c.id + '\')">📂 Ouvrir</button>' +
            '<button class="btn btn-danger btn-sm" onclick="supprimerChantier(\'' + c.id + '\')">🗑️</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

// ============================================================
//  NUMÉRO DE DOSSIER AUTO
// ============================================================
function genererNumeroDossier() {
  var annee = new Date().getFullYear();
  var cle   = 'dernier_numero_' + annee;
  var der   = parseInt(localStorage.getItem(cle) || '0');
  var nouv  = der + 1;
  localStorage.setItem(cle, nouv);
  return 'BNA-' + annee + '-' + nouv.toString().padStart(3, '0');
}

// --- Exporter les fonctions pour les autres fichiers ---
window.afficherChantiers   = afficherChantiers;
window.sauvegarderChantier = sauvegarderChantier;
window.chargerChantier     = chargerChantier;
window.supprimerChantier   = supprimerChantier;
window.genererNumeroDossier = genererNumeroDossier;
