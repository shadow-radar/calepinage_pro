// ============================================================
//  MÉTRÉ — affichage et partage
// ============================================================
function afficherMetreTotal() {
  var calc = resFacades.filter(Boolean);
  var elTotal  = document.getElementById('totalGeneral');
  var elTableau = document.getElementById('tableauMetre');

  if (calc.length === 0) {
    elTotal.innerHTML  = '';
    elTableau.innerHTML = '<p class="empty">Calculez d\'abord le calepinage.</p>';
    updateDashboard();
    return;
  }

  var tot = {
    brute: 0, utile: 0, lames: 0, vis: 0,
    equerres: 0, montants: 0, ar: 0, pp: 0,
    tMin: 0, tMax: 0
  };
  calc.forEach(function(r) {
    tot.brute    += r.sBrute;
    tot.utile    += r.sUtile;
    tot.lames    += r.nbTotal;
    tot.vis      += r.nbVis;
    tot.equerres += r.nbEquerres;
    tot.montants += r.nbMontants3m;
    tot.ar       += r.nbAR;
    tot.pp       += r.nbRouleaux;
    tot.tMin     += r.tpsMin;
    tot.tMax     += r.tpsMax;
  });

  // Carte totaux
  elTotal.innerHTML =
    '<div class="total-card">' +
      '<div class="total-header">📊 Total — ' + calc.length + ' façade(s)</div>' +
      '<div class="total-grid">' +
        _totItem(tot.brute.toFixed(1) + ' m²', 'Surface') +
        _totItem(tot.lames + ' u', 'Lames') +
        _totItem(tot.vis + ' u', 'Vis') +
        _totItem(tot.montants + ' u', 'Montants 3m') +
        _totItem(tot.equerres + ' u', 'Équerres') +
        _totItem(Math.ceil(tot.tMin/8) + 'j – ' + Math.ceil(tot.tMax/8) + 'j', 'Durée') +
      '</div>' +
    '</div>';

  // Détail façades
  var html = '';
  calc.forEach(function(r) {
    html += '<div class="card">';
    html += '<div class="card-title">📋 ' + r.nom + '</div>';
    html += '<table><thead><tr><th>Poste</th><th>Quantité</th></tr></thead><tbody>';
    html += _sep('Surfaces');
    html += _row('Surface brute',         r.sBrute.toFixed(2)   + ' m²');
    html += _row('Ouvertures',            '− ' + r.sOuv.toFixed(2) + ' m²');
    html += _rowTotal('Surface utile',    r.sUtile.toFixed(2)   + ' m²');
    html += _sep('Lames ' + r.typeMat + ' ' + r.lu + '×' + r.hu + ' mm');
    html += _row('Total lames',           r.nbTotal    + ' u');
    html += _row('Entières',              r.nbEntieres + ' u');
    html += _row('Découpées',             r.nbDecoupees + ' u');
    html += _row('Taux de chute',         r.tauxChute.toFixed(1) + '%');
    html += _row('Sens de pose',          r.sensePose);
    html += _sep('Ossature');
    html += _row('Files de montants',     r.nbMontants + ' files');
    html += _row('Montants 3m',           r.nbMontants3m + ' u');
    html += _row('Équerres (4/montant)',  r.nbEquerres  + ' u');
    html += _row('Vis',                   r.nbVis       + ' u');
    html += _sep('Finitions');
    html += _row('Anti-rongeur bas',      r.nbARBas   + ' u');
    html += _row('Anti-rongeur haut',     r.nbARHaut  + ' u');
    html += _row('Pare-pluie (' + r.formatPP + ' ml)', r.nbRouleaux + ' rouleau' + (r.nbRouleaux > 1 ? 'x' : ''));
    if (r.nbJD > 0) html += _row('Joints dilatation', r.mlJD.toFixed(1) + ' ml');
    html += _sep('Temps de pose estimé');
    html += _row('Durée',                 r.tpsMin.toFixed(1) + 'h – ' + r.tpsMax.toFixed(1) + 'h');
    html += _row('Jours (base 8h)',       r.joursMin + 'j – ' + r.joursMax + 'j');
    html += '</tbody></table></div>';
  });

  // Récap total
  if (calc.length > 1) {
    html += '<div class="card"><table><thead><tr><th colspan="2">🔢 Récap total</th></tr></thead><tbody>';
    html += _rowTotal('Surface brute',   tot.brute.toFixed(2)    + ' m²');
    html += _rowTotal('Surface utile',   tot.utile.toFixed(2)    + ' m²');
    html += _rowTotal('Lames',           tot.lames               + ' u');
    html += _rowTotal('Vis',             tot.vis                 + ' u');
    html += _rowTotal('Montants 3m',     tot.montants            + ' u');
    html += _rowTotal('Équerres',        tot.equerres            + ' u');
    html += _rowTotal('Anti-rongeur',    tot.ar                  + ' u');
    html += _rowTotal('Pare-pluie',      tot.pp + ' rouleau' + (tot.pp > 1 ? 'x' : ''));
    html += _rowTotal('Durée totale',    tot.tMin.toFixed(0) + 'h – ' + tot.tMax.toFixed(0) + 'h');
    html += '</tbody></table></div>';
  }

  elTableau.innerHTML = html;
  updateDashboard();
}

function _totItem(val, lbl) {
  return '<div class="total-item"><div class="tval">' + val + '</div><div class="tlbl">' + lbl + '</div></div>';
}
function _sep(t) {
  return '<tr class="sep-row"><td colspan="2">' + t + '</td></tr>';
}
function _row(l, v) {
  return '<tr><td>' + l + '</td><td>' + v + '</td></tr>';
}
function _rowTotal(l, v) {
  return '<tr class="total-row"><td>' + l + '</td><td>' + v + '</td></tr>';
}

// --- Partager métrés ---
function partagerMetres() {
  var calc = resFacades.filter(Boolean);
  if (calc.length === 0) { showToast('⚠️ Calculez d\'abord'); return; }

  var txt = '📐 MÉTRÉS CALEPINAGE\n📅 ' + new Date().toLocaleDateString('fr-FR') + '\n';
  txt += '─────────────────────\n';
  var totL = 0, totV = 0, totM = 0, totE = 0, totAR = 0;

  calc.forEach(function(r) {
    txt += '\n🏗️ ' + r.nom + '\n';
    txt += '  Surface : ' + r.sBrute.toFixed(2) + ' m² (utile : ' + r.sUtile.toFixed(2) + ' m²)\n';
    txt += '  Lames : ' + r.nbTotal + ' u (entières : ' + r.nbEntieres + ' | découpées : ' + r.nbDecoupees + ')\n';
    txt += '  Montants 3m : ' + r.nbMontants3m + ' u\n';
    txt += '  Équerres : ' + r.nbEquerres + ' u\n';
    txt += '  Vis : ' + r.nbVis + ' u\n';
    txt += '  Anti-rongeur bas : ' + r.nbARBas + ' u\n';
    txt += '  Anti-rongeur haut : ' + r.nbARHaut + ' u\n';
    txt += '  Pare-pluie : ' + r.nbRouleaux + ' rouleau(x) (' + r.formatPP + 'm)\n';
    txt += '  Durée : ' + r.tpsMin.toFixed(1) + 'h – ' + r.tpsMax.toFixed(1) + 'h\n';
    totL += r.nbTotal; totV += r.nbVis;
    totM += r.nbMontants3m; totE += r.nbEquerres; totAR += r.nbAR;
  });

  if (calc.length > 1) {
    txt += '\n─────────────────────\n🔢 TOTAL\n';
    txt += '  Lames : ' + totL + ' u\n  Montants 3m : ' + totM + ' u\n';
    txt += '  Équerres : ' + totE + ' u\n  Vis : ' + totV + ' u\n';
    txt += '  Anti-rongeur : ' + totAR + ' u\n';
  }

  if (navigator.share) {
    navigator.share({ title: 'Métrés Calepinage', text: txt });
  } else {
    navigator.clipboard.writeText(txt)
      .then(function() { showToast('📋 Métrés copiés !'); })
      .catch(function() { showToast('⚠️ Non supporté'); });
  }
}
