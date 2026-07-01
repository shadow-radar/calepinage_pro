// ============================================================
//  DESSIN CANVAS 2D
// ============================================================
function dessiner(res) {
  if (!res) return;
  var canvas = document.getElementById('cvs');
  var wrap   = canvas.parentElement;
  var W      = Math.max(wrap.clientWidth - 16, 300);

  var hauteurTotale = res.type === 'pignon'
    ? Math.max(res.hg, res.hd, res.hc)
    : Math.max(res.hg, res.hd);

  // Marges
  var mL = 58, mT = 28, mB = 70;

  // Échelle : on cale la largeur, puis on vérifie que la hauteur ne dépasse pas
  var scale = (W - mL - 20) / res.larg;
  var dessinH = hauteurTotale * scale;
  if (dessinH + mT + mB > 800) {
    scale   = (800 - mT - mB) / hauteurTotale;
  }
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

  // --- FOND ---
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, W, H);

  // --- LAMES ---
  var hR = (res.hu + res.joint) * sc;   // hauteur d'une rangée
  var lP = res.lu * sc;                  // largeur d'une colonne

  var hautTotLames = res.type === 'pignon'
    ? res.hc
    : Math.max(res.hg, res.hd);
  var nbRTotal = Math.ceil(hautTotLames / (res.hu + res.joint));

  // Couleurs matériau
  var colEntiere, colDecoupee, colChute;
  var mat = (res.typeMat || 'composite').toLowerCase();
  if (mat === 'metal' || mat === 'acier') {
    colEntiere = '#B0BEC5'; colDecoupee = '#FFA726'; colChute = '#EF5350';
  } else if (mat === 'fibrociment') {
    colEntiere = '#B0C4B1'; colDecoupee = '#FFA726'; colChute = '#EF5350';
  } else {
    colEntiere = '#90A4AE'; colDecoupee = '#FFA726'; colChute = '#EF5350';
  }

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

  // PASS 1 — remplissage lames
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
      if (ratio >= 0.95)      ctx.fillStyle = colEntiere + 'CC';
      else if (ratio > 0.05)  ctx.fillStyle = colDecoupee + 'CC';
      else                    ctx.fillStyle = colChute    + 'CC';
      // Ouvertures
      var isOuv = false;
      res.ouvertures.forEach(function(o) {
        var ox = mL + o.x * sc, ow = o.larg * sc;
        var oy = yBase - (o.y + o.haut) * sc, oh = o.haut * sc;
        if (xLame < ox+ow && xLame+wLame > ox && yLame < oy+oh && yLame+hLame > oy) isOuv = true;
      });
      if (isOuv) ctx.fillStyle = '#94A3B855';
      ctx.fillRect(xLame, yLame, wLame, hLame);
    }
  }

  // PASS 2 — grille
  ctx.strokeStyle = 'rgba(30,41,59,0.55)';
  ctx.lineWidth   = 0.8;
  var nbCols = Math.ceil(largPx / lP);
  ctx.beginPath();
  for (var c = 1; c < nbCols; c++) {
    var xCol = mL + c * lP;
    ctx.moveTo(xCol, yBase - nbRTotal * hR);
    ctx.lineTo(xCol, yBase);
  }
  for (var i2 = 1; i2 < nbRTotal; i2++) {
    var yRow = yBase - i2 * hR;
    ctx.moveTo(mL,          yRow);
    ctx.lineTo(mL + largPx, yRow);
  }
  ctx.stroke();

  ctx.restore();

  // PASS 3 — numéros de colonnes (1ère rangée)
  ctx.save();
  ctx.font          = 'bold 10px Inter, sans-serif';
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';
  var yNum = yBase - nbRTotal * hR + hR / 2;
  for (var cn = 0; cn < nbCols; cn++) {
    var wN = Math.min(lP, mL + largPx - (mL + cn * lP));
    if (wN < 6) continue;
    var xN = mL + cn * lP + wN / 2;
    var r2 = wN / lP;
    ctx.fillStyle = r2 >= 0.95 ? '#155E75' : (r2 > 0.05 ? '#92400E' : '#991B1B');
    ctx.fillText(cn + 1, xN, yNum);
  }
  ctx.restore();

  // --- OUVERTURES ---
  res.ouvertures.forEach(function(o) {
    var ox = mL + o.x * sc, ow = o.larg * sc;
    var oy = yBase - (o.y + o.haut) * sc, oh = o.haut * sc;
    ctx.fillStyle   = 'rgba(148,163,184,0.6)';
    ctx.fillRect(ox, oy, ow, oh);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(ox, oy, ow, oh);
    ctx.fillStyle   = '#1E293B';
    ctx.font        = '12px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.type === 'porte' ? '🚪' : '🪟', ox + ow / 2, oy + oh / 2);
  });

  // --- LABEL PIGNON ---
  if (res.type === 'pignon') {
    ctx.fillStyle    = '#64748B';
    ctx.font         = '10px Inter, sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    var hMinLbl = Math.min(res.hg, res.hd);
    ctx.fillText('Pignon', mL + 6, yBase - hMinLbl * sc - (res.hc - hMinLbl) * sc * 0.4);
  }

  // --- CONTOUR ---
  ctx.strokeStyle = '#1B3A6B';
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
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
    if (res.largHG > 0) ctx.moveTo(mL + xPlatGpx2, yBase - res.hg * sc);
    ctx.lineTo(mL + xPtrPx2, yBase - res.hc * sc);
    if (res.largHD > 0) ctx.lineTo(mL + xPlatDpx2, yBase - res.hd * sc);
    ctx.moveTo(mL + largPx, yBase - res.hd * sc);
    ctx.lineTo(mL + largPx, yBase);
    ctx.lineTo(mL, yBase);
  }
  ctx.stroke();

  // --- JOINT DE DILATATION ---
  if (res.nbJD > 0) {
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth   = 1;
    ctx.setLineDash([5, 4]);
    for (var k = 1; k <= res.nbJD; k++) {
      var yJD = yBase - k * 6000 * sc;
      if (yJD < mT) break;
      ctx.beginPath();
      ctx.moveTo(mL,          yJD);
      ctx.lineTo(mL + largPx, yJD);
      ctx.stroke();
      ctx.fillStyle   = '#EF4444';
      ctx.font        = '9px Inter, sans-serif';
      ctx.textAlign   = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Joint Ø', mL + 4, yJD - 1);
    }
    ctx.setLineDash([]);
  }

  // --- COTES ---
  _drawCote(ctx, mL, yBase, mL + largPx, yBase, res.larg + ' mm', 'bottom');
  _drawCote(ctx, mL, yBase, mL, yBase - hgPx, res.hg + ' mm', 'left');

  // --- CARTOUCHE ---
  var cH = 26;
  var cY = H - cH - 2;
  // fond dégradé
  var grad = ctx.createLinearGradient(mL, 0, mL + largPx, 0);
  grad.addColorStop(0,   '#1B3A6B');
  grad.addColorStop(1,   '#2563EB');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(mL, cY, largPx, cH, 4);
  ctx.fill();
  // textes
  ctx.fillStyle    = '#FFFFFF';
  ctx.font         = 'bold 10px Inter, sans-serif';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('▪ ' + (res.nom || 'Façade'), mL + 8, cY + cH / 2);
  ctx.font      = '9px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    'Surface : ' + res.sBrute.toFixed(2) + ' m²  ·  Lames : ' + res.nbTotal + ' u  ·  1/' + Math.round(1000 / scale),
    mL + largPx - 8, cY + cH / 2
  );
}

function _drawCote(ctx, x1, y1, x2, y2, label, side) {
  var off = 20, arr = 5;
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.fillStyle   = '#334155';
  ctx.lineWidth   = 0.8;
  ctx.font        = 'bold 9px Inter, sans-serif';

  if (y1 === y2) {
    var yc = y1 + (side === 'bottom' ? off : -off);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1, yc);
    ctx.moveTo(x2, y2); ctx.lineTo(x2, yc);
    ctx.moveTo(x1, yc); ctx.lineTo(x2, yc);
    ctx.moveTo(x1, yc); ctx.lineTo(x1+arr, yc-arr);
    ctx.moveTo(x1, yc); ctx.lineTo(x1+arr, yc+arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2-arr, yc-arr);
    ctx.moveTo(x2, yc); ctx.lineTo(x2-arr, yc+arr);
    ctx.stroke();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, (x1+x2)/2, yc + (side === 'bottom' ? -7 : 7));
  } else {
    var xc = x1 + (side === 'left' ? -off : off);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(xc, y1);
    ctx.moveTo(x2, y2); ctx.lineTo(xc, y2);
    ctx.moveTo(xc, y1); ctx.lineTo(xc, y2);
    ctx.moveTo(xc, y1); ctx.lineTo(xc-arr, y1+arr);
    ctx.moveTo(xc, y1); ctx.lineTo(xc+arr, y1+arr);
    ctx.moveTo(xc, y2); ctx.lineTo(xc-arr, y2-arr);
    ctx.moveTo(xc, y2); ctx.lineTo(xc+arr, y2-arr);
    ctx.stroke();
    ctx.translate(xc + (side === 'left' ? -3 : 3), (y1+y2)/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
  }
  ctx.restore();
}
