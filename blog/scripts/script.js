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

    await loadComments(name);
}

async function loadComments(postName) {
    const commentsSection = document.createElement("section");

    commentsSection.className = "comments-section";

    commentsSection.innerHTML = `
        <h2>COMMENTS</h2>

        <div id="comments-list">
            <p>Loading comments...</p>
        </div>

        <div class="comment-form">
            <textarea
                id="comment-input"
                placeholder="Write a comment..."
                rows="4"
            ></textarea>

            <button id="comment-submit">
                POST COMMENT
            </button>

            <p id="comment-status"></p>
        </div>
    `;

    content.appendChild(commentsSection);

    const commentsList =
        document.getElementById("comments-list");

    const commentInput =
        document.getElementById("comment-input");

    const commentSubmit =
        document.getElementById("comment-submit");

    const commentStatus =
        document.getElementById("comment-status");

    const { data, error } = await getComments(postName);

    if (error) {
        commentsList.innerHTML =
            `<p>Failed to load comments.</p>`;
        console.error(error);
        return;
    }

    renderComments(data);

   async function renderComments(comments) {
        if (!comments || comments.length === 0) {
            commentsList.innerHTML =
                `<p>No comments yet.</p>`;
            return;
        }

        const currentUser = await getCurrentUser();

        const commentIds = comments.map(
            comment => comment.id
        );

        const {
            data: likes,
            error: likesError
        } = await getCommentLikes(commentIds);

        if (likesError) {
            console.error(likesError);
        }

        commentsList.innerHTML = comments.map(comment => {

            const commentLikes = (likes || []).filter(
                like => like.comment_id === comment.id
            );

            const likeCount = commentLikes.length;

            const userLiked =
                currentUser &&
                commentLikes.some(
                    like => like.user_id === currentUser.id
                );

            const isOwner =
                currentUser &&
                currentUser.id === comment.user_id;

            return `
                <div class="comment">

                    <div class="comment-author">

                        ${
                            comment.author_avatar
                                ? `<img
                                    src="${escapeHTML(comment.author_avatar)}"
                                    alt=""
                                >`
                                : ""
                        }

                        <strong>
                            ${escapeHTML(
                                comment.author_name || "User"
                            )}
                        </strong>

                    </div>

                    <p>
                        ${escapeHTML(comment.content)}
                    </p>

                    <small>
                        ${new Date(
                            comment.created_at
                        ).toLocaleString()}
                    </small>

                    <div class="comment-actions">

                        <button
                            class="like-comment ${userLiked ? "liked" : ""}"
                            data-comment-id="${comment.id}"
                        >
                            ${userLiked ? "♥" : "♡"}
                            <span>${likeCount}</span>
                        </button>

                        <button
                            class="reply-comment"
                            data-author="${escapeHTML(
                                comment.author_name || "User"
                            )}"
                        >
                            REPLY
                        </button>

                        ${
                            isOwner
                                ? `
                                    <button
                                        class="delete-comment"
                                        data-comment-id="${comment.id}"
                                    >
                                        DELETE
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>
            `;
        }).join("");

        /*
        * LIKE
        */

        document
            .querySelectorAll(".like-comment")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const user =
                            await getCurrentUser();

                        if (!user) {
                            window.location.href =
                                "in.html";
                            return;
                        }

                        const commentId =
                            button.dataset.commentId;

                        const alreadyLiked =
                            button.classList.contains(
                                "liked"
                            );

                        button.disabled = true;

                        if (alreadyLiked) {

                            const {
                                error
                            } = await unlikeComment(
                                commentId,
                                user.id
                            );

                            if (error) {
                                console.error(error);
                                button.disabled = false;
                                return;
                            }

                        } else {

                            const {
                                error
                            } = await likeComment(
                                commentId,
                                user.id
                            );

                            if (error) {
                                console.error(error);
                                button.disabled = false;
                                return;
                            }
                        }

                        button.disabled = false;

                        await renderComments(
                            comments
                        );
                    }
                );
            });


        /*
        * REPLY
        */

        document
            .querySelectorAll(".reply-comment")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const author =
                            button.dataset.author;

                        commentInput.focus();

                        commentInput.value =
                            `@${author} `;

                        commentInput.setSelectionRange(
                            commentInput.value.length,
                            commentInput.value.length
                        );
                    }
                );
            });


        /*
        * DELETE
        */

        document
            .querySelectorAll(".delete-comment")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const commentId =
                            button.dataset.commentId;

                        const confirmed =
                            confirm(
                                "Delete this comment?"
                            );

                        if (!confirmed) {
                            return;
                        }

                        button.disabled = true;
                        button.textContent =
                            "DELETING...";

                        const {
                            error
                        } = await deleteComment(
                            commentId
                        );

                        if (error) {
                            console.error(error);

                            button.disabled = false;
                            button.textContent =
                                "DELETE";

                            commentStatus.textContent =
                                error.message;

                            return;
                        }

                        const index =
                            comments.findIndex(
                                comment =>
                                    comment.id ===
                                    commentId
                            );

                        if (index !== -1) {
                            comments.splice(
                                index,
                                1
                            );
                        }

                        await renderComments(
                            comments
                        );
                    }
                );
            });
    }
    commentSubmit.addEventListener("click", async () => {
        const text = commentInput.value.trim();

        if (!text) {
            commentStatus.textContent =
                "Comment cannot be empty.";
            return;
        }

        const user = await getCurrentUser();

        if (!user) {
            window.location.href = "in.html";
            return;
        }

        commentSubmit.disabled = true;
        commentStatus.textContent = "Posting...";

        const { data: newComment, error } =
            await addComment(postName, text);

        if (error) {
            commentStatus.textContent = error.message;
            commentSubmit.disabled = false;
            return;
        }

        commentInput.value = "";
        commentStatus.textContent = "";

        if (!data) {
            renderComments([newComment]);
        } else {
            data.push(newComment);
            renderComments(data);
        }

        commentSubmit.disabled = false;
    });
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

const accountButton = document.getElementById("account-button");
const accountAvatar = document.getElementById("account-avatar");

async function setupAccountButton() {
    const user = await getCurrentUser();

    if (!user) {
        accountButton.href = "in.html";
        return;
    }

    accountButton.href = "account.html";

    const avatar =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture;

    if (avatar) {
        accountAvatar.src = avatar;
    }

    accountButton.title =
        user.user_metadata?.full_name ||
        user.email;
}

setupAccountButton();

const subscriptionEmail =
    document.getElementById("subscription-email");

const subscriptionSubmit =
    document.getElementById("subscription-submit");

const subscriptionStatus =
    document.getElementById("subscription-status");

subscriptionSubmit.addEventListener("click", async () => {
    const email = subscriptionEmail.value.trim();

    if (!email) {
        subscriptionStatus.textContent =
            "Please enter your email.";
        return;
    }

    if (!subscriptionEmail.checkValidity()) {
        subscriptionStatus.textContent =
            "Please enter a valid email.";
        return;
    }

    subscriptionSubmit.disabled = true;
    subscriptionStatus.textContent =
        "Subscribing...";

    const { error } = await subscribe(email);

    if (error) {
        if (error.code === "23505") {
            subscriptionStatus.textContent =
                "You are already subscribed.";
        } else {
            subscriptionStatus.textContent =
                error.message;
        }

        subscriptionSubmit.disabled = false;
        return;
    }

    subscriptionStatus.textContent =
        "Successfully subscribed!";

    subscriptionEmail.value = "";
    subscriptionSubmit.disabled = false;
});