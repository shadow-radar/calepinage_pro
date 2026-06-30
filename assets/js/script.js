document.addEventListener('DOMContentLoaded', () => {

  // --- MURS / FAÇADES ---
  let murs = [];
  let murIndex = 0;

  const murSelect = document.getElementById('mur_select');
  const btnAddMur = document.getElementById('btn_add_mur');
  const btnDelMur = document.getElementById('btn_del_mur');

  const svg = document.getElementById('svg_plan');
  const btnCalcul = document.getElementById('btn_calcul');
  const btnExportPNG = document.getElementById('btn_export_png');
  const btnExportSVG = document.getElementById('btn_export_svg');
  const btnAddOpening = document.getElementById('btn_add_opening');
  const openingsList = document.getElementById('openings_list');

  // --- ZOOM & PAN VARIABLES ---
  let viewBox = { x: 0, y: 0, w: 600, h: 300 };
  let isPanning = false;
  let startPoint = { x: 0, y: 0 };

  // --- EVENTS ---
  svg.addEventListener('wheel', e => zoomSVG(e, svg, viewBox));
  svg.addEventListener('mousedown', e => startPan(e));
  svg.addEventListener('mousemove', e => pan(e, svg, viewBox));
  svg.addEventListener('mouseup', () => isPanning = false);
  svg.addEventListener('mouseleave', () => isPanning = false);

  // --- AJOUT D’UNE OUVERTURE ---
  btnAddOpening.addEventListener('click', () => {
    addOpeningInput();
  });

  // --- AJOUT D’UN MUR ---
  btnAddMur.addEventListener('click', () => {
    murs.push({
      largeur: 6000,
      hauteur: 2800,
      panneau: 300,
      recouvrement: 20,
      ouvertures: []
    });
    murIndex = murs.length - 1;
    refreshMurList();
    loadMur(murIndex);
  });

  // --- SUPPRESSION D’UN MUR ---
  btnDelMur.addEventListener('click', () => {
    if (murs.length > 1) {
      murs.splice(murIndex, 1);
      murIndex = 0;
      refreshMurList();
      loadMur(murIndex);
    }
  });

  // --- CHANGEMENT DE MUR ---
  murSelect.addEventListener('change', () => {
    murIndex = parseInt(murSelect.value);
    loadMur(murIndex);
  });

  // --- CALCUL ---
  btnCalcul.addEventListener('click', () => {
    saveMur(murIndex);
    drawMurPlan(murIndex);
  });

  // --- EXPORT PNG ---
  btnExportPNG.addEventListener('click', () => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 1000;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const png = canvas.toDataURL("image/png");

      const link = document.createElement('a');
      link.download = "calepinage.png";
      link.href = png;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgString);
  });

  // --- EXPORT SVG ---
  btnExportSVG.addEventListener('click', () => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = "calepinage.svg";
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  });

  // --- INIT ---
  murs.push({
    largeur: 6000,
    hauteur: 2800,
    panneau: 300,
    recouvrement: 20,
    ouvertures: []
  });

  refreshMurList();
  loadMur(0);
});


// --- INTERFACE MURS ---
function refreshMurList() {
  murSelect.innerHTML = "";
  murs.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = "Mur " + (i + 1);
    murSelect.appendChild(opt);
  });
}

function loadMur(i) {
  const m = murs[i];

  document.getElementById('mur_largeur').value = m.largeur;
  document.getElementById('mur_hauteur').value = m.hauteur;
  document.getElementById('panneau_largeur').value = m.panneau;

  openingsList.innerHTML = "";
  m.ouvertures.forEach(o => addOpeningInput(o));

  drawMurPlan(i);
}

function saveMur(i) {
  const m = murs[i];

  m.largeur = parseFloat(document.getElementById('mur_largeur').value);
  m.hauteur = parseFloat(document.getElementById('mur_hauteur').value);
  m.panneau = parseFloat(document.getElementById('panneau_largeur').value);
  m.recouvrement = 20;
  m.ouvertures = getOpeningsFromInputs();
}


// --- INTERFACE D’OUVERTURES ---
function addOpeningInput(data = null) {
  const div = document.createElement('div');
  div.className = "opening-item";

  div.innerHTML = `
    X: <input type="number" class="open_x" value="${data ? data.x : 1000}">
    Y: <input type="number" class="open_y" value="${data ? data.y : 0}">
    L: <input type="number" class="open_w" value="${data ? data.w : 900}">
    H: <input type="number" class="open_h" value="${data ? data.h : 1200}">
    <select class="open_type">
      <option value="fenetre">Fenêtre</option>
      <option value="porte">Porte</option>
    </select>
    <button class="open_del">X</button>
  `;

  if (data) div.querySelector('.open_type').value = data.type;

  div.querySelector('.open_del').addEventListener('click', () => {
    div.remove();
  });

  openingsList.appendChild(div);
}

function getOpeningsFromInputs() {
  const items = document.querySelectorAll('.opening-item');
  const list = [];

  items.forEach(item => {
    list.push({
      x: parseFloat(item.querySelector('.open_x').value),
      y: parseFloat(item.querySelector('.open_y').value),
      w: parseFloat(item.querySelector('.open_w').value),
      h: parseFloat(item.querySelector('.open_h').value),
      type: item.querySelector('.open_type').value
    });
  });

  return list;
}


// --- DESSIN DU MUR ---
function drawMurPlan(i) {
  const m = murs[i];

  const layerMur = document.getElementById('layer-mur');
  const layerPanneaux = document.getElementById('layer-panneaux');
  const layerOuvertures = document.getElementById('layer-ouvertures');
  const layerAnnotations = document.getElementById('layer-annotations');

  clearLayer(layerMur);
  clearLayer(layerPanneaux);
  clearLayer(layerOuvertures);
  clearLayer(layerAnnotations);

  drawMur(layerMur, m.largeur, m.hauteur);
  drawOuvertures(layerOuvertures, m.ouvertures);
  drawPanneauxDecoupes(
    layerPanneaux,
    layerAnnotations,
    m.largeur,
    m.hauteur,
    m.panneau,
    m.recouvrement,
    m.ouvertures
  );

  updateResults(m.largeur, m.panneau, m.recouvrement);
}


// --- SVG CREATION ---
function createSvg(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function clearLayer(layer) {
  while (layer.firstChild) layer.removeChild(layer.firstChild);
}


// --- DRAW MUR ---
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


// --- DRAW OUVERTURES ---
function drawOuvertures(layer, ouvertures) {
  const scale = 0.1;

  ouvertures.forEach(o => {
    const rect = createSvg('rect', {
      x: 10 + o.x * scale,
      y: 10 + o.y * scale,
      width: o.w * scale,
      height: o.h * scale,
      fill: o.type === "porte" ? "#550000" : "#003355",
      stroke: "#fff",
      'stroke-width': 0.8
    });

    layer.appendChild(rect);
  });
}


// --- DRAW PANNEAUX AVEC DÉCOUPES ---
function drawPanneauxDecoupes(layer, layerAnnotations, largeurMm, hauteurMm, largeurPanneauMm, recouvrementMm, ouvertures) {
  const scale = 0.1;

  const largeurUtile = largeurPanneauMm - recouvrementMm;
  const wMur = largeurMm * scale;
  const hMur = hauteurMm * scale;
  const wUtile = largeurUtile * scale;

  let x = 10;
  let index = 1;

  while (x + wUtile <= 10 + wMur) {
    const panneau = { x, y: 10, w: wUtile, h: hMur };

    const morceaux = decouperPanneau(panneau, ouvertures, scale);

    morceaux.forEach(m => {
      const rect = createSvg('rect', {
        x: m.x,
        y: m.y,
        width: m.w,
        height: m.h,
        fill: m.coupe ? "#663300" : "#333",
        stroke: m.coupe ? "#ff0" : "#0af",
        'stroke-width': 0.5
      });

      layer.appendChild(rect);

      const text = createSvg('text', {
        x: m.x + m.w / 2,
        y: m.y + m.h / 2,
        fill: m.coupe ? "#ff0" : "#fff",
        'font-size': 10,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle'
      });

      text.textContent = index;
      layerAnnotations.appendChild(text);
    });

    x += wUtile;
    index++;
  }
}


// --- DÉCOUPES AVANCÉES ---
function decouperPanneau(p, ouvertures, scale) {
  let morceaux = [{ x: p.x, y: p.y, w: p.w, h: p.h, coupe: false }];

  ouvertures.forEach(o => {
    const ox = 10 + o.x * scale;
    const oy = 10 + o.y * scale;
    const ow = o.w * scale;
    const oh = o.h * scale;

    morceaux = morceaux.flatMap(m => {
      const overlap =
        m.x < ox + ow &&
        m.x + m.w > ox &&
        m.y < oy + oh &&
        m.y + m.h > oy;

      if (!overlap) return [m];

      const morceauxDecoupes = [];

      if (m.y < oy) {
        morceauxDecoupes.push({
          x: m.x,
          y: m.y,
          w: m.w,
          h: oy - m.y,
          coupe: true
        });
      }

      if (m.y + m.h > oy + oh) {
        morceauxDecoupes.push({
          x: m.x,
          y: oy + oh,
          w: m.w,
          h: (m.y + m.h) - (oy + oh),
          coupe: true
        });
      }

      return morceauxDecoupes;
    });
  });

  return morceaux;
}


// --- RESULTS ---
function updateResults(murLargeur, panneauLargeur, recouvrementMm) {
  const resPanneaux = document.getElementById('res_panneaux');
  const resPertes = document.getElementById('res_pertes');

  const largeurUtile = panneauLargeur - recouvrementMm;
  const nbPanneaux = Math.ceil(murLargeur / largeurUtile);
  const reste = (nbPanneaux * largeurUtile) - murLargeur;

  resPanneaux.innerHTML = `<p>Panneaux nécessaires : <strong>${nbPanneaux}</strong></p>`;
  resPertes.innerHTML = `<p>Surplus dû au recouvrement : <strong>${reste} mm</strong></p>`;
}


// --- ZOOM ---
function zoomSVG(e, svg, viewBox) {
  e.preventDefault();

  const zoomIntensity = 0.1;
  const direction = e.deltaY > 0 ? 1 : -1;

  const factor = 1 + direction * zoomIntensity;

  viewBox.w *= factor;
  viewBox.h *= factor;

  svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
}


// --- PAN ---
function startPan(e) {
  isPanning = true;
  startPoint = { x: e.clientX, y: e.clientY };
}

function pan(e, svg, viewBox) {
  if (!isPanning) return;

  const dx = (startPoint.x - e.clientX) * (viewBox.w / svg.clientWidth);
  const dy = (startPoint.y - e.clientY) * (viewBox.h / svg.clientHeight);

  viewBox.x += dx;
  viewBox.y += dy;

  startPoint = { x: e.clientX, y: e.clientY };

  svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
}
