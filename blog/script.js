const REPO = "https://raw.githubusercontent.com/arkanz4idan/arkanz4idan.github.io/main";
const POSTS_PATH = "blog/posts";

const content = document.getElementById("content");
const title = document.getElementById("page-title");

const params = new URLSearchParams(window.location.search);
const postName = params.get("post");

async function loadPost(name) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw new Error("Invalid post name.");
    }

    const url = `${REPO}/${POSTS_PATH}/${encodeURIComponent(name)}.md`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Post "${name}" not found.`);
    }

    const markdown = await response.text();

    title.textContent = name;

    content.innerHTML = marked.parse(markdown);
}

async function loadPostList() {
    const apiUrl =
        `https://api.github.com/repos/arkanz4idan/arkanz4idan.github.io/contents/${POSTS_PATH}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Failed to load posts: ${response.status}`);
    }

    const files = await response.json();

    const posts = files
        .filter(file =>
            file.type === "file" &&
            file.name.toLowerCase().endsWith(".md")
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    if (posts.length === 0) {
        content.innerHTML = "<p>No posts found.</p>";
        return;
    }

    content.innerHTML = posts.map(file => {
        const name = file.name.replace(/\.md$/i, "");

        return `
            <div class="item">
                <a href="?post=${encodeURIComponent(name)}">
                    ${escapeHTML(name)}
                </a>
            </div>
        `;
    }).join("");
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
            <p class="error">${escapeHTML(error.message)}</p>
        `;
    }
}

init();