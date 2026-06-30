document.addEventListener('DOMContentLoaded', () => {
  const svg = document.getElementById('svg_plan');
  const layerMur = document.getElementById('layer-mur');
  const layerPanneaux = document.getElementById('layer-panneaux');
  const btnCalcul = document.getElementById('btn_calcul');

  btnCalcul.addEventListener('click', () => {
    const murLargeur = parseFloat(document.getElementById('mur_largeur').value);
    const murHauteur = parseFloat(document.getElementById('mur_hauteur').value);

    clearLayer(layerMur);
    clearLayer(layerPanneaux);

    drawMur(layerMur, murLargeur, murHauteur);
    drawPanneaux(layerPanneaux, murLargeur, murHauteur, 300);
  });
});

function clearLayer(layer) {
  while (layer.firstChild) layer.removeChild(layer.firstChild);
}

function drawMur(layer, largeurMm, hauteurMm) {
  const scale = 0.1;
  const w = largeurMm * scale;
  const h = hauteurMm * scale;

  const rect = createSvg('rect', {
    x: 10,
    y: 10,
    width: w,
    height: h,
    fill: '#222',
    stroke: '#888',
    'stroke-width': 1
  });

  layer.appendChild(rect);
}

function drawPanneaux(layer, largeurMm, hauteurMm, largeurPanneauMm) {
  const scale = 0.1;
  const wMur = largeurMm * scale;
  const hMur = hauteurMm * scale;
  const wP = largeurPanneauMm * scale;

  let x = 10;

  while (x + wP <= 10 + wMur) {
    const rect = createSvg('rect', {
      x,
      y: 10,
      width: wP,
      height: hMur,
      fill: '#333',
      stroke: '#0af',
      'stroke-width': 0.5
    });

    layer.appendChild(rect);
    x += wP;
  }
}

function createSvg(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}
