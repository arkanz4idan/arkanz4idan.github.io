const CONFIG = {
    repoOwner: "arkanz4idan",
    repoName: "arkanz4idan.github.io",
    postsPath: "blog/posts"
};

const content = document.getElementById("content");
const title = document.getElementById("page-title");

const params = new URLSearchParams(window.location.search);
const postName = params.get("post");

async function loadPost(name) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw new Error("Invalid post name.");
    }

    const url =
        `/${CONFIG.postsPath}/${encodeURIComponent(name)}.md`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Post "${name}" not found.`);
    }

    const text = await response.text();

    title.textContent = name;
    content.innerHTML = `
        <div class="post">
            <pre>${escapeHTML(text)}</pre>
        </div>
    `;
}

async function loadPostList() {
    const apiUrl =
        `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.postsPath}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(
            `Failed to load posts (Status: ${response.status}).`
        );
    }

    const data = await response.json();

    const posts = data
        .filter(item =>
            item.type === "file" &&
            item.name.toLowerCase().endsWith(".md")
        )
        .sort((a, b) =>
            a.name.localeCompare(b.name)
        );

    title.textContent = "Blog";

    if (posts.length === 0) {
        content.innerHTML = "<p>No posts found.</p>";
        return;
    }

    let html = "";

    for (const post of posts) {
        const name = post.name.replace(/\.md$/i, "");

        html += `
            <div class="item">
                <a href="?post=${encodeURIComponent(name)}">
                    ${escapeHTML(name)}
                </a>
            </div>
        `;
    }

    content.innerHTML = html;
}

function escapeHTML(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function init() {
    try {
        if (postName) {
            await loadPost(postName);
        } else {
            await loadPostList();
        }
    } catch (error) {
        content.innerHTML = `
            <span class="error">
                Error: ${escapeHTML(error.message)}
            </span>
        `;
    }
}

init();