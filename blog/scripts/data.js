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
    const { data, error } = await db.auth.signUp({
        email,
        password
    });

    return { data, error };
}

async function login(email, password) {
    const { data, error } = await db.auth.signInWithPassword({
        email,
        password
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