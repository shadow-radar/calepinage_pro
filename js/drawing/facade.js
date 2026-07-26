// =============================================
// facade.js
// Moteur de dessin des façades
// =============================================

const facades = [];

let drawing = false;
let startX = 0;
let startY = 0;

canvas.addEventListener("mousedown", (e) => {

    if (currentTool !== "facade") return;
    if (e.button !== 0) return;

    drawing = true;

    startX = mouse.worldX;
    startY = mouse.worldY;

});

canvas.addEventListener("mouseup", (e) => {

    if (!drawing) return;

    drawing = false;

    const width = mouse.worldX - startX;
    const height = mouse.worldY - startY;

    facades.push({

        id: crypto.randomUUID(),

        type: "facade",

        x: Math.min(startX, mouse.worldX),

        y: Math.min(startY, mouse.worldY),

        width: Math.abs(width),

        height: Math.abs(height),

        color: "#8ca8bf",

        selected: false

    });

});
