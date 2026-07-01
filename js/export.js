// ============================================================
//  EXPORT — sauvegarde / chargement / partage image
// ============================================================

// --- Sauvegarder projet JSON ---
function sauvegarderProjet() {
  var projet = {
    v: 3,
    facades:   facades,
    resultats: resFacades,
    savedAt:   new Date().toLocaleDateString('fr-FR')
  };
  var blob = new Blob([JSON.stringify(projet, null, 2)], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'calepinage_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  showToast('✅ Projet sauvegardé !');
}

// --- Charger projet JSON ---
function chargerProjet(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var p = JSON.parse(ev.target.result);
      if (!p.v) throw new Error('Format invalide');
      if (p.v >= 2 && p.facades) {
        facades = p.facades;
        facadeCounter = facades.reduce(function(m, f){ return Math.max(m, f.num || 0); }, 0);
        resFacades = facades.map(function() { return null; });
        renderFacades();
        updateDashboard();
        showToast('📂 Projet chargé — ' + facades.length + ' façade(s) · ' + (p.savedAt || ''));
      } else {
        // ancien format v1 — convertir
        var f = newFacade();
        f.nom  = 'Façade importée';
        f.type = p.type === 'trapeze' ? 'facade' : (p.type || 'facade');
        ['larg','largHG','largHD','hg','hd','hc','lu','hu','joint','lameAir','antiRongeur'].forEach(function(k) {
          if (p[k] !== undefined) f[k] = parseFloat(p[k]) || 0;
        });
        f.typeMat    = p.typeMat   || 'composite';
        f.zoneVent   = p.zoneVent  || 'normale';
        f.formatPP   = p.formatPP  || '25';
        f.ouvertures = p.ouvertures || [];
        facades    = [f];
        resFacades = [null];
        renderFacades();
        showToast('📂 Ancien format converti');
      }
    } catch(err) {
      showToast('❌ Fichier invalide : ' + err.message);
    }
  };
  reader.readAsText(file);
}

// --- Partager image canvas ---
function partagerImage() {
  var r = resFacades[currentVisu];
  if (!r) { showToast('⚠️ Calculez d\'abord'); return; }
  var canvas = document.getElementById('cvs');
  canvas.toBlob(function(blob) {
    var nom = 'calepinage_' + r.nom.replace(/ /g, '_') + '.png';
    if (navigator.share && navigator.canShare) {
      var file = new File([blob], nom, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Calepinage — ' + r.nom });
        return;
      }
    }
    var url = URL.createObjectURL(blob);
    var a   = document.createElement('a');
    a.href     = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📸 Image téléchargée !');
  }, 'image/png');
}
