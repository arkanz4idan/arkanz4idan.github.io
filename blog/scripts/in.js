const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signInButton = document.getElementById("sign-in");
const signUpButton = document.getElementById("sign-up");

const authStatus = document.getElementById("auth-status");

let captchaToken = null;

function showStatus(message) {
    authStatus.textContent = message;
}

function onCaptchaSuccess(token) {
    captchaToken = token;
}

window.onCaptchaSuccess = onCaptchaSuccess;

function resetCaptcha() {
    captchaToken = null;

    if (window.hcaptcha) {
        window.hcaptcha.reset();
    }
}

signInButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showStatus("Please enter your email and password.");
        return;
    }

    if (!captchaToken) {
        showStatus("Please complete the CAPTCHA.");
        return;
    }

    showStatus("Signing in...");

    const { error } = await login(email, password, captchaToken);

    resetCaptcha();

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

    if (!captchaToken) {
        showStatus("Please complete the CAPTCHA.");
        return;
    }

    showStatus("Creating account...");

    const { error } = await register(email, password, captchaToken);

    resetCaptcha();

    if (error) {
        showStatus(error.message);
        return;
    }

    showStatus(
        "Account created. Please check your email to verify your account."
    );
});


async function checkCurrentUser() {
    const user = await getCurrentUser();

    console.log("Logged in user:", user);
}

checkCurrentUser();


const googleLoginButton = document.getElementById("google-login");

googleLoginButton.addEventListener("click", async () => {
    showStatus("Redirecting to Google...");

    const { error } = await db.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `https://arkanz4idan.github.io/blog/`
        }
    });

    if (error) {
        showStatus(error.message);
    }
});