// ================================
// MOBILE MENU TOGGLE
// ================================

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  const menuBtn = document.getElementById("menuBtn");

  nav.classList.toggle("open");

  // Update icon based on state
  menuBtn.textContent = nav.classList.contains("open") ? "✕" : "☰";
}

// Close menu when a nav link is clicked (mobile UX)
document.querySelectorAll(".nav-links a").forEach(function (link) {
  link.addEventListener("click", function () {
    const nav = document.getElementById("navLinks");
    const menuBtn = document.getElementById("menuBtn");
    nav.classList.remove("open");
    menuBtn.textContent = "☰";
  });
});

// Close menu when clicking outside navbar (mobile UX)
document.addEventListener("click", function (e) {
  const nav = document.getElementById("navLinks");
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.querySelector(".navbar");

  if (!navbar.contains(e.target)) {
    nav.classList.remove("open");
    menuBtn.textContent = "☰";
  }
});


// ================================
// CONTACT FORM HANDLER
// ================================

document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const message = document.getElementById("contactMessage").value.trim();

  if (!name || !email || !message) {
    alert("Please fill in all fields before sending.");
    return;
  }

  alert("Thank you, " + name + "! Your message has been sent. We'll get back to you soon.");
  this.reset();
});


// ================================
// ACTIVE NAV LINK ON SCROLL
// ================================

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a[href^='#']");

window.addEventListener("scroll", function () {
  let current = "";

  sections.forEach(function (section) {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach(function (link) {
    link.classList.remove("active-link");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active-link");
    }
  });
});

// ================================
// LIVE CHARACTER COUNTER
// ================================

const messageBox = document.getElementById("contactMessage");
const charCount = document.getElementById("charCount");
const MAX_CHARS = 300;

messageBox.addEventListener("input", function () {

  // Hard limit — trim if exceeds 300
  if (messageBox.value.length > MAX_CHARS) {
    messageBox.value = messageBox.value.substring(0, MAX_CHARS);
  }

  const length = messageBox.value.length;
  charCount.textContent = length;

  // Color change based on usage
  charCount.classList.remove("warn", "danger");

  if (length >= 250) {
    charCount.classList.add("danger");
  } else if (length >= 200) {
    charCount.classList.add("warn");
  }
});