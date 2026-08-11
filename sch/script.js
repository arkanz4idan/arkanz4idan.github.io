// ==========================================
// CONFIGURATION (EDIT THIS SECTION IF NEEDED)
// ==========================================
const CONFIG = {
    repoOwner: "arkanz4idan",               // Your GitHub username
    repoName: "arkanz4idan.github.io",      // Your repository name
    basePath: "/sch",                       // Base directory scope
    iconFolder: "📁",                       // Folder icon
    iconFile: "📄",                         // File icon
};
// ==========================================

// Get current path from browser URL
let currentPath = window.location.pathname;

// Ensure path ends with a slash for consistent directory handling
if (!currentPath.endsWith("/")) {
    // If it's a file (has a dot after the last slash), leave it alone
    // If it's a directory without a slash, redirect to the slashed version
    if (!currentPath.includes(".", currentPath.lastIndexOf("/"))) {
        window.location.href = currentPath + "/";
    }
}

// Extract repository path (e.g., "sch" or "sch/folder1")
// Remove leading and trailing slashes
let repoPath = currentPath.replace(/^\/|\/$/g, "");

// Scope check: Ensure we are strictly inside the 'sch' directory
if (!repoPath.startsWith("sch")) {
    window.location.href = CONFIG.basePath + "/";
}

// Display title
document.getElementById("page-title").innerText = `Index of ${currentPath}`;

// GitHub API URL to fetch directory contents strictly within the repo path
const apiUrl = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${repoPath}`;

// Function to check if a folder contains an index.html file
// Uses a HEAD request to avoid consuming GitHub API rate limits
async function hasIndexHtml(folderName) {
    try {
        // Construct the absolute URL to check for index.html dynamically
        const checkUrl = window.location.origin + window.location.pathname + encodeURIComponent(folderName) + "/index.html";
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
            throw new Error(`Failed to load directory (Status: ${response.status}). Ensure the repository is Public.`);
        }
        
        const data = await response.json();
        
        // Separate and sort: Folders first, then Files. Exclude 'index.html' from the file list.
        const folders = data
            .filter(item => item.type === "dir")
            .sort((a, b) => a.name.localeCompare(b.name));
            
        const files = data
            .filter(item => item.type === "file" && item.name.toLowerCase() !== "index.html")
            .sort((a, b) => a.name.localeCompare(b.name));

        let html = "";

        // Parent Directory Link (if not at the root of /sch/)
        if (currentPath !== CONFIG.basePath + "/") {
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
            // CONDITION: If index.html exists, add the 'view' button
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

        // If the directory is completely empty
        if (folders.length === 0 && files.length === 0) {
            html = `<div class="item"><span class="name">Empty directory.</span></div>`;
        }

        contentDiv.innerHTML = html;

    } catch (error) {
        contentDiv.innerHTML = `
            <span class="error">Error: ${error.message}</span><br>
            <small style="color:#666;">
                Note: GitHub API limits to 60 requests per hour per IP address. 
                If this occurs frequently, consider using a static generator script.
            </small>`;
    }
}

// Execute the render function
renderDirectory();
