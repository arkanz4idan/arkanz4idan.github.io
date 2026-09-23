const SUPABASE_URL = "https://jgioombfasvolevvieth.supabase.co";
const SUPABASE_KEY = "sb_publishable_EzyOfpdUeKBGAZOadv-UmA___C1YQ_z";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function testDatabase() {
    const { data, error } = await db
        .from("comments")
        .select("*")
        .limit(1);

    console.log("Database test:", {
        data,
        error
    });
}

testDatabase();

async function register(email, password) {
    const { data, error } = await db.auth.signUp({ email, password });
    return { data, error };
}

async function login(email, password, captchaToken) {
    const { data, error } = await db.auth.signInWithPassword({
        email,
        password,
        options: {
            captchaToken
        }
    });

    return { data, error };
}

async function logout() {
    const { error } = await db.auth.signOut();

    return { error };
}

async function getCurrentUser() {
    const {
        data: { user }
    } = await db.auth.getUser();

    return user;
}

async function getComments(postName) {
    const { data, error } = await db
        .from("comments")
        .select("*")
        .eq("post_name", postName)
        .order("created_at", {
            ascending: true
        });

    return { data, error };
}


async function addComment(postName, content) {
    const user = await getCurrentUser();

    if (!user) {
        return {
            data: null,
            error: new Error("You must be signed in to comment.")
        };
    }

    const metadata = user.user_metadata || {};

    const { data, error } = await db
        .from("comments")
        .insert({
            post_name: postName,
            user_id: user.id,
            content: content,
            author_name:
                metadata.full_name ||
                metadata.name ||
                user.email,
            author_avatar:
                metadata.avatar_url ||
                metadata.picture ||
                null
        })
        .select()
        .single();

    return { data, error };
}

async function deleteComment(commentId) {
    const { data, error } = await db
        .from("comments")
        .delete()
        .eq("id", commentId)
        .select()
        .single();

    return { data, error };
}

async function getCommentLikes(commentIds) {
    if (!commentIds.length) {
        return { data: [], error: null };
    }

    const { data, error } = await db
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);

    return { data, error };
}


async function likeComment(commentId, userId) {
    const { data, error } = await db
        .from("comment_likes")
        .insert({
            comment_id: commentId,
            user_id: userId
        })
        .select()
        .single();

    return { data, error };
}


async function unlikeComment(commentId, userId) {
    const { data, error } = await db
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .select()
        .single();

    return { data, error };
}

async function subscribe(email) {
    const { error } = await db
        .from("subscriptions")
        .insert({
            email: email
        });

    return { error };
}