const USER = "arkanz4idan";
const REPO = "arkanz4idan.github.io";
const BRANCH = "main";
const PATH = "sch";

const table = document.getElementById("directory");

async function loadDirectory() {

    table.innerHTML = `
        <tr>
            <td colspan="2">Loading...</td>
        </tr>
    `;

    const response = await fetch(
        `https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}`
    );

    if (!response.ok) {

        table.innerHTML = `
            <tr>
                <td colspan="2">
                    Failed to load directory.
                </td>
            </tr>
        `;

        return;

    }

    const items = await response.json();

    table.innerHTML = "";

    // Folder dulu
    items
        .filter(item => item.type === "dir")
        .forEach(item => {

            table.innerHTML += `
                <tr>

                    <td>
                        📁
                        <a href="${item.name}/">
                            ${item.name}/
                        </a>
                    </td>

                    <td>-</td>

                </tr>
            `;

        });

    // Baru file
    items
        .filter(item => item.type === "file")
        .forEach(item => {

            const raw =
                `https://raw.githubusercontent.com/${USER}/${REPO}/${BRANCH}/${PATH}/${item.name}`;

            table.innerHTML += `
                <tr>

                    <td>
                        📄 ${item.name}
                    </td>

                    <td>

                        <a href="${item.html_url}" target="_blank">
                            View
                        </a>

                        |

                        <a href="${raw}" download>
                            Download
                        </a>

                    </td>

                </tr>
            `;

        });

}

loadDirectory();