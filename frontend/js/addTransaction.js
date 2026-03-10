const incomeBtn = document.getElementById("incomeBtn");
const expenseBtn = document.getElementById("expenseBtn");
const categorySelect = document.getElementById("category");
const customCategoryInput = document.getElementById("customCategory");

const amountInput = document.querySelector(".amount-input");
const dateInput = document.querySelector("input[type='date']");

const previewAmount = document.getElementById("previewAmount");
const previewType = document.getElementById("previewType");
const previewCategory = document.getElementById("previewCategory");
const previewDate = document.getElementById("previewDate");

let currentType = "Income";

const incomeCategories = ["Salary", "Freelancing", "Business", "Investment", "Gift", "Other", "+ Add Custom Category"];
const expenseCategories = ["Food", "Travel", "Shopping", "Bills", "Entertainment", "Health", "Other", "+ Add Custom Category"];

// Load categories
function loadCategories(type) {
    categorySelect.innerHTML = "<option value=''>Select category</option>";
    
    const categories = type === "Income" ? incomeCategories : expenseCategories;
    
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

loadCategories(currentType);

// Toggle buttons
incomeBtn.addEventListener("click", () => {
    currentType = "Income";
    incomeBtn.classList.add("active");
    expenseBtn.classList.remove("active");
    expenseBtn.classList.remove("expense-active");
    loadCategories("Income");
    previewType.textContent = "Income";
});

expenseBtn.addEventListener("click", () => {
    currentType = "Expense";
    expenseBtn.classList.add("active");
    expenseBtn.classList.add("expense-active");
    incomeBtn.classList.remove("active");
    loadCategories("Expense");
    previewType.textContent = "Expense";
});

// Category change
categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "+ Add Custom Category") {
        customCategoryInput.style.display = "block";
        previewCategory.textContent = "Custom";
    } else {
        customCategoryInput.style.display = "none";
        previewCategory.textContent = categorySelect.value || "—";
    }
});

// Custom category typing
customCategoryInput.addEventListener("input", () => {
    previewCategory.textContent = customCategoryInput.value || "Custom";
});

// Amount update
amountInput.addEventListener("input", () => {
    previewAmount.textContent = "₹ " + (amountInput.value || "0");
});

// Date update
dateInput.addEventListener("change", () => {
    previewDate.textContent = dateInput.value || "—";
});
