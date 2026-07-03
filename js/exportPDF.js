// ============================================================
//  EXPORT PDF — Métré complet + visuel
// ============================================================

/**
 * Exporte un PDF complet avec :
 * - En-tête pro (logo, projet, date)
 * - Récapitulatif des surfaces / lames / temps
 * - Détail par façade (tableau)
 * - Visuel 2D de la façade courante (optionnel)
 */
function exporterPDF() {
  var calc = resFacades.filter(Boolean);
  if (calc.length === 0) {
    showToast('⚠️ Calculez d\'abord les façades');
    return;
  }

  var pdf = new jspdf.jsPDF('p', 'mm', 'a4');
  var pageW = 210;
  var pageH = 297;
  var margin = 15;
  var y = margin;
  var smallFont = 9;
  var normalFont = 11;
  var boldFont = 13;

  // ============================================================
  //  1. EN-TÊTE AVEC LOGO + INFOS PROJET
  // ============================================================
  
  var logoX = margin;
  var logoY = 6;
  var logoW = 40;
  var logoH = 18;

  // --- Logo ---
  try {
    var logoImg = (typeof projet !== 'undefined' && projet.logo) 
      ? projet.logo 
      : 'img/logo-bna.png';
    pdf.addImage(logoImg, 'PNG', logoX, logoY, logoW, logoH);
  } catch(e) {
    // Pas de logo, on continue
  }

  // --- Titre (à côté du logo) ---
  var titleX = logoX + logoW + 5;
  pdf.setFontSize(boldFont);
  pdf.setTextColor('#1B3A6B');
  pdf.text('🏗️ CALEPINAGE PRO — MÉTRÉ', titleX, logoY + 7);

  // --- Infos projet (sous le titre) ---
  pdf.setFontSize(smallFont);
  pdf.setTextColor('#64748B');
  var yInfo = logoY + 13;
  
  if (typeof projet !== 'undefined' && projet.nom) {
    pdf.text('📋 ' + projet.nom, titleX, yInfo);
    yInfo += 5;
  }
  if (typeof projet !== 'undefined' && projet.client) {
    pdf.text('👤 ' + projet.client, titleX, yInfo);
    yInfo += 5;
  }
  if (typeof projet !== 'undefined' && projet.chantier) {
    pdf.text('📍 ' + projet.chantier, titleX, yInfo);
    yInfo += 5;
  }

  // --- Date (tout à droite) ---
  var dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.setFontSize(smallFont);
  pdf.setTextColor('#94A3B8');
  pdf.text('📅 ' + dateStr, pageW - margin, logoY + 7, { align: 'right' });

  // --- Ligne de séparation ---
  y = Math.max(yInfo + 4, logoY + logoH + 8);
  pdf.setDrawColor('#E2E8F0');
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageW - margin, y);
  y += 6;

  // Nombre de façades
  pdf.setFontSize(normalFont);
  pdf.setTextColor('#333333');
  pdf.text('📐 ' + calc.length + ' façade(s) calculée(s)', margin, y);
  y += 10;

  // ============================================================
  //  2. RÉCAPITULATIF GLOBAL
  // ============================================================
  
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

  // Fond gris clair
  pdf.setFillColor('#F0F4F8');
  pdf.rect(margin, y - 2, pageW - 2 * margin, 38, 'F');
  pdf.setFontSize(normalFont);
  pdf.setTextColor('#1B3A6B');
  pdf.text('📊 RÉCAPITULATIF GLOBAL', margin + 3, y + 5);
  y += 9;

  pdf.setFontSize(smallFont);
  pdf.setTextColor('#333333');
  var cols = [
    ['Surface brute', tot.brute.toFixed(1) + ' m²'],
    ['Surface utile', tot.utile.toFixed(1) + ' m²'],
    ['Lames', tot.lames + ' u'],
    ['Vis', tot.vis + ' u'],
    ['Montants 3m', tot.montants + ' u'],
    ['Équerres', tot.equerres + ' u'],
    ['Anti-rongeur', tot.ar + ' u'],
    ['Pare-pluie', tot.pp + ' roul.'],
    ['Durée', Math.ceil(tot.tMin/8) + 'j – ' + Math.ceil(tot.tMax/8) + 'j']
  ];

  var colX = margin + 4;
  var colY = y;
  cols.forEach(function(item, i) {
    var x = colX + (i % 3) * 58;
    var yy = colY + Math.floor(i / 3) * 7;
    pdf.text(item[0] + ' : ' + item[1], x, yy);
  });
  y += 28;

  // ============================================================
  //  3. DÉTAIL PAR FAÇADE
  // ============================================================
  
  pdf.setFontSize(boldFont);
  pdf.setTextColor('#1B3A6B');
  pdf.text('📋 DÉTAIL PAR FAÇADE', margin, y);
  y += 8;

  calc.forEach(function(r, idx) {
    // Vérifier la place
    if (y > pageH - 60) {
      pdf.addPage();
      y = margin + 10;
    }

    // Titre façade
    pdf.setFontSize(normalFont);
    pdf.setTextColor('#1B3A6B');
    pdf.setFont('helvetica', 'bold');
    pdf.text('▪ ' + r.nom, margin, y);
    pdf.setFont('helvetica', 'normal');
    y += 5;

    // Détails
    pdf.setFontSize(smallFont);
    pdf.setTextColor('#333333');
    var details = [
      ['Surface brute', r.sBrute.toFixed(2) + ' m²'],
      ['Ouvertures', '− ' + r.sOuv.toFixed(2) + ' m²'],
      ['Surface utile', r.sUtile.toFixed(2) + ' m²'],
      ['Lames (entières / découpées)', r.nbEntieres + ' / ' + r.nbDecoupees + ' u'],
      ['Taux de chute', r.tauxChute.toFixed(1) + '%'],
      ['Sens de pose', r.sensePose],
      ['Montants 3m', r.nbMontants3m + ' u'],
      ['Équerres', r.nbEquerres + ' u'],
      ['Vis', r.nbVis + ' u'],
      ['Anti-rongeur bas / haut', r.nbARBas + ' / ' + r.nbARHaut + ' u'],
      ['Pare-pluie', r.nbRouleaux + ' rouleau(x) (' + r.formatPP + 'm)'],
      ['Temps de pose', r.tpsMin.toFixed(1) + 'h – ' + r.tpsMax.toFixed(1) + 'h'],
      ['Jours (base 8h)', r.joursMin + 'j – ' + r.joursMax + 'j']
    ];

    if (r.nbJD > 0) {
      details.push(['Joints dilatation', r.mlJD.toFixed(1) + ' ml']);
    }

    var rowH = 4.5;
    details.forEach(function(d) {
      if (y > pageH - 20) {
        pdf.addPage();
        y = margin + 10;
      }
      pdf.text('  ' + d[0] + ' : ' + d[1], margin + 2, y);
      y += rowH;
    });

    // Séparateur
    y += 4;
    pdf.setDrawColor('#E2E8F0');
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
  });

  // ============================================================
  //  4. VISU 2D (façade courante)
  // ============================================================
  
  var canvas = document.getElementById('cvs');
  if (canvas && resFacades[currentVisu]) {
    pdf.addPage();
    y = margin;

    pdf.setFontSize(boldFont);
    pdf.setTextColor('#1B3A6B');
    pdf.text('🎨 VISU 2D — ' + resFacades[currentVisu].nom, margin, y);
    y += 8;

    try {
      var imgData = canvas.toDataURL('image/png');
      var imgW = pageW - 2 * margin;
      var imgH = (canvas.height / canvas.width) * imgW;

      if (imgH > pageH - margin * 2) {
        imgH = pageH - margin * 2;
        imgW = (canvas.width / canvas.height) * imgH;
      }

      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH);
      y += imgH + 6;

      pdf.setFontSize(smallFont);
      pdf.setTextColor('#64748B');
      pdf.text('Légende : ■ Entière  ■ Découpée  ■ Chute  ■ Ouverture', margin, y);
    } catch(e) {
      pdf.text('⚠️ Image non disponible', margin, y);
    }
  }

  // ============================================================
  //  5. PIED DE PAGE
  // ============================================================
  
  var totalPages = pdf.internal.getNumberOfPages();
  for (var i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor('#94A3B8');
    pdf.text(
      'Calepinage Pro — généré le ' + new Date().toLocaleDateString('fr-FR') + ' — Page ' + i + '/' + totalPages,
      pageW / 2,
      pageH - 8,
      { align: 'center' }
    );
  }

  // ============================================================
  //  6. TÉLÉCHARGEMENT
  // ============================================================
  
  var pdfName = 'calepinage_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.pdf';
  pdf.save(pdfName);
  showToast('📄 PDF généré !');
}
