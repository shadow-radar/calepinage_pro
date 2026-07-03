// ============================================================
//  DESSIN CANVAS 2D — VERSION PRO AVEC RENDU RÉALISTE
// ============================================================

function dessiner(res) {
  if (!res) return;
  var canvas = document.getElementById('cvs');
  var wrap   = canvas.parentElement;
  var W      = Math.max(wrap.clientWidth - 16, 300);

  var hauteurTotale = res.type === 'pignon'
    ? Math.max(res.hg, res.hd, res.hc)
    : Math.max(res.hg, res.hd);

  // Marges réduites pour plus de place
  var mL = 50, mT = 22, mB = 60;

  // Échelle : on agrandit un peu pour un meilleur rendu
  var scale = Math.min(
    (W - mL - 20) / res.larg,
    (800 - mT - mB) / hauteurTotale
  ) * 1.15; // +15% de zoom

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
  //  1. FOND "PAPIER" AVEC TEXTURE LÉGÈRE
  // ============================================================
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

  // ============================================================
  //  2. LAMES AVEC RENDU RÉALISTE
  // ============================================================
  var hR = (res.hu + res.joint) * sc;
  var lP = res.lu * sc;
  var hautTotLames = res.type === 'pignon'
    ? res.hc
    : Math.max(res.hg, res.hd);
  var nbRTotal = Math.ceil(hautTotLames / (res.hu + res.joint));

  // Couleurs par matériau
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

      // ---- Vérifier si on est dans une ouverture ----
      var isOuv = false;
      res.ouvertures.forEach(function(o) {
        var ox = mL + o.x * sc, ow = o.larg * sc;
        var oy = yBase - (o.y + o.haut) * sc, oh = o.haut * sc;
        if (xLame < ox + ow && xLame + wLame > ox && yLame < oy + oh && yLame + hLame > oy) {
          isOuv = true;
        }
      });

      // ---- RENDU DES LAMES ----
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
        // Bordure pour matérialiser la découpe
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
        // Bordure rouge foncé
        ctx.strokeStyle = 'rgba(180,40,40,0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(xLame, yLame, wLame, hLame);
      }

      // ---- SURIMPRESSION DES OUVERTURES ----
      if (isOuv) {
        ctx.fillStyle = 'rgba(148,163,184,0.45)';
        ctx.fillRect(xLame, yLame, wLame, hLame);
      }
    }
  }

  ctx.restore();

  // ============================================================
  //  3. CONTOUR DE LA FAÇADE
  // ============================================================
  ctx.save();
  ctx.strokeStyle = '#1B3A6B';
  ctx.lineWidth   = 3;
  ctx.lineJoin    = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur  = 6;
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
  //  4. OUVERTURES AVEC STYLE MODERNE
  // ============================================================
  res.ouvertures.forEach(function(o) {
    var ox = mL + o.x * sc, ow = o.larg * sc;
    var oy = yBase - (o.y + o.haut) * sc, oh = o.haut * sc;

    // Fond dégradé
    var gradOuv = ctx.createRadialGradient(
      ox + ow/2, oy + oh/2, 0,
      ox + ow/2, oy + oh/2, Math.max(ow, oh)/2
    );
    gradOuv.addColorStop(0, 'rgba(148,163,184,0.75)');
    gradOuv.addColorStop(1, 'rgba(100,116,139,0.5)');
    ctx.fillStyle = gradOuv;
    ctx.fillRect(ox, oy, ow, oh);

    // Bordure
    ctx.strokeStyle = '#475569';
    ctx.lineWidth   = 2;
    ctx.strokeRect(ox, oy, ow, oh);

    // Ombrage intérieur
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur  = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(ox + 2, oy + 2, ow - 4, oh - 4);
    ctx.shadowBlur = 0;

    // Icône
    ctx.fillStyle   = '#1E293B';
    ctx.font        = '18px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.type === 'porte' ? '🚪' : '🪟', ox + ow/2, oy + oh/2 - 2);

    // Étiquette dimensions
    if (ow > 40 && oh > 20) {
      ctx.fillStyle   = 'rgba(255,255,255,0.8)';
      ctx.font        = 'bold 8px Inter, sans-serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'bottom';
      var labelDim = o.larg + '×' + o.haut;
      var tw = ctx.measureText(labelDim).width;
      ctx.fillStyle = 'rgba(30,41,59,0.7)';
      ctx.roundRect(ox + ow/2 - tw/2 - 3, oy + oh - 11, tw + 6, 10, 3);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelDim, ox + ow/2, oy + oh - 3);
    }
  });

  // ============================================================
  //  5. LABEL PIGNON
  // ============================================================
  if (res.type === 'pignon') {
    ctx.fillStyle    = 'rgba(100,116,139,0.6)';
    ctx.font         = 'bold 11px Inter, sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    var hMinLbl = Math.min(res.hg, res.hd);
    var yLbl = yBase - hMinLbl * sc - (res.hc - hMinLbl) * sc * 0.4;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    var twLbl = ctx.measureText('PIGNON').width;
    ctx.roundRect(mL + 6, yLbl - 9, twLbl + 12, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#1B3A6B';
    ctx.fillText('PIGNON', mL + 12, yLbl + 1);
  }

  // ============================================================
  //  6. JOINTS DE DILATATION
  // ============================================================
  if (res.nbJD > 0) {
    ctx.save();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 5]);
    for (var k = 1; k <= res.nbJD; k++) {
      var yJD = yBase - k * 6000 * sc;
      if (yJD < mT) break;
      ctx.beginPath();
      ctx.moveTo(mL,          yJD);
      ctx.lineTo(mL + largPx, yJD);
      ctx.stroke();
      ctx.fillStyle   = '#EF4444';
      ctx.font        = 'bold 9px Inter, sans-serif';
      ctx.textAlign   = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(239,68,68,0.85)';
      var twJD = ctx.measureText('Joint Ø').width;
      ctx.fillStyle = '#FFFFFF';
      ctx.roundRect(mL + 4, yJD - 11, twJD + 10, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.fillText('Joint Ø', mL + 9, yJD - 2);
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ============================================================
  //  7. COTES AVEC STYLE PRO
  // ============================================================
  _drawCotePro(ctx, mL, yBase, mL + largPx, yBase, res.larg + ' mm', 'bottom');
  _drawCotePro(ctx, mL, yBase, mL, yBase - hgPx, res.hg + ' mm', 'left');

  // Cote supplémentaire à droite pour la hauteur droite
  _drawCotePro(ctx, mL + largPx, yBase, mL + largPx, yBase - hdPx, res.hd + ' mm', 'right');

  // ============================================================
  //  8. CARTOUCHE MODERNE
  // ============================================================
  var cH = 34;
  var cY = H - cH - 4;
  var grad = ctx.createLinearGradient(mL, 0, mL + largPx, 0);
  grad.addColorStop(0,   '#1B3A6B');
  grad.addColorStop(0.5, '#2563EB');
  grad.addColorStop(1,   '#1B3A6B');

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur  = 8;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(mL, cY, largPx, cH, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Texte
  ctx.fillStyle    = '#FFFFFF';
  ctx.font         = 'bold 11px Inter, sans-serif';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('▪ ' + (res.nom || 'Façade'), mL + 12, cY + cH/2);

  // Matériau au centre
  ctx.font      = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  var matLabel = res.typeMat.charAt(0).toUpperCase() + res.typeMat.slice(1);
  ctx.fillText(matLabel, mL + largPx/2, cY + cH/2);

  // Infos à droite
  ctx.textAlign = 'right';
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText(
    res.sBrute.toFixed(2) + ' m²  ·  ' + res.nbTotal + ' lames',
    mL + largPx - 12, cY + cH/2
  );

  // Petite ligne décorative
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(mL + 8, cY + cH - 4);
  ctx.lineTo(mL + largPx - 8, cY + cH - 4);
  ctx.stroke();

  ctx.restore();

  // ============================================================
  //  9. ÉCHELLE GRAPHIQUE (en bas à gauche)
  // ============================================================
  var echelleX = mL + 10;
  var echelleY = yBase + 14;
  var echellePx = 100 * sc;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.roundRect(echelleX - 4, echelleY - 12, echellePx + 8, 20, 4);
  ctx.fill();

  ctx.strokeStyle = '#1B3A6B';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(echelleX, echelleY);
  ctx.lineTo(echelleX + echellePx, echelleY);
  ctx.stroke();
  // Petites barres verticales
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
  var echelleMm = Math.round(100 / sc * 1000); // en mm
  var echelleStr = echelleMm >= 1000
    ? (echelleMm / 1000).toFixed(1) + ' m'
    : echelleMm + ' mm';
  ctx.fillText(echelleStr, echelleX + echellePx/2, echelleY + 6);
  ctx.restore();
}

// ============================================================
//  FONCTION COTE PRO
// ============================================================
function _drawCotePro(ctx, x1, y1, x2, y2, label, side) {
  var off = 24, arr = 6;
  ctx.save();
  ctx.strokeStyle = '#1B3A6B';
  ctx.fillStyle   = '#1B3A6B';
  ctx.lineWidth   = 1.2;

  if (y1 === y2) {
    // Cote horizontale
    var yc = y1 + (side === 'bottom' ? off : -off);

    // Lignes de repère
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1, yc);
    ctx.moveTo(x2, y2); ctx.lineTo(x2, yc);
    ctx.moveTo(x1, yc); ctx.lineTo(x2, yc);
    // Flèches
    ctx.moveTo(x1, yc); ctx.lineTo(x1 + arr, yc - arr);
    ctx.moveTo(x1, yc); ctx.lineTo(x1 + arr, yc + arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2 - arr, yc - arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2 - arr, yc + arr);
    ctx.stroke();

    // Label avec fond blanc
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
    // Cote verticale
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
