// ============================================================
//  CALCUL PAR FAÇADE
// ============================================================
function calculerFacade(f) {
  var type   = f.type;
  var larg   = f.larg   || 0;
  var hgVal  = f.hg     || 0;
  var hdVal  = f.hd     || 0;
  var hcVal  = type === 'pignon' ? (f.hc || 0) : hgVal;
  var largHG = type === 'pignon' ? (f.largHG || larg) : larg;
  var largHD = type === 'pignon' ? (f.largHD || larg) : larg;
  var lu     = f.lu    || 1;   // longueur lame (horizontal)
  var hu     = f.hu    || 1;   // largeur lame  (vertical)
  var joint  = f.joint || 0;
  var lAir   = f.lameAir     || 0;
  var arH    = f.antiRongeur || 0;
  var ouvertures = f.ouvertures || [];

  // --- Surface brute ---
  var sBrute;
  if (type === 'facade') {
    sBrute = (larg * ((hgVal + hdVal) / 2)) / 1e6;
  } else {
    var xPointe = larg / 2;
    var sRectG  = (largHG  * hgVal) / 1e6;
    var sTriG   = ((xPointe - largHG)  * (hgVal + hcVal) / 2) / 1e6;
    var sTriD   = ((larg - largHD - xPointe) * (hdVal + hcVal) / 2) / 1e6;
    var sRectD  = (largHD  * hdVal) / 1e6;
    sBrute = sRectG + sTriG + sTriD + sRectD;
  }

  var sOuv  = ouvertures.reduce(function(a, o){ return a + (o.larg * o.haut) / 1e6; }, 0);
  var hPose = Math.max(0, Math.min(hgVal, hdVal));
  var sUtile = Math.max(0, (larg * hPose) / 1e6 - sOuv);

  // --- Lames ---
  var coeffChute = { composite: 0.05, fibrociment: 0.07, metal: 0.03 };
  var coeffMat   = coeffChute[f.typeMat] || 0.05;
  var nbTotal = 0, nbEntieres = 0, nbDecoupees = 0;
  var sAchetee = 0, sChuteGeo = 0;

  var hTotPose = type === 'pignon'
    ? hcVal
    : Math.max(hgVal, hdVal);
  var nbRTot = Math.ceil(hTotPose / (hu + joint));

  for (var rr = 0; rr < nbRTot; rr++) {
    var yMidR = (rr + 0.5) * (hu + joint);
    var largR;
    if (type === 'facade') {
      largR = larg;
    } else {
      var xPtr = larg / 2;
      var xLeft, xRight;
      if (yMidR <= hgVal) { xLeft = 0; }
      else {
        var progG = Math.min((yMidR - hgVal) / (hcVal - hgVal), 1);
        xLeft = largHG + (xPtr - largHG) * progG;
      }
      if (yMidR <= hdVal) { xRight = larg; }
      else {
        var progD = Math.min((yMidR - hdVal) / (hcVal - hdVal), 1);
        xRight = (larg - largHD) - ((larg - largHD) - xPtr) * progD;
      }
      largR = Math.max(0, xRight - xLeft);
    }
    if (largR <= 10) continue;

    var nbL = Math.ceil(largR / lu);
    var nbEntRow = Math.floor(largR / lu);
    var nbDecRow = (largR % lu > 0) ? 1 : 0;
    nbTotal    += nbL;
    nbEntieres += nbEntRow;
    nbDecoupees += nbDecRow;
    sAchetee   += (nbL * lu * hu) / 1e6;
    sChuteGeo  += ((nbL * lu - largR) * hu) / 1e6;
  }

  var tauxChute = (sAchetee > 0 ? sChuteGeo / sAchetee * 100 : 0) + coeffMat * 100;

  // --- Ossature ---
  var espMontant  = lAir <= 20 ? 400 : (lAir <= 30 ? 500 : 600);
  var nbMontants  = Math.ceil(larg / espMontant) + 1;
  var nbMontants3m = nbMontants * Math.ceil(hPose / 3000);
  var nbEquerres  = nbMontants * 4;

  // --- Vis ---
  var nbVis = f.typeMat === 'metal'
    ? Math.ceil(sUtile * 3)
    : Math.ceil(nbTotal * Math.ceil(hu / 500) * nbMontants);

  // --- Finitions ---
  var tpsMin    = sBrute * 1;
  var tpsMax    = sBrute * 1.5;
  var nbARBas   = Math.ceil(larg / 3000);
  var nbARHaut  = Math.ceil(larg / 3000);
  var nbAR      = nbARBas + nbARHaut;
  var formatPP  = parseFloat(f.formatPP) || 25;
  var nbRouleaux = Math.ceil(sBrute / (1.5 * formatPP));
  var nbJD      = f.typeMat === 'metal' ? 0 : Math.floor(larg / 6000);
  var mlJD      = nbJD * (hPose / 1000);
  var sensePose = f.typeMat === 'metal'
    ? (f.coteVent === 'gauche' ? 'G→D (joint côté terre D)' : 'D→G (joint côté terre G)')
    : 'Bords → Centre (symétrique)';

  return {
    nom: f.nom || ('Façade ' + f.num),
    type, larg, largHG, largHD,
    hg: hgVal, hd: hdVal, hc: hcVal,
    lu, hu, joint, arH, hPose, lAir,
    typeMat: f.typeMat, sensePose, formatPP,
    sBrute, sOuv, sUtile, sAchetee, tauxChute,
    nbTotal, nbEntieres, nbDecoupees,
    nbMontants, nbMontants3m, nbEquerres,
    nbAR, nbARBas, nbARHaut,
    nbVis, nbRouleaux, nbJD, mlJD,
    tpsMin, tpsMax,
    joursMin: Math.ceil(tpsMin / 8),
    joursMax: Math.ceil(tpsMax / 8),
    ouvertures
  };
}
