// auth.js

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.querySelector(".loginForm");
    const createForm = document.querySelector(".createForm");
    const resetForm = document.querySelector(".resetForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (createForm) {
        createForm.addEventListener("submit", handleCreateAccount);
    }

    if (resetForm) {
        resetForm.addEventListener("submit", handleResetPassword);
    }

});

function handleLogin(e) {

    e.preventDefault();

    const user = document.getElementById("user").value.trim();
    const password = document.getElementById("password").value.trim();

    if (user === "" || password === "") {
        alert("Please fill all fields");
        return;
    }

    console.log("Login successful");

    // temporary redirect (until backend is added)
    window.location.href = "dashboard.html";

}

function handleCreateAccount(e) {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!name || !email || !password || !confirmPassword) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    alert("Account created successfully!");

    window.location.href = "landingpage.html";

}

function handleResetPassword(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (email === "") {
        alert("Please enter your email");
        return;
    }

    alert("Reset link sent!");

}