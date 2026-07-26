// =============================================
// CALEPINAGE PRO
// app.js
// Version 0.1
// =============================================

// Canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Taille
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Caméra
const camera = {
    x: 0,
    y: 0,
    zoom: 1
};

// Souris
const mouse = {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0
};

// Outil actif
let currentTool = "select";

// Grille
const GRID_SIZE = 50;

// =========================
// Coordonnées souris
// =========================

canvas.addEventListener("mousemove", (e) => {

    const rect = canvas.getBoundingClientRect();

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    mouse.worldX = (mouse.x - camera.x) / camera.zoom;
    mouse.worldY = (mouse.y - camera.y) / camera.zoom;

    document.getElementById("mouseX").textContent =
        Math.round(mouse.worldX);

    document.getElementById("mouseY").textContent =
        Math.round(mouse.worldY);

    if (mouse.dragging) {

        camera.x += mouse.x - mouse.lastX;
        camera.y += mouse.y - mouse.lastY;

        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;

    }

});

// =========================
// Déplacement vue
// =========================

canvas.addEventListener("mousedown",(e)=>{

    if(e.button===1){

        mouse.dragging=true;

        mouse.lastX=mouse.x;
        mouse.lastY=mouse.y;

    }

});

window.addEventListener("mouseup",()=>{

    mouse.dragging=false;

});

// =========================
// Zoom
// =========================

canvas.addEventListener("wheel",(e)=>{

    e.preventDefault();

    if(e.deltaY<0){

        camera.zoom*=1.10;

    }else{

        camera.zoom*=0.90;

    }

    camera.zoom=Math.max(0.20,Math.min(8,camera.zoom));

    document.getElementById("zoomLevel").textContent=
    Math.round(camera.zoom*100)+"%";

});

// =========================
// Grille
// =========================

function drawGrid(){

    const step=GRID_SIZE*camera.zoom;

    ctx.strokeStyle="#3a4148";
    ctx.lineWidth=1;

    const startX=(camera.x%step);
    const startY=(camera.y%step);

    for(let x=startX;x<canvas.width;x+=step){

        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x,canvas.height);
        ctx.stroke();

    }

    for(let y=startY;y<canvas.height;y+=step){

        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(canvas.width,y);
        ctx.stroke();

    }

}

// =========================
// Axe X/Y
// =========================

function drawAxis(){

    ctx.strokeStyle="#ff5050";
    ctx.lineWidth=2;

    ctx.beginPath();
    ctx.moveTo(camera.x,0);
    ctx.lineTo(camera.x,canvas.height);
    ctx.stroke();

    ctx.strokeStyle="#50ff70";

    ctx.beginPath();
    ctx.moveTo(0,camera.y);
    ctx.lineTo(canvas.width,camera.y);
    ctx.stroke();

}

function drawFacades() {

    ctx.save();

    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    facades.forEach(facade => {

        ctx.fillStyle = facade.color;
        ctx.strokeStyle = "#1d1d1d";
        ctx.lineWidth = 2 / camera.zoom;

        ctx.fillRect(
            facade.x,
            facade.y,
            facade.width,
            facade.height
        );

        ctx.strokeRect(
            facade.x,
            facade.y,
            facade.width,
            facade.height
        );

        if (facade.selected) {

            ctx.strokeStyle = "#00b7ff";
            ctx.lineWidth = 3 / camera.zoom;

            ctx.strokeRect(
                facade.x,
                facade.y,
                facade.width,
                facade.height
            );

        }

    });

    if (drawing) {

        ctx.strokeStyle = "#00b7ff";
        ctx.setLineDash([10, 5]);

        ctx.strokeRect(
            startX,
            startY,
            mouse.worldX - startX,
            mouse.worldY - startY
        );

        ctx.setLineDash([]);

    }

    ctx.restore();

}

// =========================
// Rendu
// =========================

function render(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawGrid();

    drawAxis();

    requestAnimationFrame(render);

}

render();
drawFacades();

// =========================
// Sélection outil
// =========================

document.querySelectorAll("[data-tool]").forEach(btn=>{

    btn.addEventListener("click",()=>{

        currentTool=btn.dataset.tool;

        console.log("Outil :",currentTool);

    });

});

console.log("CALEPINAGE PRO V0.1 lancé");

