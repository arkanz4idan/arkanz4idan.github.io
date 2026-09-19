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

    const apiUrl =
        `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.postsPath}/${name}.md`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Post "${name}" not found.`);
    }

    const data = await response.json();

    /*
     * GitHub API returns the file content as Base64.
     */

    const markdown = decodeBase64(data.content);

    title.textContent = name;

    content.innerHTML = marked.parse(markdown);
}


async function loadPostList() {
    const apiUrl =
        `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.postsPath}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(
            `Failed to load posts. Status: ${response.status}`
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


function decodeBase64(base64) {
    const binary = atob(
        base64.replace(/\s/g, "")
    );

    const bytes = Uint8Array.from(
        binary,
        char => char.charCodeAt(0)
    );

    return new TextDecoder("utf-8").decode(bytes);
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
            <p class="error">
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}


init();