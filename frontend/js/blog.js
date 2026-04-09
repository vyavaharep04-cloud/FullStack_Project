// ================================
// BLOG ARTICLE TOGGLE
// Expands / collapses full article content
// Multiple articles can be open simultaneously
// ================================

function toggleArticle(articleId, btn) {

    // Get the article card
    const article = document.getElementById(articleId);

    // Check current state
    const isOpen = article.classList.contains("open");

    if (isOpen) {

        // CLOSE — collapse article
        article.classList.remove("open");

        // Update button text
        btn.innerHTML = 'Read More <i class="fa-solid fa-chevron-down btn-arrow"></i>';

    } else {

        // OPEN — expand article
        article.classList.add("open");

        // Update button text
        btn.innerHTML = 'Read Less <i class="fa-solid fa-chevron-up btn-arrow"></i>';

        // Auto scroll to article smoothly
        setTimeout(function () {
            article.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 100);

    }
}


// ================================
// ASSIGNMENT 8 — IMAGE GALLERY CATEGORY FILTER
// Filters gallery items by data-category attribute
// Shows count of visible images
// Animates items in on filter change
// ================================

function filterGallery(category, clickedBtn) {

    // ---- 1. Update active button ----
    const allBtns = document.querySelectorAll(".filter-btn");
    allBtns.forEach(function (btn) {
        btn.classList.remove("active");
    });
    clickedBtn.classList.add("active");

    // ---- 2. Filter gallery items ----
    const allItems = document.querySelectorAll(".gallery-item");
    let visibleCount = 0;

    allItems.forEach(function (item) {

        const itemCategory = item.getAttribute("data-category");
        const matches = (category === "all") || (itemCategory === category);

        if (matches) {
            // Show item — remove hidden, add fade-in animation
            item.classList.remove("hidden");

            // Remove and re-add fade-in to re-trigger animation
            item.classList.remove("fade-in");
            void item.offsetWidth; // force reflow to restart animation
            item.classList.add("fade-in");

            visibleCount++;

        } else {
            // Hide item
            item.classList.add("hidden");
            item.classList.remove("fade-in");
        }

    });

    // ---- 3. Update count display ----
    const countEl = document.getElementById("visibleCount");
    const totalCount = allItems.length;

    if (countEl) {
        countEl.textContent = visibleCount;

        // Update full count text
        const galleryCount = document.getElementById("galleryCount");
        if (galleryCount) {
            galleryCount.innerHTML =
                'Showing <span id="visibleCount">' + visibleCount + '</span> of ' + totalCount + ' images';
        }
    }

    // ---- 4. Show/hide empty state ----
    const emptyEl = document.getElementById("galleryEmpty");
    const gridEl  = document.getElementById("galleryGrid");

    if (emptyEl && gridEl) {
        if (visibleCount === 0) {
            gridEl.style.display  = "none";
            emptyEl.style.display = "block";
        } else {
            gridEl.style.display  = "grid";
            emptyEl.style.display = "none";
        }
    }

}