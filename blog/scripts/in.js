const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signInButton = document.getElementById("sign-in");
const signUpButton = document.getElementById("sign-up");

const authStatus = document.getElementById("auth-status");

function showStatus(message) {
    authStatus.textContent = message;
}

signInButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showStatus("Please enter your email and password.");
        return;
    }

    showStatus("Signing in...");

    const { error } = await login(email, password);

    if (error) {
        showStatus(error.message);
        return;
    }

    showStatus("Signed in successfully.");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 500);
});


signUpButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showStatus("Please enter your email and password.");
        return;
    }

    showStatus("Creating account...");

    const { error } = await register(email, password);

    if (error) {
        showStatus(error.message);
        return;
    }

    showStatus(
        "Account created. Please check your email to verify your account."
    );
});

const user = await getCurrentUser();

console.log("Logged in user:", user);