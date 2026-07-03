// ============================================================
//  DESSIN CANVAS 2D — MODES PRO & TECHNIQUE
// ============================================================

// Variable globale pour le mode de rendu
var renderMode = 'pro'; // 'pro' ou 'technique'

function dessiner(res) {
  if (!res) return;
  
  // Lire le mode depuis le select
  var sel = document.getElementById('renderStyle');
  if (sel) renderMode = sel.value;
  
  var canvas = document.getElementById('cvs');
  var wrap   = canvas.parentElement;
  var W      = Math.max(wrap.clientWidth - 16, 300);

  var hauteurTotale = res.type === 'pignon'
    ? Math.max(res.hg, res.hd, res.hc)
    : Math.max(res.hg, res.hd);

  // Marges selon le mode
  var mL = renderMode === 'pro' ? 50 : 48;
  var mT = renderMode === 'pro' ? 22 : 20;
  var mB = renderMode === 'pro' ? 60 : 52;

  // Échelle : plus grande en mode pro
  var scaleFactor = renderMode === 'pro' ? 1.15 : 1.0;
  var scale = Math.min(
    (W - mL - 20) / res.larg,
    (800 - mT - mB) / hauteurTotale
  ) * scaleFactor;

  var H = Math.round(hauteurTotale * scale) + mT + mB;
  canvas.width  = W;
  canvas.height = H;

  var ctx    = canvas.getContext('2d');
  var sc     = scale;
  var largPx = res.larg * sc;
  var hgPx   = res.hg   * sc;
  var hdPx   = res.hd   * sc;
  var hcPx   = res.type === 'pignon' ? res.hc * sc : 0;
  var yBase  = H - mB;

  // ============================================================
  //  1. FOND
  // ============================================================
  if (renderMode === 'pro') {
    // Fond "papier" avec texture légère
    var gradBg = ctx.createLinearGradient(0, 0, 0, H);
    gradBg.addColorStop(0, '#F8FAFC');
    gradBg.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, W, H);
    
    // Petit motif quadrillage léger
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 0.5;
    for (var g = 0; g < W; g += 20) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, H);
      ctx.stroke();
    }
    for (var g2 = 0; g2 < H; g2 += 20) {
      ctx.beginPath();
      ctx.moveTo(0, g2);
      ctx.lineTo(W, g2);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Fond blanc pur (mode technique)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
  }

  // ============================================================
  //  2. LAMES
  // ============================================================
  var hR = (res.hu + res.joint) * sc;
  var lP = res.lu * sc;
  var hautTotLames = res.type === 'pignon'
    ? res.hc
    : Math.max(res.hg, res.hd);
  var nbRTotal = Math.ceil(hautTotLames / (res.hu + res.joint));

  // Couleurs par matériau (mode pro)
  var mat = (res.typeMat || 'composite').toLowerCase();
  var colors = {
    composite: {
      entiere: ['#A1887F', '#8D6E63', '#795548', '#6D4C41'],
      ombre: 'rgba(60,40,30,0.2)',
      reflet: 'rgba(255,255,255,0.15)'
    },
    fibrociment: {
      entiere: ['#C8D6C0', '#B0C4B1', '#90A98E', '#7A9A78'],
      ombre: 'rgba(60,80,60,0.15)',
      reflet: 'rgba(255,255,255,0.1)'
    },
    metal: {
      entiere: ['#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C'],
      ombre: 'rgba(30,40,50,0.2)',
      reflet: 'rgba(255,255,255,0.25)'
    }
  };
  var matColors = colors[mat] || colors.composite;

  // Clip sur la forme de la façade
  ctx.save();
  ctx.beginPath();
  if (res.type === 'facade') {
    ctx.moveTo(mL,          yBase - hgPx);
    ctx.lineTo(mL + largPx, yBase - hdPx);
    ctx.lineTo(mL + largPx, yBase);
    ctx.lineTo(mL,          yBase);
  } else {
    var xPtrPx  = largPx / 2;
    var xPlatGpx = res.largHG * sc;
    var xPlatDpx = (res.larg - res.largHD) * sc;
    ctx.moveTo(mL,                yBase - res.hg * sc);
    if (res.largHG > 0) ctx.lineTo(mL + xPlatGpx,  yBase - res.hg * sc);
    ctx.lineTo(mL + xPtrPx,       yBase - res.hc * sc);
    if (res.largHD > 0) ctx.lineTo(mL + xPlatDpx,  yBase - res.hd * sc);
    ctx.lineTo(mL + largPx,       yBase - res.hd * sc);
    ctx.lineTo(mL + largPx,       yBase);
    ctx.lineTo(mL,                yBase);
  }
  ctx.closePath();
  ctx.clip();

  // Parcours des rangées
  for (var i = 0; i < nbRTotal; i++) {
    var yLame = yBase - (i + 1) * hR;
    var hLame = hR - res.joint * sc;
    if (hLame <= 0) continue;

    var nbLamesRow = Math.ceil(largPx / lP) + 1;
    for (var j = 0; j < nbLamesRow; j++) {
      var xLame = mL + j * lP;
      var wLame = Math.min(lP, mL + largPx - xLame);
      if (wLame < 2) continue;

      var ratio = wLame / lP;
      var isEntiere = ratio >= 0.95;
      var isDecoupee = ratio > 0.05 && ratio < 0.95;
      var isChute = ratio <= 0.05;

      // Vérifier si on est dans une ouverture
      var isOuv = false;
      res.ouvertures.forEach(function(o) {
        var ox = mL + o.x * sc, ow = o.larg * sc;
        var oy = yBase - (o.y + o.haut) * sc, oh = o.haut * sc;
        if (xLame < ox + ow && xLame + wLame > ox && yLame < oy + oh && yLame + hLame > oy) {
          isOuv = true;
        }
      });

      // ============================================================
      //  RENDU DES LAMES SELON LE MODE
      // ============================================================
      
      if (renderMode === 'pro') {
        // ---------- MODE PRO ----------
        if (isEntiere) {
          // Dégradé matière
          var gradLame = ctx.createLinearGradient(0, yLame, 0, yLame + hLame);
          gradLame.addColorStop(0, matColors.entiere[0]);
          gradLame.addColorStop(0.3, matColors.entiere[1]);
          gradLame.addColorStop(0.7, matColors.entiere[2]);
          gradLame.addColorStop(1, matColors.entiere[3]);
          ctx.fillStyle = gradLame;
          ctx.fillRect(xLame, yLame, wLame, hLame);

          // Ombre en bas de lame
          var gradShadow = ctx.createLinearGradient(0, yLame + hLame - 4, 0, yLame + hLame);
          gradShadow.addColorStop(0, 'rgba(0,0,0,0)');
          gradShadow.addColorStop(1, matColors.ombre);
          ctx.fillStyle = gradShadow;
          ctx.fillRect(xLame, yLame + hLame - 4, wLame, 4);

          // Reflet en haut de lame
          var gradReflect = ctx.createLinearGradient(0, yLame, 0, yLame + 5);
          gradReflect.addColorStop(0, matColors.reflet);
          gradReflect.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gradReflect;
          ctx.fillRect(xLame, yLame, wLame, 5);

        } else if (isDecoupee) {
          // Lame découpée : orange avec hachures fines
          ctx.fillStyle = '#FFA726';
          ctx.fillRect(xLame, yLame, wLame, hLame);
          ctx.save();
          ctx.beginPath();
          ctx.rect(xLame, yLame, wLame, hLame);
          ctx.clip();
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 1;
          for (var d = -hLame; d < wLame + hLame; d += 6) {
            ctx.beginPath();
            ctx.moveTo(xLame + d, yLame);
            ctx.lineTo(xLame + d + hLame, yLame + hLame);
            ctx.stroke();
          }
          ctx.restore();
          ctx.strokeStyle = 'rgba(200,120,30,0.4)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(xLame, yLame, wLame, hLame);

        } else if (isChute) {
          // Chute : rouge avec hachures diagonales
          ctx.fillStyle = '#EF5350';
          ctx.fillRect(xLame, yLame, wLame, hLame);
          ctx.save();
          ctx.beginPath();
          ctx.rect(xLame, yLame, wLame, hLame);
          ctx.clip();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.5;
          for (var d2 = -hLame; d2 < wLame + hLame; d2 += 8) {
            ctx.beginPath();
            ctx.moveTo(xLame + d2, yLame);
            ctx.lineTo(xLame + d2 + hLame, yLame + hLame);
            ctx.stroke();
          }
          ctx.restore();
          ctx.strokeStyle = 'rgba(180,40,40,0.5)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(xLame, yLame, wLame, hLame);
        }
        
        // Surimpression des ouvertures
        if (isOuv) {
          ctx.fillStyle = 'rgba(148,163,184,0.45)';
          ctx.fillRect(xLame, yLame, wLame, hLame);
        }
        
      } else {
        // ---------- MODE TECHNIQUE ----------
        var colEntiere, colDecoupee, colChute;
        if (mat === 'metal' || mat === 'acier') {
          colEntiere = '#B0BEC5'; colDecoupee = '#FFA726'; colChute = '#EF5350';
        } else if (mat === 'fibrociment') {
          colEntiere = '#B0C4B1'; colDecoupee = '#FFA726'; colChute = '#EF5350';
        } else {
          colEntiere = '#90A4AE'; colDecoupee = '#FFA726'; colChute = '#EF5350';
        }
        
        if (isEntiere) {
          ctx.fillStyle = colEntiere;
        } else if (isDecoupee) {
          ctx.fillStyle = colDecoupee;
        } else {
          ctx.fillStyle = colChute;
        }
        ctx.fillRect(xLame, yLame, wLame, hLame);
        
        // Bordure fine pour délimiter
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(xLame, yLame, wLame, hLame);
        
        // Surimpression des ouvertures
        if (isOuv) {
          ctx.fillStyle = 'rgba(148,163,184,0.5)';
          ctx.fillRect(xLame, yLame, wLame, hLame);
        }
      }
    }
  }

  ctx.restore();

  // ============================================================
  //  3. CONTOUR DE LA FAÇADE
  // ============================================================
  ctx.save();
  if (renderMode === 'pro') {
    ctx.strokeStyle = '#1B3A6B';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 6;
  } else {
    ctx.strokeStyle = '#1B3A6B';
    ctx.lineWidth = 2;
  }
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (res.type === 'facade') {
    ctx.moveTo(mL,          yBase);
    ctx.lineTo(mL,          yBase - hgPx);
    ctx.lineTo(mL + largPx, yBase - hdPx);
    ctx.lineTo(mL + largPx, yBase);
    ctx.lineTo(mL,          yBase);
  } else {
    var xPtrPx2   = largPx / 2;
    var xPlatGpx2 = res.largHG * sc;
    var xPlatDpx2 = (res.larg - res.largHD) * sc;
    ctx.moveTo(mL, yBase);
    ctx.lineTo(mL, yBase - res.hg * sc);
    if (res.largHG > 0) ctx.lineTo(mL + xPlatGpx2, yBase - res.hg * sc);
    ctx.lineTo(mL + xPtrPx2, yBase - res.hc * sc);
    if (res.largHD > 0) ctx.lineTo(mL + xPlatDpx2, yBase - res.hd * sc);
    ctx.lineTo(mL + largPx, yBase - res.hd * sc);
    ctx.lineTo(mL + largPx, yBase);
    ctx.lineTo(mL, yBase);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // ============================================================
  //  4. OUVERTURES
  // ============================================================
  res.ouvertures.forEach(function(o) {
    var ox = mL + o.x * sc, ow = o.larg * sc;
    var oy = yBase - (o.y + o.haut) * sc, oh = o.haut * sc;

    if (renderMode === 'pro') {
      // ---------- MODE PRO ----------
      var gradOuv = ctx.createRadialGradient(
        ox + ow/2, oy + oh/2, 0,
        ox + ow/2, oy + oh/2, Math.max(ow, oh)/2
      );
      gradOuv.addColorStop(0, 'rgba(148,163,184,0.75)');
      gradOuv.addColorStop(1, 'rgba(100,116,139,0.5)');
      ctx.fillStyle = gradOuv;
      ctx.fillRect(ox, oy, ow, oh);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, oy, ow, oh);

      // Ombrage intérieur
      ctx.shadowColor = 'rgba(0,0,0,0.05)';
      ctx.shadowBlur = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + 2, oy + 2, ow - 4, oh - 4);
      ctx.shadowBlur = 0;

      // Icône
      ctx.fillStyle = '#1E293B';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.type === 'porte' ? '🚪' : '🪟', ox + ow/2, oy + oh/2 - 2);

      // Étiquette dimensions
      if (ow > 40 && oh > 20) {
        var labelDim = o.larg + '×' + o.haut;
        ctx.font = 'bold 8px Inter, sans-serif';
        var tw = ctx.measureText(labelDim).width;
        ctx.fillStyle = 'rgba(30,41,59,0.7)';
        ctx.roundRect(ox + ow/2 - tw/2 - 3, oy + oh - 11, tw + 6, 10, 3);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(labelDim, ox + ow/2, oy + oh - 3);
      }
      
    } else {
      // ---------- MODE TECHNIQUE ----------
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.fillRect(ox, oy, ow, oh);
      
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, oy, ow, oh);
      
      // Hachures diagonales
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, ow, oh);
      ctx.clip();
      ctx.strokeStyle = 'rgba(100,116,139,0.2)';
      ctx.lineWidth = 0.5;
      for (var d3 = -oh; d3 < ow + oh; d3 += 6) {
        ctx.beginPath();
        ctx.moveTo(ox + d3, oy);
        ctx.lineTo(ox + d3 + oh, oy + oh);
        ctx.stroke();
      }
      ctx.restore();
      
      // Icône plus petite
      ctx.fillStyle = '#1E293B';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.type === 'porte' ? '🚪' : '🪟', ox + ow/2, oy + oh/2);
    }
  });

  // ============================================================
  //  5. LABEL PIGNON
  // ============================================================
  if (res.type === 'pignon') {
    var hMinLbl = Math.min(res.hg, res.hd);
    var yLbl = yBase - hMinLbl * sc - (res.hc - hMinLbl) * sc * 0.4;
    
    if (renderMode === 'pro') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 11px Inter, sans-serif';
      var twLbl = ctx.measureText('PIGNON').width;
      ctx.roundRect(mL + 6, yLbl - 9, twLbl + 12, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#1B3A6B';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('PIGNON', mL + 12, yLbl + 1);
    } else {
      ctx.fillStyle = 'rgba(30,41,59,0.6)';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('PIGNON', mL + 6, yLbl);
    }
  }

  // ============================================================
  //  6. JOINTS DE DILATATION
  // ============================================================
  if (res.nbJD > 0) {
    ctx.save();
    ctx.strokeStyle = renderMode === 'pro' ? '#EF4444' : '#DC2626';
    ctx.lineWidth = renderMode === 'pro' ? 1.5 : 1;
    ctx.setLineDash([5, 5]);
    for (var k = 1; k <= res.nbJD; k++) {
      var yJD = yBase - k * 6000 * sc;
      if (yJD < mT) break;
      ctx.beginPath();
      ctx.moveTo(mL, yJD);
      ctx.lineTo(mL + largPx, yJD);
      ctx.stroke();
      
      if (renderMode === 'pro') {
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 9px Inter, sans-serif';
        var twJD = ctx.measureText('Joint Ø').width;
        ctx.fillStyle = '#FFFFFF';
        ctx.roundRect(mL + 4, yJD - 11, twJD + 10, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Joint Ø', mL + 9, yJD - 2);
      } else {
        ctx.fillStyle = '#DC2626';
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('JD', mL + 4, yJD - 1);
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ============================================================
  //  7. NUMÉROS DE COLONNES (mode technique uniquement)
  // ============================================================
  if (renderMode === 'technique') {
    ctx.save();
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var yNum = yBase - nbRTotal * hR + hR / 2;
    var nbCols = Math.ceil(largPx / lP);
    for (var cn = 0; cn < nbCols; cn++) {
      var wN = Math.min(lP, mL + largPx - (mL + cn * lP));
      if (wN < 6) continue;
      var xN = mL + cn * lP + wN / 2;
      var r2 = wN / lP;
      ctx.fillStyle = r2 >= 0.95 ? '#155E75' : (r2 > 0.05 ? '#92400E' : '#991B1B');
      ctx.fillText(cn + 1, xN, yNum);
    }
    ctx.restore();
  }

  // ============================================================
  //  8. COTES
  // ============================================================
  if (renderMode === 'pro') {
    _drawCotePro(ctx, mL, yBase, mL + largPx, yBase, res.larg + ' mm', 'bottom');
    _drawCotePro(ctx, mL, yBase, mL, yBase - hgPx, res.hg + ' mm', 'left');
    _drawCotePro(ctx, mL + largPx, yBase, mL + largPx, yBase - hdPx, res.hd + ' mm', 'right');
  } else {
    _drawCoteTech(ctx, mL, yBase, mL + largPx, yBase, res.larg + ' mm', 'bottom');
    _drawCoteTech(ctx, mL, yBase, mL, yBase - hgPx, res.hg + ' mm', 'left');
  }

  // ============================================================
  //  9. CARTOUCHE
  // ============================================================
  if (renderMode === 'pro') {
    // ---------- CARTOUCHE PRO ----------
    var cH = 34;
    var cY = H - cH - 4;
    var grad = ctx.createLinearGradient(mL, 0, mL + largPx, 0);
    grad.addColorStop(0, '#1B3A6B');
    grad.addColorStop(0.5, '#2563EB');
    grad.addColorStop(1, '#1B3A6B');

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(mL, cY, largPx, cH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('▪ ' + (res.nom || 'Façade'), mL + 12, cY + cH/2);

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    var matLabel = res.typeMat.charAt(0).toUpperCase() + res.typeMat.slice(1);
    ctx.fillText(matLabel, mL + largPx/2, cY + cH/2);

    ctx.textAlign = 'right';
    ctx.fillText(
      res.sBrute.toFixed(2) + ' m²  ·  ' + res.nbTotal + ' lames',
      mL + largPx - 12, cY + cH/2
    );

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mL + 8, cY + cH - 4);
    ctx.lineTo(mL + largPx - 8, cY + cH - 4);
    ctx.stroke();
    ctx.restore();
    
  } else {
    // ---------- CARTOUCHE TECHNIQUE ----------
    var cH = 26;
    var cY = H - cH - 2;
    
    ctx.save();
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#1B3A6B';
    ctx.lineWidth = 1.5;
    ctx.rect(mL, cY, largPx, cH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1B3A6B';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(res.nom || 'Façade', mL + 8, cY + cH/2);

    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      res.sBrute.toFixed(2) + ' m²  ·  ' + res.nbTotal + ' lames',
      mL + largPx - 8, cY + cH/2
    );
    ctx.restore();
  }

  // ============================================================
  //  10. ÉCHELLE GRAPHIQUE (mode pro uniquement)
  // ============================================================
  if (renderMode === 'pro') {
    var echelleX = mL + 10;
    var echelleY = yBase + 14;
    var echellePx = 100 * sc;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.roundRect(echelleX - 4, echelleY - 12, echellePx + 8, 20, 4);
    ctx.fill();

    ctx.strokeStyle = '#1B3A6B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(echelleX, echelleY);
    ctx.lineTo(echelleX + echellePx, echelleY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(echelleX, echelleY - 4);
    ctx.lineTo(echelleX, echelleY + 4);
    ctx.moveTo(echelleX + echellePx, echelleY - 4);
    ctx.lineTo(echelleX + echellePx, echelleY + 4);
    ctx.stroke();

    ctx.fillStyle = '#1B3A6B';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var echelleMm = Math.round(100 / sc * 1000);
    var echelleStr = echelleMm >= 1000
      ? (echelleMm / 1000).toFixed(1) + ' m'
      : echelleMm + ' mm';
    ctx.fillText(echelleStr, echelleX + echellePx/2, echelleY + 6);
    ctx.restore();
  }
}

// ============================================================
//  FONCTIONS COTES
// ============================================================

// --- Cotes mode PRO ---
function _drawCotePro(ctx, x1, y1, x2, y2, label, side) {
  var off = 24, arr = 6;
  ctx.save();
  ctx.strokeStyle = '#1B3A6B';
  ctx.fillStyle = '#1B3A6B';
  ctx.lineWidth = 1.2;

  if (y1 === y2) {
    var yc = y1 + (side === 'bottom' ? off : -off);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1, yc);
    ctx.moveTo(x2, y2); ctx.lineTo(x2, yc);
    ctx.moveTo(x1, yc); ctx.lineTo(x2, yc);
    ctx.moveTo(x1, yc); ctx.lineTo(x1 + arr, yc - arr);
    ctx.moveTo(x1, yc); ctx.lineTo(x1 + arr, yc + arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2 - arr, yc - arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2 - arr, yc + arr);
    ctx.stroke();

    ctx.font = 'bold 10px Inter, sans-serif';
    var tw = ctx.measureText(label).width;
    var lx = (x1 + x2) / 2 - tw/2 - 5;
    var ly = yc + (side === 'bottom' ? 2 : -12);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, tw + 10, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#1B3A6B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, (x1 + x2) / 2, yc + (side === 'bottom' ? 8 : -6));

  } else {
    var xc = x1 + (side === 'left' ? -off : off);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(xc, y1);
    ctx.moveTo(x2, y2); ctx.lineTo(xc, y2);
    ctx.moveTo(xc, y1); ctx.lineTo(xc, y2);
    ctx.moveTo(xc, y1); ctx.lineTo(xc - arr, y1 + arr);
    ctx.moveTo(xc, y1); ctx.lineTo(xc + arr, y1 + arr);
    ctx.moveTo(xc, y2); ctx.lineTo(xc - arr, y2 - arr);
    ctx.moveTo(xc, y2); ctx.lineTo(xc + arr, y2 - arr);
    ctx.stroke();

    ctx.font = 'bold 10px Inter, sans-serif';
    var tw = ctx.measureText(label).width;
    var lx = xc + (side === 'left' ? -tw - 10 : 6);
    var ly = (y1 + y2) / 2 - 7;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, tw + 10, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#1B3A6B';
    ctx.translate(xc + (side === 'left' ? -6 : 6), (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  }
  ctx.restore();
}

// --- Cotes mode TECHNIQUE ---
function _drawCoteTech(ctx, x1, y1, x2, y2, label, side) {
  var off = 18, arr = 4;
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.fillStyle = '#334155';
  ctx.lineWidth = 0.8;
  ctx.font = 'bold 9px Inter, sans-serif';

  if (y1 === y2) {
    var yc = y1 + (side === 'bottom' ? off : -off);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1, yc);
    ctx.moveTo(x2, y2); ctx.lineTo(x2, yc);
    ctx.moveTo(x1, yc); ctx.lineTo(x2, yc);
    ctx.moveTo(x1, yc); ctx.lineTo(x1 + arr, yc - arr);
    ctx.moveTo(x1, yc); ctx.lineTo(x1 + arr, yc + arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2 - arr, yc - arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2 - arr, yc + arr);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, (x1 + x2) / 2, yc + (side === 'bottom' ? -7 : 7));
  } else {
    var xc = x1 + (side === 'left' ? -off : off);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(xc, y1);
    ctx.moveTo(x2,
