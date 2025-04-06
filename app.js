const pageTitle = document.getElementById('pageTitle');
const screens = document.querySelectorAll('.screen');
let currentScreen = 'screen1';

let imageContainer = null;
let image = null;
let scale = 1;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let imageWidth = 0;
let imageHeight = 0;

function isMobile() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

function initializeZoomAndDrag() {
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) return;

    imageContainer = activeScreen.querySelector('.image-container');
    image = activeScreen.querySelector('.image');

    if (!imageContainer || !image) {
        console.warn("Image or container not found");
        return;
    }

    if (isMobile()) {
        const zoomButtons = document.querySelectorAll('.zoom-buttons button:not(:last-child)');
        zoomButtons.forEach(btn => btn.style.display = 'none');
    }

    scale = 1;
    translateX = 0;
    translateY = 0;
    isDragging = false;
    initialDistance = 0;

    if (image.complete) {
        getImageDimensions();
    } else {
        image.addEventListener('load', getImageDimensions);
    }

    function getImageDimensions() {
        imageWidth = image.naturalWidth;
        imageHeight = image.naturalHeight;
        applyTransform();
    }

    function applyTransform() {
        if (!image || !imageContainer) return;

        const maxX = Math.max(0, (imageWidth * scale - imageContainer.offsetWidth) / 2);
        const maxY = Math.max(0, (imageHeight * scale - imageContainer.offsetHeight) / 2);

        translateX = Math.max(-maxX, Math.min(translateX, maxX));
        translateY = Math.max(-maxY, Math.min(translateY, maxY));

        image.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function zoomIn() {
        scale = Math.min(scale + 0.2, 3);
        applyTransform();
    }

    function zoomOut() {
        scale = Math.max(scale - 0.2, 0.5);
        applyTransform();
    }

    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
    }

    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
    window.resetZoom = resetZoom;

    let initialScale = 1;

    function handleTouchStart(e) {
        if (e.touches.length === 2) {
        e.preventDefault();
        isDragging = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        initialScale = scale;
    } else {
        handleDragStart(e);
    }
}

    function handleTouchMove(e) {
        if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        if (initialDistance > 0) {
            const newScale = initialScale * (currentDistance / initialDistance);
            scale = Math.max(0.5, Math.min(3, newScale));
            applyTransform();
        }
    } else {
        handleDragMove(e);
    }
}

    function handleTouchEnd(e) {
        if (e.touches.length === 0) {
        initialDistance = 0;
        handleDragEnd();
    }
}

    function handleDragStart(e) {
        e.preventDefault();
        isDragging = true;
        imageContainer.classList.add('grabbing');
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX && clientY) {
            startX = clientX - translateX;
            startY = clientY - translateY;
        }
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        translateX = clientX - startX;
        translateY = clientY - startY;
        
        applyTransform();
    }

    function handleDragEnd() {
        isDragging = false;
        imageContainer.classList.remove('grabbing');
    }

    imageContainer.addEventListener('mousedown', handleDragStart);
    imageContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    imageContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    }, { passive: false });
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleTouchEnd);
}

function showScreen(screenId) {
    if (screenId === currentScreen) return;

    const exitingScreen = document.getElementById(currentScreen);
    const enteringScreen = document.getElementById(screenId);

    exitingScreen.classList.remove('active');
    
    enteringScreen.classList.add('active');
    pageTitle.textContent = enteringScreen.dataset.title;
    currentScreen = screenId;

    scale = 1;
    translateX = 0;
    translateY = 0;

    initializeZoomAndDrag();
}

function removeZoomAndDrag() {
    if (imageContainer) {
        imageContainer.removeEventListener('mousedown', handleDragStart);
        imageContainer.removeEventListener('touchstart', handleTouchStart);
        imageContainer.classList.remove('grabbing');
    }

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleTouchEnd);

    imageContainer = null;
    image = null;
}

let inactivityTimer;
let hasMouseMoved = false;
const INACTIVITY_DELAY = 2000;
const interfaceElements = [
    document.querySelector('.page-title'),
    document.querySelector('.nav-buttons'),
    document.querySelector('.zoom-buttons')
];

function resetInactivityTimer() {
    interfaceElements.forEach(el => {
        if (el) el.style.opacity = '1';
    });

    if (!hasMouseMoved) {
        hasMouseMoved = true;
        return;
    }

    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {
        interfaceElements.forEach(el => {
            if (el) el.style.opacity = '0';
        });
    }, INACTIVITY_DELAY);
}

document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('mousedown', resetInactivityTimer);

document.addEventListener('touchstart', resetInactivityTimer);
document.addEventListener('touchmove', resetInactivityTimer);

window.onload = function() {
    initializeZoomAndDrag();
};