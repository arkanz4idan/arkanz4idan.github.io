const USER = "arkanz4idan";
const REPO = "arkanz4idan.github.io";
const BRANCH = "main";
const PATH = "sch";

const directory = document.getElementById("directory");

async function loadDirectory() {

    directory.innerHTML = `
        <tr>
            <td colspan="2">Loading...</td>
        </tr>
    `;

    try {

        const response = await fetch(
            `https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}`
        );

        if (!response.ok) {
            throw new Error("Failed to load directory");
        }

        const items = await response.json();

        directory.innerHTML = "";

        // Folder dulu
        items
            .filter(item => item.type === "dir")
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(item => {

                directory.innerHTML += `
                    <tr>

                        <td>
                            📁
                            <a href="${item.name}/">${item.name}/</a>
                        </td>

                        <td>-</td>

                    </tr>
                `;

            });

        // File setelah folder
        items
            .filter(item => item.type === "file")
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(item => {

                const raw =
                    `https://raw.githubusercontent.com/${USER}/${REPO}/${BRANCH}/${PATH}/${item.name}`;

                let actions = `<a href="${raw}" download>Download</a>`;

                // Jika HTML tampilkan View
                if (item.name.toLowerCase().endsWith(".html")) {

                    const view =
                        `${window.location.origin}${window.location.pathname}${item.name}`;

                    actions =
                        `<a href="${view}">View</a> | ${actions}`;

                }

                directory.innerHTML += `
                    <tr>

                        <td>
                            📄 ${item.name}
                        </td>

                        <td>
                            ${actions}
                        </td>

                    </tr>
                `;

            });

    }

    catch (error) {

        console.error(error);

        directory.innerHTML = `
            <tr>
                <td colspan="2">
                    Failed to load directory.
                </td>
            </tr>
        `;

    }

}

loadDirectory();
