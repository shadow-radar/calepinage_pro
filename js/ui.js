// ============================================================
//  UI — interface, formulaires, onglets
// ============================================================

// --- Toast ---
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2800);
}

// --- Dashboard (barre de statut) ---
function updateDashboard() {
  var calc  = resFacades.filter(Boolean);
  var totS  = calc.reduce(function(a, r){ return a + r.sBrute; }, 0);
  var totL  = calc.reduce(function(a, r){ return a + r.nbTotal; }, 0);
  document.getElementById('db-facades').textContent  = facades.length;
  document.getElementById('db-surface').textContent  = totS.toFixed(1) + ' m²';
  document.getElementById('db-lames').textContent    = totL;
}
function mettreAJourDashboardProjet() {
  var el = document.getElementById('dashboardProjet');
  if (el) {
    el.textContent = projet.nom ? '— ' + projet.nom : '';
  }
}

// --- Onglets ---
document.querySelectorAll('.tab').forEach(function(t) {
  t.addEventListener('click', function() {
    var id = this.dataset.tab;
    document.querySelectorAll('.tab').forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(x){ x.classList.remove('active'); });
    this.classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
    if (id === 'visu') {
      updateSelectVisu();
      if (resFacades[currentVisu]) {
        setTimeout(function() { dessiner(resFacades[currentVisu]); }, 150);
      }
    }
  });
});

// --- Sélecteur visu ---
function updateSelectVisu() {
  var sel  = document.getElementById('selectVisu');
  var prev = parseInt(sel.value);
  sel.innerHTML = '';
  var hasOne = false;
  facades.forEach(function(f, i) {
    if (resFacades[i]) {
      var opt = document.createElement('option');
      opt.value       = i;
      opt.textContent = nomFacade(f);
      sel.appendChild(opt);
      hasOne = true;
    }
  });
  if (!hasOne) {
    sel.innerHTML = '<option value="">— Aucune façade calculée —</option>';
    return;
  }
  sel.value = (!isNaN(prev) && resFacades[prev]) ? prev : currentVisu;
}

document.getElementById('selectVisu').addEventListener('change', function() {
  var i = parseInt(this.value);
  if (!isNaN(i) && resFacades[i]) {
    currentVisu = i;
    dessiner(resFacades[i]);
  }
});

// --- Sélecteur de rendu ---
document.getElementById('renderStyle').addEventListener('change', function() {
  if (resFacades[currentVisu]) {
    dessiner(resFacades[currentVisu]);
  }
});

// --- Rendu liste des façades ---
function renderFacades() {
  var c = document.getElementById('listeFacades');
  if (facades.length === 0) {
    c.innerHTML = '<p class="empty" style="padding:20px 0">Aucune façade — cliquez "+ Façade"</p>';
    updateDashboard();
    return;
  }
  c.innerHTML = '';
  facades.forEach(function(f, idx) {
    var r     = resFacades[idx];
    var badge = r
      ? '<span class="badge ok">✓ ' + r.sBrute.toFixed(1) + ' m²</span>'
      : '<span class="badge">Non calculé</span>';
    var div = document.createElement('div');
    div.className = 'facade-card' + (idx === 0 ? ' active-facade' : '');
    div.innerHTML =
      '<div class="facade-header" data-idx="' + idx + '">' +
        '<span class="facade-title">' + nomFacade(f) + '</span>' +
        badge +
        '<span class="chevron" data-arrow="' + idx + '">▼</span>' +
      '</div>' +
      '<div class="facade-body' + (idx === 0 ? ' open' : '') + '" id="fb_' + idx + '">' +
        renderFacadeForm(f, idx) +
      '</div>';
    c.appendChild(div);
  });

  // Accordion
  c.querySelectorAll('.facade-header').forEach(function(h) {
    h.addEventListener('click', function() {
      var i    = parseInt(this.dataset.idx);
      var body = document.getElementById('fb_' + i);
      var open = body.classList.contains('open');
      c.querySelectorAll('.facade-body').forEach(function(b){ b.classList.remove('open'); });
      c.querySelectorAll('.facade-card').forEach(function(b){ b.classList.remove('active-facade'); });
      if (!open) {
        body.classList.add('open');
        h.closest('.facade-card').classList.add('active-facade');
      }
    });
  });

  facades.forEach(function(f, idx) { bindFacadeForm(f, idx); });
  updateDashboard();
}

// --- HTML formulaire façade ---
function renderFacadeForm(f, idx) {
  return (
    // Nom
    '<div class="field"><label>Nom</label>' +
    '<input type="text" data-fid="' + f.id + '" data-ff="nom" value="' + (f.nom||'') + '" placeholder="Façade Nord, Pignon Est…"></div>' +

    // Type
    '<div class="field-group" style="margin-top:10px"><label class="section-label">TYPE</label>' +
    '<div class="radio-group">' +
    ['facade','pignon'].map(function(v){
      return '<label class="radio-label"><input type="radio" name="stype_'+idx+'" value="'+v+'"'+(f.type===v?' checked':'')+'>'+
             (v==='facade'?'Façade':'Pignon')+'</label>';
    }).join('') +
    '</div></div>' +

    // Dimensions
    '<div class="field-group" style="margin-top:10px"><label class="section-label">DIMENSIONS (mm)</label>' +
    '<div class="grid2">' +
    '<div class="field"><label>Largeur bas</label><input type="number" data-fid="'+f.id+'" data-ff="larg" value="'+f.larg+'" min="1"></div>' +
    '<div class="field" id="fLHG_'+idx+'" style="display:'+(f.type==='pignon'?'flex':'none')+'"><label>Largeur haut G</label><input type="number" data-fid="'+f.id+'" data-ff="largHG" value="'+f.largHG+'" min="0"></div>' +
    '<div class="field" id="fLHD_'+idx+'" style="display:'+(f.type==='pignon'?'flex':'none')+'"><label>Largeur haut D</label><input type="number" data-fid="'+f.id+'" data-ff="largHD" value="'+f.largHD+'" min="0"></div>' +
    '<div class="field"><label>Hauteur gauche</label><input type="number" data-fid="'+f.id+'" data-ff="hg" value="'+f.hg+'" min="1"></div>' +
    '<div class="field"><label>Hauteur droite</label><input type="number" data-fid="'+f.id+'" data-ff="hd" value="'+f.hd+'" min="1"></div>' +
    '<div class="field" id="fHC_'+idx+'" style="display:'+(f.type==='pignon'?'flex':'none')+'"><label>Hauteur pointe</label><input type="number" data-fid="'+f.id+'" data-ff="hc" value="'+f.hc+'" min="1"></div>' +
    '</div></div>' +

    // Matériau
    '<div class="field-group" style="margin-top:10px"><label class="section-label">MATÉRIAU</label>' +
    '<div class="grid2">' +
    '<div class="field"><label>Type</label><select data-fid="'+f.id+'" data-ff="typeMat">' +
    ['composite','fibrociment','metal'].map(function(v){
      return '<option value="'+v+'"'+(f.typeMat===v?' selected':'')+'>'+(v==='metal'?'Métal':v.charAt(0).toUpperCase()+v.slice(1))+'</option>';
    }).join('')+'</select></div>' +
    '<div class="field"><label>Longueur lame (mm)</label><input type="number" data-fid="'+f.id+'" data-ff="lu" value="'+f.lu+'" min="1"></div>' +
    '<div class="field"><label>Largeur lame (mm)</label><input type="number" data-fid="'+f.id+'" data-ff="hu" value="'+f.hu+'" min="1"></div>' +
    '<div class="field"><label>Joint (mm)</label><input type="number" data-fid="'+f.id+'" data-ff="joint" value="'+f.joint+'" min="0"></div>' +
    '</div></div>' +

    // Accessoires
    '<div class="field-group" style="margin-top:10px"><label class="section-label">ACCESSOIRES</label>' +
    '<div class="grid2">' +
    '<div class="field"><label>Lame d\'air (mm)</label><input type="number" data-fid="'+f.id+'" data-ff="lameAir" value="'+f.lameAir+'" min="0"></div>' +
    '<div class="field"><label>Anti-rongeur (mm)</label><input type="number" data-fid="'+f.id+'" data-ff="antiRongeur" value="'+f.antiRongeur+'" min="0"></div>' +
    '<div class="field"><label>Rouleau PP</label><select data-fid="'+f.id+'" data-ff="formatPP">' +
    ['10','25','50'].map(function(v){ return '<option value="'+v+'"'+(f.formatPP===v?' selected':'')+'>'+v+' ml</option>'; }).join('') +
    '</select></div>' +
    '<div class="field"><label>Zone vent</label><select data-fid="'+f.id+'" data-ff="zoneVent">' +
    '<option value="normale"'+(f.zoneVent==='normale'?' selected':'')+'>Normale</option>' +
    '<option value="forte"'+(f.zoneVent==='forte'?' selected':'')+'>Forte</option>' +
    '</select></div>' +
    '<div class="field" id="fCV_'+idx+'" style="display:'+(f.typeMat==='metal'?'flex':'none')+'"><label>Côté vent</label>' +
    '<select data-fid="'+f.id+'" data-ff="coteVent">' +
    '<option value="gauche"'+(f.coteVent==='gauche'?' selected':'')+'>Vent G → G→D</option>' +
    '<option value="droite"'+(f.coteVent==='droite'?' selected':'')+'>Vent D → D→G</option>' +
    '</select></div>' +
    '</div></div>' +

    // Ouvertures
    '<div class="field-group" style="margin-top:10px"><label class="section-label">OUVERTURES</label>' +
    '<div id="listeOuv_'+idx+'">'+renderOuvHTML(f.ouvertures, idx)+'</div>' +
    '<button class="btn btn-ghost btn-sm" data-addouv="'+idx+'" style="margin-top:8px">+ Ajouter ouverture</button>' +
    '</div>' +

    // Actions
    '<div class="facade-actions">' +
    '<button class="btn btn-primary btn-sm" data-calc="'+idx+'">🔍 Calculer</button>' +
    '<button class="btn btn-outline btn-sm" data-visu="'+idx+'">🎨 Visu</button>' +
    '<button class="btn btn-success btn-sm" data-dup="'+idx+'">📋 Dupliquer</button>' +
    '<button class="btn btn-danger btn-sm" data-del="'+idx+'">🗑️</button>' +
    '</div>'
  );
}

function renderOuvHTML(ouvs, idx) {
  if (!ouvs || ouvs.length === 0) return '<p class="empty">Aucune ouverture</p>';
  return ouvs.map(function(o) {
    return '<div class="ouv-item">' +
      '<select data-oidx="'+idx+'" data-oid="'+o.id+'" data-of="type">' +
      '<option value="fenetre"'+(o.type==='fenetre'?' selected':'')+'>Fenêtre</option>' +
      '<option value="porte"'+(o.type==='porte'?' selected':'')+'>Porte</option>' +
      '</select>' +
      '<span class="ouv-lbl">X</span><input type="number" value="'+o.x+'" data-oidx="'+idx+'" data-oid="'+o.id+'" data-of="x">' +
      '<span class="ouv-lbl">Y</span><input type="number" value="'+o.y+'" data-oidx="'+idx+'" data-oid="'+o.id+'" data-of="y">' +
      '<span class="ouv-lbl">L</span><input type="number" value="'+o.larg+'" data-oidx="'+idx+'" data-oid="'+o.id+'" data-of="larg">' +
      '<span class="ouv-lbl">H</span><input type="number" value="'+o.haut+'" data-oidx="'+idx+'" data-oid="'+o.id+'" data-of="haut">' +
      '<button class="btn btn-danger btn-sm" data-deloidx="'+idx+'" data-deloid="'+o.id+'">✕</button>' +
      '</div>';
  }).join('');
}

function bindFacadeForm(f, idx) {
  var body = document.getElementById('fb_' + idx);
  if (!body) return;

  // Champs
  body.querySelectorAll('[data-ff]').forEach(function(el) {
    el.addEventListener('change', function() {
      var fid = parseInt(this.dataset.fid);
      var ff  = this.dataset.ff;
      var fac = facades.find(function(x){ return x.id === fid; });
      if (!fac) return;
      fac[ff] = (el.tagName === 'SELECT' || ff === 'nom') ? this.value : (parseFloat(this.value) || 0);
      if (ff === 'type') {
        var isPig = this.value === 'pignon';
        ['fHC_','fLHG_','fLHD_'].forEach(function(id){
          var el2 = document.getElementById(id + idx);
          if (el2) el2.style.display = isPig ? 'flex' : 'none';
        });
      }
      if (ff === 'typeMat') {
        var cv = document.getElementById('fCV_' + idx);
        if (cv) cv.style.display = this.value === 'metal' ? 'flex' : 'none';
      }
    });
  });

  // Radio type
  body.querySelectorAll('input[type="radio"]').forEach(function(r) {
    r.addEventListener('click', function() {
      var fac = facades[idx];
      if (!fac) return;
      fac.type = this.value;
      var isPig = this.value === 'pignon';
      ['fHC_','fLHG_','fLHD_'].forEach(function(id){
        var el = document.getElementById(id + idx);
        if (el) el.style.display = isPig ? 'flex' : 'none';
      });
    });
  });

  // Ouvertures — ajout
  var btnAddOuv = body.querySelector('[data-addouv]');
  if (btnAddOuv) {
    btnAddOuv.addEventListener('click', function() {
      var i = parseInt(this.dataset.addouv);
      facades[i].ouvertures.push({ id: Date.now(), type: 'fenetre', x: 500, y: 500, larg: 1200, haut: 1500 });
      document.getElementById('listeOuv_' + i).innerHTML = renderOuvHTML(facades[i].ouvertures, i);
      bindOuvListeners(i);
    });
  }
  bindOuvListeners(idx);

  // Calculer
  var btnCalc = body.querySelector('[data-calc]');
  if (btnCalc) {
    btnCalc.addEventListener('click', function() {
      var i = parseInt(this.dataset.calc);
      resFacades[i] = calculerFacade(facades[i]);
      currentVisu   = i;
      renderFacades();
      afficherMetreTotal();
      updateSelectVisu();
      showToast('✓ ' + nomFacade(facades[i]) + ' calculée');
    });
  }

  // Visu
  var btnVisu = body.querySelector('[data-visu]');
  if (btnVisu) {
    btnVisu.addEventListener('click', function() {
      var i = parseInt(this.dataset.visu);
      if (!resFacades[i]) resFacades[i] = calculerFacade(facades[i]);
      currentVisu = i;
      updateSelectVisu();
      _switchTab('visu');
      setTimeout(function() { dessiner(resFacades[currentVisu]); }, 50);
    });
  }

  // Supprimer
  var btnDel = body.querySelector('[data-del]');
  if (btnDel) {
    btnDel.addEventListener('click', function() {
      var i = parseInt(this.dataset.del);
      facades.splice(i, 1);
      resFacades.splice(i, 1);
      renderFacades();
      afficherMetreTotal();
      showToast('🗑️ Façade supprimée');
    });
  }

  // Dupliquer
  var btnDup = body.querySelector('[data-dup]');
  if (btnDup) {
    btnDup.addEventListener('click', function() {
      var i    = parseInt(this.dataset.dup);
      var copy = JSON.parse(JSON.stringify(facades[i]));
      facadeCounter++;
      copy.id  = Date.now();
      copy.num = facadeCounter;
      copy.nom = (copy.nom || ('Façade ' + facades[i].num)) + ' (copie)';
      facades.splice(i + 1, 0, copy);
      resFacades.splice(i + 1, 0, null);
      renderFacades();
      showToast('📋 Façade dupliquée !');
    });
  }
}

function bindOuvListeners(idx) {
  var body = document.getElementById('listeOuv_' + idx);
  if (!body) return;
  body.querySelectorAll('[data-of]').forEach(function(el) {
    el.addEventListener('change', function() {
      var oidx = parseInt(this.dataset.oidx);
      var oid  = parseInt(this.dataset.oid);
      var of   = this.dataset.of;
      var ouv  = facades[oidx].ouvertures.find(function(o){ return o.id === oid; });
      if (!ouv) return;
      ouv[of] = of === 'type' ? this.value : (parseFloat(this.value) || 0);
    });
  });
  body.querySelectorAll('[data-deloid]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var oidx = parseInt(this.dataset.deloidx);
      var oid  = parseInt(this.dataset.deloid);
      facades[oidx].ouvertures = facades[oidx].ouvertures.filter(function(o){ return o.id !== oid; });
      document.getElementById('listeOuv_' + oidx).innerHTML = renderOuvHTML(facades[oidx].ouvertures, oidx);
      bindOuvListeners(oidx);
    });
  });
}

function _switchTab(id) {
  document.querySelectorAll('.tab').forEach(function(x){ x.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(x){ x.classList.remove('active'); });
  var btn = document.querySelector('[data-tab="' + id + '"]');
  if (btn) btn.classList.add('active');
  var pane = document.getElementById('tab-' + id);
  if (pane) pane.classList.add('active');
}

// --- Boutons globaux ---
document.getElementById('btnAddFacade').addEventListener('click', function() {
  facades.push(newFacade());
  resFacades.push(null);
  renderFacades();
  var last = facades.length - 1;
  var body = document.getElementById('fb_' + last);
  if (body) body.classList.add('open');
});

document.getElementById('btnCalcAll').addEventListener('click', function() {
  if (facades.length === 0) { showToast('⚠️ Ajoutez d\'abord des façades'); return; }
  facades.forEach(function(f, i) { resFacades[i] = calculerFacade(f); });
  currentVisu = 0;
  renderFacades();
  afficherMetreTotal();
  updateSelectVisu();
  _switchTab('metre');
  showToast('✓ ' + facades.length + ' façade(s) calculée(s)');
});

document.getElementById('btnSauv').addEventListener('click', sauvegarderProjet);
document.getElementById('btnCharg').addEventListener('click', function() {
  document.getElementById('fileCharg').click();
});
document.getElementById('fileCharg').addEventListener('change', function(e) {
  chargerProjet(e.target.files[0]);
  this.value = '';
});
document.getElementById('btnImg').addEventListener('click', partagerImage);
document.getElementById('btnPartagerMetre').addEventListener('click', partagerMetres);

// --- Init ---
facades.push(newFacade());
resFacades.push(null);
renderFacades();
updateDashboard();

// ---- Export PDF ----
document.getElementById('btnExportPDF').addEventListener('click', exporterPDF);
document.getElementById('btnExportCSV').addEventListener('click', exporterCSV);

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function(){});
}

// ============================================================
//  PROJET — UI
// ============================================================

// --- Charger les infos projet dans le formulaire ---
function chargerInfosProjet() {
  document.getElementById('projetNom').value = projet.nom || '';
  document.getElementById('projetClient').value = projet.client || '';
  document.getElementById('projetChantier').value = projet.chantier || '';
  document.getElementById('projetNumero').value = projet.numero || '';
  document.getElementById('projetNotes').value = projet.notes || '';
}

// --- Sauvegarder les infos projet ---
document.getElementById('btnProjetSauv').addEventListener('click', function() {
  projet.nom = document.getElementById('projetNom').value;
  projet.client = document.getElementById('projetClient').value;
  projet.chantier = document.getElementById('projetChantier').value;
  projet.numero = document.getElementById('projetNumero').value;
  projet.notes = document.getElementById('projetNotes').value;
  
  localStorage.setItem('calepinage_projet', JSON.stringify(projet));
  showToast('✅ Infos projet enregistrées');
  
  // Met à jour le dashboard
  var logo = document.querySelector('.dashboard-logo');
  if (logo) {
    var nomProj = projet.nom ? ' — ' + projet.nom : '';
    logo.textContent = '🏗️ Calepinage Pro' + nomProj;
  }
});

// --- Sauvegarder une version ---
document.getElementById('btnSauvVersion').addEventListener('click', function() {
  var nom = prompt('Nom de la version (ex: v1, version client, etc.) :', 'v' + new Date().toISOString().slice(0,10));
  if (nom !== null) {
    sauvegarderVersion(nom || undefined);
    mettreAJourListeVersions();
  }
});

// --- Charger une version ---
document.getElementById('btnChargerVersion').addEventListener('click', function() {
  var sel = document.getElementById('selectVersions');
  if (sel.value) {
    chargerVersion(sel.value);
    chargerInfosProjet();
    mettreAJourListeVersions();
  } else {
    showToast('⚠️ Sélectionnez une version');
  }
});

// --- Supprimer une version ---
document.getElementById('btnSupprVersion').addEventListener('click', function() {
  var sel = document.getElementById('selectVersions');
  if (sel.value && confirm('Supprimer définitivement cette version ?')) {
    supprimerVersion(sel.value);
    mettreAJourListeVersions();
  }
});

// --- Mettre à jour la liste des versions ---
function mettreAJourListeVersions() {
  var sel = document.getElementById('selectVersions');
  var current = sel.value;
  sel.innerHTML = '';
  
  var list = listerVersions();
  if (list.length === 0) {
    sel.innerHTML = '<option value="">— Aucune version —</option>';
    return;
  }
  
  list.forEach(function(item) {
    var opt = document.createElement('option');
    opt.value = item.key;
    opt.textContent = item.version + ' (' + item.date + ')';
    if (item.key === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

// --- Dashboard avec nom projet ---
function mettreAJourDashboardProjet() {
  var logo = document.querySelector('.dashboard-logo');
  if (logo) {
    var nomProj = projet.nom ? ' — ' + projet.nom : '';
    logo.textContent = '🏗️ Calepinage Pro' + nomProj;
  }
}

// --- INIT PROJET ---
// Charger les infos projet depuis localStorage
var projetSauv = localStorage.getItem('calepinage_projet');
if (projetSauv) {
  try {
    var p = JSON.parse(projetSauv);
    projet.nom = p.nom || projet.nom;
    projet.client = p.client || projet.client;
    projet.chantier = p.chantier || projet.chantier;
    projet.numero = p.numero || projet.numero;
    projet.notes = p.notes || projet.notes;
  } catch(e) {}
}

// Initialiser le dashboard
mettreAJourDashboardProjet();

// Charger les infos dans le formulaire (si le DOM est prêt)
document.addEventListener('DOMContentLoaded', function() {
  chargerInfosProjet();
  mettreAJourListeVersions();
});

// ---- Dans l'init existant, après le chargement de la dernière session ----
// chargerDernierProjet(); // si tu veux charger automatiquement
