// ================================
// FAQ ACCORDION
// Toggle individual FAQ items open/closed
// Multiple can be open simultaneously
// ================================

function toggleFaq(questionBtn) {
    // Get the parent faq-item
    const faqItem = questionBtn.parentElement;

    // Toggle open class
    faqItem.classList.toggle("open");
}


// ================================
// CATEGORY FILTER
// Shows/hides FAQ items based on category
// Sections always visible — only items filtered
// ================================

let activeCategory = "all";

function filterCategory(category, btn) {
    activeCategory = category;

    // Update active pill
    document.querySelectorAll(".faq-pill").forEach(function (pill) {
        pill.classList.remove("active");
    });
    btn.classList.add("active");

    // Apply filter
    applyFilters();
}


// ================================
// SEARCH FILTER
// Filters FAQ items by question text
// ================================

function filterBySearch() {
    applyFilters();
}


// ================================
// APPLY FILTERS
// Combines category + search filters together
// ================================

function applyFilters() {
    const searchTerm = document.getElementById("faqSearch").value.toLowerCase().trim();
    const sections   = document.querySelectorAll(".faq-section");
    let totalVisible = 0;

    sections.forEach(function (section) {
        const sectionCategory = section.getAttribute("data-category");

        // Check if section matches active category
        const categoryMatch = activeCategory === "all" || sectionCategory === activeCategory;

        // Get all FAQ items in this section
        const items = section.querySelectorAll(".faq-item");
        let sectionVisible = 0;

        items.forEach(function (item) {
            const questionText = item.getAttribute("data-question").toLowerCase();

            // Check if question matches search term
            const searchMatch = searchTerm === "" || questionText.includes(searchTerm);

            // Show item only if both category and search match
            if (categoryMatch && searchMatch) {
                item.classList.remove("hidden");
                sectionVisible++;
                totalVisible++;
            } else {
                item.classList.add("hidden");

                // Close item if it gets hidden
                item.classList.remove("open");
            }
        });

        // Hide entire section if no items visible in it
        if (sectionVisible === 0) {
            section.style.display = "none";
        } else {
            section.style.display = "block";
        }
    });

    // Show/hide no results message
    const noResults = document.getElementById("noResults");
    if (totalVisible === 0) {
        noResults.classList.add("visible");
    } else {
        noResults.classList.remove("visible");
    }
}


// ================================
// KEYBOARD SUPPORT
// Allow Enter/Space to toggle FAQ via keyboard
// ================================

document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFaq(btn);
        }
    });
});


// ================================
// INIT — Open first FAQ by default
// Gives users a visual hint that items are expandable
// ================================

(function init() {
    const firstItem = document.querySelector(".faq-item");
    if (firstItem) {
        firstItem.classList.add("open");
    }
})();