// ============================================================
//  API — Client pour calepinage-api
//  BNA Bardage — Connexion serveur
// ============================================================

const API_URL = 'https://calepinage-api-zom1.onrender.com';

// ============================================================
//  CHANTIERS
// ============================================================

async function apiSauvegarderChantier() {
  if (facades.length === 0) { showToast('⚠️ Aucune façade à sauvegarder'); return; }

  var numeroDossier = document.getElementById('projetNumero')?.value || genererNumeroDossier();
  var data = {
    numeroDossier,
    nomProjet:     document.getElementById('projetNom')?.value     || '',
    client:        document.getElementById('projetClient')?.value   || '',
    adresse:       document.getElementById('projetChantier')?.value || '',
    notes:         document.getElementById('projetNotes')?.value    || '',
    planning: {
      metre:       document.getElementById('planMetreDate')?.value       || '',
      preparation: document.getElementById('planPrepDate')?.value        || '',
      pose:        document.getElementById('planPoseDate')?.value        || '',
      reception:   document.getElementById('planReceptionDate')?.value   || ''
    },
    facades,
    resultats:     resFacades,
    etatAvancement: document.getElementById('projetEtat')?.value || 'en_cours'
  };

  try {
    showToast('💾 Sauvegarde en cours...');
    var res = await fetch(API_URL + '/chantiers', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    var json = await res.json();
    if (json.ok) {
      showToast('✅ Sauvegardé dans Firebase ! N° ' + numeroDossier);
      if (document.getElementById('projetNumero')) {
        document.getElementById('projetNumero').value = numeroDossier;
      }
    } else {
      showToast('❌ Erreur : ' + json.erreur);
    }
  } catch(err) {
    showToast('❌ Serveur inaccessible');
  }
}

async function apiListerChantiers() {
  try {
    var res  = await fetch(API_URL + '/chantiers');
    var json = await res.json();
    return json.chantiers || [];
  } catch(err) {
    return [];
  }
}

async function apiChargerChantier(numeroDossier) {
  try {
    showToast('📂 Chargement...');
    var res  = await fetch(API_URL + '/chantiers/' + numeroDossier);
    var json = await res.json();
    if (!json.ok) { showToast('❌ Introuvable'); return; }
    var c = json.chantier;
    facades    = c.facades   || [];
    resFacades = c.resultats || facades.map(function(){ return null; });
    facadeCounter = facades.reduce(function(m, f){ return Math.max(m, f.num||0); }, 0);
    if (document.getElementById('projetNom'))      document.getElementById('projetNom').value      = c.nomProjet || '';
    if (document.getElementById('projetClient'))   document.getElementById('projetClient').value   = c.client    || '';
    if (document.getElementById('projetChantier')) document.getElementById('projetChantier').value = c.adresse   || '';
    if (document.getElementById('projetNumero'))   document.getElementById('projetNumero').value   = c.numeroDossier || '';
    if (document.getElementById('projetNotes'))    document.getElementById('projetNotes').value    = c.notes     || '';
    renderFacades();
    afficherMetreTotal();
    updateDashboard();
    showToast('✅ ' + (c.nomProjet || c.numeroDossier) + ' chargé !');
  } catch(err) {
    showToast('❌ Erreur chargement');
  }
}

async function apiSupprimerChantier(numeroDossier) {
  try {
    var res  = await fetch(API_URL + '/chantiers/' + numeroDossier, { method: 'DELETE' });
    var json = await res.json();
    if (json.ok) showToast('🗑️ Chantier supprimé');
    return json.ok;
  } catch(err) {
    showToast('❌ Erreur suppression');
    return false;
  }
}

async function apiGetMeteo(adresse) {
  try {
    var res = await fetch(API_URL + '/meteo?adresse=' + encodeURIComponent(adresse));
    return await res.json();
  } catch(err) {
    return null;
  }
}

async function apiAbonnerNotifs() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast('⚠️ Notifications non supportées'); return;
  }
  try {
    var res      = await fetch(API_URL + '/push/vapid');
    var json     = await res.json();
    var reg      = await navigator.serviceWorker.ready;
    var sub      = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: json.publicKey
    });
    await fetch(API_URL + '/push/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(sub)
    });
    showToast('🔔 Notifications activées !');
  } catch(err) {
    showToast('❌ ' + err.message);
  }
}

function genererNumeroDossier() {
  var annee = new Date().getFullYear();
  var cle   = 'dernier_numero_' + annee;
  var der   = parseInt(localStorage.getItem(cle) || '0');
  var nouv  = der + 1;
  localStorage.setItem(cle, nouv);
  return 'BNA-' + annee + '-' + nouv.toString().padStart(3, '0');
}

window.apiSauvegarderChantier = apiSauvegarderChantier;
window.apiListerChantiers     = apiListerChantiers;
window.apiChargerChantier     = apiChargerChantier;
window.apiSupprimerChantier   = apiSupprimerChantier;
window.apiGetMeteo            = apiGetMeteo;
window.apiAbonnerNotifs       = apiAbonnerNotifs;
window.genererNumeroDossier   = genererNumeroDossier;
