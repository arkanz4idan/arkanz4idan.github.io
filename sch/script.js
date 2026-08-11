// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    repoOwner: "arkanz4idan",
    repoName: "arkanz4idan.github.io",
    basePath: "/sch",
    iconFolder: "📁",
    iconFile: "📄",
};

function initDirectoryListing() {
    let currentPath = window.location.pathname;

    // 1. Ensure directory paths end with a slash for consistency
    if (!currentPath.endsWith("/")) {
        const lastSegment = currentPath.split("/").pop();
        // If it doesn't look like a file (no dot in the last segment), redirect to add slash
        if (!lastSegment.includes(".")) {
            window.location.href = currentPath + "/";
            return; // Safely exit the function
        }
    }

    // 2. Extract repository path (remove leading and trailing slashes)
    // Example: "/sch/" -> "sch", "/sch/audio/" -> "sch/audio"
    let repoPath = currentPath.substring(1).replace(/\/$/, "");

    // 3. STRICT SCOPE CHECK
    // This script is ONLY for /sch/ and its subfolders.
    // If repoPath is empty (root) or doesn't start with "sch", ABORT immediately.
    // This prevents fetching root contents and protects your root index.html.
    if (repoPath === "" || !repoPath.startsWith("sch")) {
        document.getElementById("page-title").innerText = "Directory Listing";
        document.getElementById("content").innerHTML = `
            <span class="error">This script is strictly configured for the /sch/ directory.<br>
            Please access <a href="/sch/">/sch/</a> instead.</span>`;
        return; // Stop execution completely
    }

    // 4. Set the page title
    document.getElementById("page-title").innerText = `Index of ${currentPath}`;

    // 5. GitHub API URL to fetch contents strictly within the scoped path
    const apiUrl = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${repoPath}`;

    // Function to check if a folder contains an index.html file (using HEAD request to save API limits)
    async function hasIndexHtml(folderName) {
        try {
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
                </small>`;
        }
    }

    // Execute the render function
    renderDirectory();
}

// Start the script
initDirectoryListing();
