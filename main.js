const totalSlides = 4;
const endScale = 2.5;
let slideWidth = window.innerWidth < 1000 ? window.innerWidth * 0.75 : window.innerWidth * 0.45;
let centerX = window.innerWidth / 2;
const isMobile = window.innerWidth < 1000;

// Slide titles - remain as placeholders
const slideTitles = [
    "DigiLocker for Health", "Lab Report Analyser", "Prescription Analyser", "Meal Planner"
];

// URLs for redirection
const slideUrls = [
    "https://example2.com","https://example.com","https://ai-medical-prescribe.vercel.app/",
    "https://mealplanners.streamlit.app/"     
];

// Animation variables
let currentX = 0;
let targetX = 0;
let isScrolling = false;
let scrollTimeout;
let activeSlideIndex = 0;
let slides = [];
let thumbnails = [];
let velocity = 0;
let lastX = 0;
let lastTime = 0;

// GSAP timeline for smooth animations
let masterTL = gsap.timeline();

// Get DOM elements
const slider = document.getElementById('slider');
const slideTitle = document.getElementById('slideTitle');
const thumbnailWheel = document.getElementById('thumbnailWheel');

// Create slides and make them clickable
function createSlides() {
    const slidesContainer = slider;
    
    // Create triple the slides for infinite scroll
    for (let i = 0; i < 12; i++) {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.style.cursor = 'pointer'; // Add pointer cursor to indicate it's clickable

        const img = document.createElement('img');
        const imgNum = (i % 4) + 1;
        const slideIndex = i % 4; // Get the actual index (0-3)

        img.src = `/${imgNum}.png`;
        img.alt = ` `;
        img.style.willChange = 'transform, filter';

        slide.appendChild(img);
        slidesContainer.appendChild(slide);
        slides.push(slide);
        
        // Add click event listener for redirection
        slide.addEventListener('click', () => {
            // Only redirect if the clicked slide is the active one
            if (slideIndex === activeSlideIndex) {
                // Open the URL in a new tab for better user experience
                window.open(slideUrls[slideIndex], '_blank');
            }
        });

        // Set initial GSAP properties
        gsap.set(slide, {
            x: i * slideWidth,
            transformOrigin: "center center"
        });

        gsap.set(img, {
            scale: 1,
            rotation: 0,
            filter: "blur(0px)",
            transformOrigin: "center center"
        });
    }
}

// Create thumbnail wheel
function createThumbnailWheel() {
    // SVG icons for the wheel
    const svgIcons = [
        `<img src="/lock-circle--svgrepo-com.svg" alt="Lock" style="width:50px;height:50px">`,
        `<img src="/dna-svgrepo-com.svg" alt="DNA" style="width:50px;height:50px">`,
        `<svg viewBox="0 0 24 24" fill="currentColor" style="width:40px;height:40px">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>`,
        `<img src="/diet-svgrepo-com.svg" alt="Diet" style="width:50px;height:50px">`,
    ];
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const radius = isMobile ? 250 : 300;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = window.innerHeight / 2 + Math.sin(angle) * radius;
        
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail-item';
        thumbnail.dataset.index = i;
        thumbnail.dataset.angle = angle;
        thumbnail.dataset.radius = radius;
        
        thumbnail.innerHTML = svgIcons[i];
        thumbnailWheel.appendChild(thumbnail);
        thumbnails.push(thumbnail);
        
        // Set initial GSAP properties
        gsap.set(thumbnail, {
            x: x - 40,
            y: y - 40,
            scale: 1,
            rotation: 0,
            transformOrigin: "center center"
        });
    }
}

// Initialize slider positions
function initializeSlider() {
    // Center the initial view with GSAP
    const centerOffset = -(4 * slideWidth);
    currentX = centerOffset;
    targetX = centerOffset;
    
    // Animate title entrance
    gsap.fromTo(slideTitle, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.5 }
    );
}

// Update thumbnail positions with GSAP
function updateThumbnails() {
    const slideProgress = -currentX / slideWidth;
    const wheelRotation = (slideProgress * 90) - 90; // Convert to degrees
    
    thumbnails.forEach((thumbnail, i) => {
        const baseAngle = parseFloat(thumbnail.dataset.angle);
        const radius = parseFloat(thumbnail.dataset.radius);
        const rotationRad = (wheelRotation * Math.PI) / 180;
        const newAngle = baseAngle + rotationRad;
        
        const x = centerX + Math.cos(newAngle) * radius;
        const y = window.innerHeight / 2 + Math.sin(newAngle) * radius;
        
        // Smooth GSAP animation for thumbnails
        gsap.to(thumbnail, {
            x: x - 40,
            y: y - 40,
            rotation: wheelRotation * 0,
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Highlight active thumbnail with GSAP
        if (i === activeSlideIndex) {
            thumbnail.classList.add('active');
            gsap.to(thumbnail, {
                scale: 1.2,
                duration: 0.4,
                ease: "elastic.out(1, 0.5)"
            });
        } else {
            thumbnail.classList.remove('active');
            gsap.to(thumbnail, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    });
}

// Main animation loop with GSAP
function animate() {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Smooth movement with better easing
    currentX = gsap.utils.interpolate(currentX, targetX, 0.12);
    
    // Calculate velocity for effects
    velocity = Math.abs(currentX - lastX) * 0.1;
    lastX = currentX;
    
    // Infinite scroll logic
    const totalWidth = 4 * slideWidth;
    if (currentX > 0) {
        currentX -= totalWidth;
        targetX -= totalWidth;
    } else if (currentX < -totalWidth * 2) {
        currentX += totalWidth;
        targetX += totalWidth;
    }
    
    let closestSlide = 0;
    let minDistance = Infinity;
    
    // Update slide positions and scaling with GSAP
    slides.forEach((slide, i) => {
        const x = i * slideWidth + currentX;
        const slideCenter = x + slideWidth / 2;
        const distanceFromCenter = Math.abs(slideCenter - centerX);
        
        // Find closest slide to center
        if (distanceFromCenter < minDistance) {
            minDistance = distanceFromCenter;
            closestSlide = i % 4;
        }
        
        // Calculate scale and effects based on distance
        const normalizedDistance = Math.min(1, distanceFromCenter / (slideWidth * 1.2));
        const easedDistance = gsap.utils.interpolate(0, 1, normalizedDistance);
        const scale = 1 + easedDistance * (endScale - 1);
        
        // Motion blur and skew based on velocity
        const blur = gsap.utils.clamp(0, 15, velocity * 2);
        const skew = gsap.utils.clamp(-8, 8, velocity * (x > centerX ? 1 : -1) * 0.3);
        const rotationY = gsap.utils.clamp(-25, 25, (slideCenter - centerX) * 0.02);
        
        // Animate slide position
        gsap.set(slide, { x: x });
        
        const img = slide.querySelector('img');
        
        // Smooth image transforms
        gsap.to(img, {
            scale: scale,
            skewX: skew,
            rotationY: rotationY,
            filter: `blur(${blur}px) brightness(${1 - easedDistance * 0.3})`,
            duration: 0.3,
            ease: "power2.out"
        });
        
        // Dynamic glow effect
        if (distanceFromCenter < slideWidth / 2) {
            gsap.to(slide, {
                boxShadow: `0 0 ${60 + velocity * 10}px rgba(123,97,255,${0.8 - easedDistance * 0.4})`,
                duration: 0.4,
                ease: "power2.out"
            });
        } else {
            gsap.to(slide, {
                boxShadow: '0 0 0px rgba(123,97,255,0)',
                duration: 0.3,
                ease: "power2.out"
            });
        }
    });
    
    // Update active slide and animate title change
    if (closestSlide !== activeSlideIndex) {
        activeSlideIndex = closestSlide;
        
        // Animate title change
        gsap.to(slideTitle, {
            y: -20,
            opacity: 0,
            duration: 0.2,
            ease: "power2.in",
            onComplete: () => {
                slideTitle.textContent = slideTitles[activeSlideIndex];
                gsap.to(slideTitle, {
                    y: 0,
                    opacity: 1,
                    duration: 0.3,
                    ease: "back.out(1.2)"
                });
            }
        });
    }
    
    // Update thumbnails
    updateThumbnails();
    
    // Continue animation
    requestAnimationFrame(animate);
}

// Enhanced scroll handler with GSAP
function handleScroll(e) {
    const delta = e.deltaY || e.deltaX || e.detail || 0;
    const scrollMultiplier = Math.abs(delta) > 100 ? 3 : 2;
    
    targetX -= delta * scrollMultiplier;
    
    // Add scroll momentum with GSAP
    gsap.to(window, {
        scrollMomentum: targetX,
        duration: 0.1,
        ease: "power2.out"
    });
    
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
        
        // Smooth settle animation
        gsap.to({ val: velocity }, {
            val: 0,
            duration: 1,
            ease: "power2.out",
            onUpdate: function() {
                velocity = this.targets()[0].val;
            }
        });
    }, 200);
    
    e.preventDefault();
}

// Enhanced touch handling with GSAP
let touchStartX = null;
let touchStartY = null;
let touchVelocity = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchVelocity = 0;
    
    // Kill any ongoing momentum
    gsap.killTweensOf(window);
}

function handleTouchMove(e) {
    if (touchStartX === null || touchStartY === null) return;
    
    const deltaX = touchStartX - e.touches[0].clientX;
    const deltaY = touchStartY - e.touches[0].clientY;
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        touchVelocity = deltaX;
        targetX -= deltaX * 4;
        touchStartX = e.touches[0].clientX;
        e.preventDefault();
    }
}

function handleTouchEnd() {
    // Add momentum based on touch velocity
    if (Math.abs(touchVelocity) > 5) {
        gsap.to(window, {
            touchMomentum: targetX + (touchVelocity * 20),
            duration: 1.5,
            ease: "power3.out",
            onUpdate: function() {
                if (this.progress() < 0.9) {
                    targetX = gsap.getProperty(this.targets()[0], "touchMomentum");
                }
            }
        });
    }
    
    touchStartX = null;
    touchStartY = null;
    touchVelocity = 0;
}

// Enhanced keyboard navigation with GSAP
function handleKeydown(e) {
    switch(e.key) {
        case 'ArrowLeft':
            gsap.to(window, {
                keyboardTarget: targetX + slideWidth,
                duration: 0.6,
                ease: "power2.out",
                onUpdate: function() {
                    targetX = gsap.getProperty(this.targets()[0], "keyboardTarget");
                }
            });
            e.preventDefault();
            break;
        case 'ArrowRight':
            gsap.to(window, {
                keyboardTarget: targetX - slideWidth,
                duration: 0.6,
                ease: "power2.out",
                onUpdate: function() {
                    targetX = gsap.getProperty(this.targets()[0], "keyboardTarget");
                }
            });
            e.preventDefault();
            break;
    }
}

// Resize handler
function handleResize() {
    slideWidth = window.innerWidth < 1000 ? window.innerWidth * 0.75 : window.innerWidth * 0.45;
    centerX = window.innerWidth / 2;
    
    // Recreate thumbnails for new screen size
    thumbnailWheel.innerHTML = '';
    thumbnails = [];
    createThumbnailWheel();
    
    // Reinitialize slider
    initializeSlider();
}

// Event listeners
window.addEventListener('wheel', handleScroll, { passive: false });
window.addEventListener('touchstart', handleTouchStart, { passive: true });
window.addEventListener('touchmove', handleTouchMove, { passive: false });
window.addEventListener('touchend', handleTouchEnd, { passive: true });
window.addEventListener('keydown', handleKeydown);
window.addEventListener('resize', handleResize);

// Prevent page scroll
window.addEventListener('scroll', () => {
    window.scrollTo(0, 0);
});

// Initialize everything
createSlides();
createThumbnailWheel();
initializeSlider();
animate();