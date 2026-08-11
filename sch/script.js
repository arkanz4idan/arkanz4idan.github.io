// ==========================================
// KONFIGURASI (EDIT BAGIAN INI JIKA PERLU)
// ==========================================
const CONFIG = {
    repoOwner: "arkanz4idan",               // Username GitHub kamu
    repoName: "arkanz4idan.github.io",      // Nama repository kamu
    basePath: "/sch",                       // Folder dasar di website
    iconFolder: "📁",                       // Ikon folder
    iconFile: "📄",                         // Ikon file
};
// ==========================================

// Ambil path dari URL browser
let currentPath = window.location.pathname;

// Pastikan path berakhir dengan slash untuk konsistensi folder
if (!currentPath.endsWith("/")) {
    // Jika ini adalah file (ada titik setelah slash terakhir), biarkan saja
    // Jika ini folder tapi tanpa slash, redirect ke versi dengan slash
    if (!currentPath.includes(".", currentPath.lastIndexOf("/"))) {
        window.location.href = currentPath + "/";
    }
}

// Hitung path relatif terhadap basePath untuk API GitHub
let repoPath = currentPath.startsWith(CONFIG.basePath) 
    ? currentPath.substring(CONFIG.basePath.length) 
    : "";
repoPath = repoPath.replace(/^\/|\/$/g, ""); // Hapus slash di awal/akhir

// Tampilkan judul yang rapi
const displayPath = currentPath === CONFIG.basePath + "/" ? CONFIG.basePath + "/" : currentPath;
document.getElementById("page-title").innerText = `Index of ${displayPath}`;

// URL API GitHub untuk mengambil isi folder
const apiUrl = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${repoPath}`;

// Fungsi untuk mengecek apakah folder memiliki index.html (tanpa makan rate limit API)
async function hasIndexHtml(folderName) {
    try {
        // Gunakan HEAD request ke path relatif. Jika 200 OK, berarti ada.
        const checkUrl = `${CONFIG.basePath}/${repoPath ? repoPath + '/' : ''}${encodeURIComponent(folderName)}/index.html`;
        const response = await fetch(checkUrl, { method: "HEAD" });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function renderDirectory() {
    const contentDiv = document.getElementById("content");
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Gagal memuat direktori (Status: ${response.status}). Pastikan repository bersifat Public.`);
        }
        
        const data = await response.json();
        
        // Pisahkan dan urutkan: Folder dulu, lalu File. Kecualikan 'index.html' dari daftar file.
        const folders = data
            .filter(item => item.type === "dir")
            .sort((a, b) => a.name.localeCompare(b.name));
            
        const files = data
            .filter(item => item.type === "file" && item.name.toLowerCase() !== "index.html")
            .sort((a, b) => a.name.localeCompare(b.name));

        let html = "";

        // Tombol Kembali ke Atas (Parent Directory)
        if (displayPath !== CONFIG.basePath + "/") {
            html += `
            <div class="item">
                <span class="icon">${CONFIG.iconFolder}</span>
                <span class="name"><a href="../">../</a></span>
                <span class="actions">| <a href="../">enter</a></span>
            </div>`;
        }

        // Render Folders
        for (const folder of folders) {
            const folderUrl = `./${encodeURIComponent(folder.name)}/`;
            const hasIndex = await hasIndexHtml(folder.name);
            
            let actions = `| <a href="${folderUrl}">enter</a>`;
            // KONDISI: Jika ada index.html, tambahkan tombol 'view'
            if (hasIndex) {
                actions += ` <a href="${folderUrl}">view</a>`;
            }

            html += `
            <div class="item">
                <span class="icon">${CONFIG.iconFolder}</span>
                <span class="name"><a href="${folderUrl}">${folder.name}/</a></span>
                <span class="actions">${actions}</span>
            </div>`;
        }

        // Render Files
        for (const file of files) {
            const fileUrl = `./${encodeURIComponent(file.name)}`;
            html += `
            <div class="item">
                <span class="icon">${CONFIG.iconFile}</span>
                <span class="name">${file.name}</span>
                <span class="actions">| <a href="${fileUrl}">view</a> <a href="${fileUrl}" download>download</a></span>
            </div>`;
        }

        // Jika folder benar-benar kosong
        if (folders.length === 0 && files.length === 0) {
            html = `<div class="item"><span class="name">Folder kosong.</span></div>`;
        }

        contentDiv.innerHTML = html;

    } catch (error) {
        contentDiv.innerHTML = `
            <span class="error">Error: ${error.message}</span><br>
            <small style="color:#666;">
                Catatan: GitHub API membatasi 60 permintaan/jam untuk IP yang sama. 
                Jika sering terjadi, pertimbangkan untuk menggunakan script generator statis.
            </small>`;
    }
}

// Jalankan fungsi render
renderDirectory();
