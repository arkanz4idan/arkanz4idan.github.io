const profileAvatar = document.getElementById("profile-avatar");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const logoutButton = document.getElementById("logout-button");
const accountStatus = document.getElementById("account-status");

async function loadAccount() {
    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "in.html";
        return;
    }

    const metadata = user.user_metadata || {};

    profileAvatar.src =
        metadata.avatar_url ||
        metadata.picture ||
        "../assets/logo.png";

    profileName.textContent =
        metadata.full_name ||
        metadata.name ||
        "User";

    profileEmail.textContent =
        user.email || "";
}

logoutButton.addEventListener("click", async () => {
    accountStatus.textContent = "Logging out...";

    const { error } = await logout();

    if (error) {
        accountStatus.textContent = error.message;
        return;
    }

    window.location.href = "in.html";
});

loadAccount();