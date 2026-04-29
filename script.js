/**
 * 你可以只改这里：
 * - DISPLAY_IMAGE: 页面展示图
 * - HD_IMAGE: 放大镜用的高清图（可与展示图相同）
 */
const DISPLAY_IMAGE = "./assets/product-transparent-v3.png?v=3";
const HD_IMAGE = "./assets/product-transparent-v3.png?v=3";

const card = document.getElementById("product-card");
const image = document.getElementById("product-image");
const lens = document.getElementById("lens");
const progressBar = document.getElementById("scroll-progress");
const teamSection = document.getElementById("team");
const cursorDot = document.getElementById("cursor-dot");
const cursorRing = document.getElementById("cursor-ring");
const navAnchorLinks = document.querySelectorAll('.top-nav a[href^="#"]');
const prototypeStack = document.getElementById("prototype-stack");

// 3D 倾斜控制参数
const tiltConfig = {
  maxDeg: 12, // 最大倾斜角度
  friction: 0.12, // 阻尼系数，越小越“黏”
};

// 放大镜参数
const lensConfig = {
  zoom: 2.5, // 放大倍率
  edgePadding: 8, // 放大镜中心离边界最小距离
};

let rect = null;
let rafId = 0;
let hovering = false;
let cursorRafId = 0;
let lenisInstance = null;

const state = {
  currentX: 0,
  currentY: 0,
  targetX: 0,
  targetY: 0,
};

const cursorState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  ringX: window.innerWidth / 2,
  ringY: window.innerHeight / 2,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateRect() {
  rect = card.getBoundingClientRect();
}

function updateLens(mouseX, mouseY) {
  if (!rect) return;

  const localX = clamp(mouseX - rect.left, 0, rect.width);
  const localY = clamp(mouseY - rect.top, 0, rect.height);

  const edge = lensConfig.edgePadding + lens.offsetWidth / 2;
  const lensX = clamp(localX, edge, rect.width - edge);
  const lensY = clamp(localY, edge, rect.height - edge);

  lens.style.left = `${lensX}px`;
  lens.style.top = `${lensY}px`;

  const bgW = rect.width * lensConfig.zoom;
  const bgH = rect.height * lensConfig.zoom;
  const bgPosX = -(localX * lensConfig.zoom - lens.offsetWidth / 2);
  const bgPosY = -(localY * lensConfig.zoom - lens.offsetHeight / 2);

  lens.style.backgroundSize = `${bgW}px ${bgH}px`;
  lens.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
}

function animate() {
  const dx = state.targetX - state.currentX;
  const dy = state.targetY - state.currentY;

  // 使用线性插值产生惯性阻尼，不会突兀闪动
  state.currentX += dx * tiltConfig.friction;
  state.currentY += dy * tiltConfig.friction;

  const rotateY = state.currentX * tiltConfig.maxDeg;
  const rotateX = -state.currentY * tiltConfig.maxDeg;

  card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
    2
  )}deg)`;

  const stillMoving = Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001;
  if (hovering || stillMoving) {
    rafId = requestAnimationFrame(animate);
  } else {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function startAnimationIfNeeded() {
  if (!rafId) rafId = requestAnimationFrame(animate);
}

function onPointerEnter(event) {
  hovering = true;
  updateRect();
  lens.classList.add("is-visible");
  updateLens(event.clientX, event.clientY);
  startAnimationIfNeeded();
}

function onPointerMove(event) {
  if (!rect) updateRect();

  const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;

  state.targetX = clamp(nx, -1, 1);
  state.targetY = clamp(ny, -1, 1);
  updateLens(event.clientX, event.clientY);
  startAnimationIfNeeded();
}

function onPointerLeave() {
  hovering = false;
  state.targetX = 0;
  state.targetY = 0;
  lens.classList.remove("is-visible");
  startAnimationIfNeeded();
}

function updateScrollProgress() {
  const doc = document.documentElement;
  const total = doc.scrollHeight - window.innerHeight;
  const ratio = total <= 0 ? 0 : window.scrollY / total;
  progressBar.style.width = `${(ratio * 100).toFixed(2)}%`;
}

function revealTeamWhenVisible() {
  const rect = teamSection.getBoundingClientRect();
  const triggerY = window.innerHeight * 0.84;
  if (rect.top < triggerY) {
    teamSection.classList.add("is-visible");
  }
}

function animateCursorRing() {
  const dx = cursorState.x - cursorState.ringX;
  const dy = cursorState.y - cursorState.ringY;
  cursorState.ringX += dx * 0.18;
  cursorState.ringY += dy * 0.18;

  cursorRing.style.left = `${cursorState.ringX}px`;
  cursorRing.style.top = `${cursorState.ringY}px`;
  cursorRafId = requestAnimationFrame(animateCursorRing);
}

function onGlobalPointerMove(event) {
  cursorState.x = event.clientX;
  cursorState.y = event.clientY;
  cursorDot.style.left = `${cursorState.x}px`;
  cursorDot.style.top = `${cursorState.y}px`;
}

function onInteractiveEnter() {
  document.body.classList.add("cursor-active");
}

function onInteractiveLeave() {
  document.body.classList.remove("cursor-active");
}

function initPrototypeStack() {
  if (!prototypeStack) return;
  let cards = Array.from(prototypeStack.querySelectorAll(".prototype-card"));
  let animating = false;
  const jitterMap = new WeakMap();

  cards.forEach((cardEl) => {
    jitterMap.set(cardEl, {
      x: (Math.random() - 0.5) * 18,
      y: (Math.random() - 0.5) * 16,
      r: (Math.random() - 0.5) * 9.5,
    });
  });

  function renderStack() {
    cards.forEach((cardEl, index) => {
      const jitter = jitterMap.get(cardEl) || { x: 0, y: 0, r: 0 };
      const offsetX = index * 14 + jitter.x;
      const offsetY = index * 12 + jitter.y;
      const scale = 1 - index * 0.028;
      const rotate = jitter.r;
      cardEl.style.zIndex = `${cards.length - index}`;
      cardEl.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg) scale(${scale})`;
      cardEl.style.opacity = index > 2 ? "0" : "1";
      cardEl.style.pointerEvents = index === 0 ? "auto" : "none";
    });
  }

  renderStack();

  prototypeStack.addEventListener("click", (event) => {
    const topCard = cards[0];
    if (animating || !topCard || !event.target.closest(".prototype-card")) return;
    if (!topCard.contains(event.target)) return;

    animating = true;
    topCard.classList.add("is-ejecting");
    topCard.style.pointerEvents = "none";

    const onEnd = () => {
      topCard.removeEventListener("transitionend", onEnd);
      topCard.classList.remove("is-ejecting");
      cards = cards.slice(1).concat(topCard);
      cards.forEach((cardEl) => prototypeStack.appendChild(cardEl));
      const newBottomIndex = cards.length - 1;
      const jitter = jitterMap.get(topCard) || { x: 0, y: 0, r: 0 };
      const settleX = newBottomIndex * 14 + jitter.x;
      const settleY = newBottomIndex * 12 + jitter.y;
      const settleScale = 1 - newBottomIndex * 0.028;
      const settleRotate = jitter.r;

      topCard.style.transition = "none";
      topCard.style.opacity = "1";
      topCard.style.transform = `translate(${settleX + 28}px, ${settleY + 34}px) rotate(${
        settleRotate - 2
      }deg) scale(${Math.max(0.88, settleScale - 0.06)})`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          topCard.style.transition = "transform 720ms cubic-bezier(0.22, 0.9, 0.22, 1.08), opacity 380ms ease";
          renderStack();
          setTimeout(() => {
            topCard.style.transition = "";
            animating = false;
          }, 740);
        });
      });
    };

    topCard.addEventListener("transitionend", onEnd);
  });
}

function init() {
  // Lenis smooth scrolling (Aesop-style inertia reference)
  if (window.Lenis) {
    lenisInstance = new window.Lenis({
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
      lerp: 0.08,
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  navAnchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || !targetId.startsWith("#")) return;
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;
      event.preventDefault();

      if (lenisInstance) {
        lenisInstance.scrollTo(targetElement, { offset: -18 });
      } else {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  image.src = DISPLAY_IMAGE;
  lens.style.backgroundImage = `url("${HD_IMAGE}")`;

  image.addEventListener("load", updateRect);
  window.addEventListener("resize", updateRect);

  card.addEventListener("pointerenter", onPointerEnter);
  card.addEventListener("pointermove", onPointerMove);
  card.addEventListener("pointerleave", onPointerLeave);

  window.addEventListener("scroll", () => {
    updateScrollProgress();
    revealTeamWhenVisible();
  });

  window.addEventListener("pointermove", onGlobalPointerMove, { passive: true });

  document.querySelectorAll("a, button, .product-card").forEach((el) => {
    el.addEventListener("pointerenter", onInteractiveEnter);
    el.addEventListener("pointerleave", onInteractiveLeave);
  });

  if (window.matchMedia("(pointer: fine)").matches) {
    cursorRafId = requestAnimationFrame(animateCursorRing);
  } else {
    cancelAnimationFrame(cursorRafId);
    cursorDot.style.display = "none";
    cursorRing.style.display = "none";
  }

  updateScrollProgress();
  revealTeamWhenVisible();
  initPrototypeStack();
}

init();
