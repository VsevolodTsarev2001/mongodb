const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const tpl = $("#userCardTpl");

const listEl = $("#users");
const form = $("#userForm");
const idEl = $("#userId"), nameEl = $("#name"), ageEl = $("#age"), emailEl = $("#email");
const resetBtn = $("#resetBtn");
const searchEl = $("#search");
const addDemoBtn = $("#addDemo");
const submitBtn = form.querySelector('button[type="submit"]');

const sortNameBtn = document.createElement("button");
const sortAgeBtn = document.createElement("button");
const paginationEl = document.createElement("div");
const infoEl = document.createElement("div");

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const pageSize = 5;
let sortField = null;  // 'name' or 'age'
let sortDirection = 1; // 1 - asc, -1 - desc

// Инициализация UI для сортировки и пагинации
function initControls() {
    const container = document.querySelector(".list-head");
    // Кнопки сортировки
    sortNameBtn.textContent = "Nimi 🔽";
    sortNameBtn.className = "btn ghost small";
    sortAgeBtn.textContent = "Vanus 🔽";
    sortAgeBtn.className = "btn ghost small";
    container.appendChild(sortNameBtn);
    container.appendChild(sortAgeBtn);

    // Информация о страницах
    infoEl.style.color = "var(--muted)";
    infoEl.style.marginTop = "6px";
    container.appendChild(infoEl);

    // Пагинация
    paginationEl.style.marginTop = "12px";
    paginationEl.style.display = "flex";
    paginationEl.style.justifyContent = "center";
    paginationEl.style.gap = "6px";
    paginationEl.style.flexWrap = "wrap";
    container.parentElement.insertBefore(paginationEl, container.nextSibling);

    sortNameBtn.addEventListener("click", () => {
        if (sortField === "name") sortDirection = -sortDirection;
        else { sortField = "name"; sortDirection = 1; }
        updateSortButtons();
        renderPage();
    });
    sortAgeBtn.addEventListener("click", () => {
        if (sortField === "age") sortDirection = -sortDirection;
        else { sortField = "age"; sortDirection = 1; }
        updateSortButtons();
        renderPage();
    });
}

function updateSortButtons(){
    sortNameBtn.textContent = `Nimi ${sortField === "name" ? (sortDirection === 1 ? "🔼" : "🔽") : ""}`;
    sortAgeBtn.textContent = `Vanus ${sortField === "age" ? (sortDirection === 1 ? "🔼" : "🔽") : ""}`;
}

// Сортировка массива пользователей
function sortUsers(users) {
    if (!sortField) return users;
    return [...users].sort((a,b) => {
        let av = a[sortField], bv = b[sortField];
        if (av === undefined || av === null) av = sortField === "name" ? "" : -Infinity;
        if (bv === undefined || bv === null) bv = sortField === "name" ? "" : -Infinity;

        if (sortField === "name") {
            av = av.toLowerCase();
            bv = bv.toLowerCase();
            if (av < bv) return -1 * sortDirection;
            if (av > bv) return 1 * sortDirection;
            return 0;
        } else {
            return (av - bv) * sortDirection;
        }
    });
}

// Построение пагинации и навигация по страницам
function renderPagination(totalItems) {
    paginationEl.innerHTML = "";
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return;

    function createPageBtn(page) {
        const btn = document.createElement("button");
        btn.textContent = page;
        btn.className = "btn ghost small";
        if (page === currentPage) {
            btn.style.fontWeight = "700";
            btn.style.backgroundColor = "var(--accent-2)";
            btn.style.color = "#000";
            btn.style.cursor = "default";
            btn.disabled = true;
        }
        btn.addEventListener("click", () => {
            currentPage = page;
            renderPage();
        });
        return btn;
    }

    // Кнопка назад
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "←";
    prevBtn.className = "btn ghost small";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });
    paginationEl.appendChild(prevBtn);

    // Кнопки страниц (максимум 7)
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(startPage + 6, totalPages);
    if (endPage - startPage < 6) {
        startPage = Math.max(1, endPage - 6);
    }
    for(let i = startPage; i <= endPage; i++) {
        paginationEl.appendChild(createPageBtn(i));
    }

    // Кнопка вперед
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "→";
    nextBtn.className = "btn ghost small";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });
    paginationEl.appendChild(nextBtn);

    // Инфо о количестве
    infoEl.textContent = `Kokku kasutajaid: ${totalItems}. Leht ${currentPage} / ${totalPages}`;
}

// Подсветка текста поиска
function highlight(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    return text.replace(re, "<mark>$1</mark>");
}

function renderPage() {
    const q = searchEl.value.toLowerCase().trim();
    let baseUsers = filteredUsers.length ? filteredUsers : allUsers;

    // Сортируем
    baseUsers = sortUsers(baseUsers);

    // Пагинация
    const total = baseUsers.length;
    const startIdx = (currentPage - 1) * pageSize;
    const pageUsers = baseUsers.slice(startIdx, startIdx + pageSize);

    listEl.innerHTML = "";
    pageUsers.forEach(u => {
        const node = tpl.content.firstElementChild.cloneNode(true);
        $(".name", node).innerHTML = highlight(u.name || "—", q);
        $(".meta", node).innerHTML = `${highlight(u.email || "ilma emailita", q)} • ${u.age ?? "—"} aastat`;
        node.dataset.id = u._id;

        $(".edit", node).addEventListener("click", () => {
            idEl.value = u._id;
            nameEl.value = u.name || "";
            ageEl.value = u.age ?? "";
            emailEl.value = u.email || "";
            nameEl.focus();
        });

        $(".del", node).addEventListener("click", async () => {
            if (!confirm(`Kustutada ${u.name || "kasutaja"}?`)) return;
            try {
                await fetch(`http://localhost:3000/api/users/${u._id}`, { method: "DELETE" });
                await reloadAfterChange();
            } catch(err) {
                alert("Kustutamisel tekkis viga: " + err.message);
            }
        });

        listEl.appendChild(node);
    });

    renderPagination(total);
}

// Обновление списка после добавления/удаления/редактирования
async function reloadAfterChange() {
    await load();
    filteredUsers = [];
    currentPage = 1;
    sortField = null;
    sortDirection = 1;
    updateSortButtons();
}

async function load(){
    try {
        const response = await fetch("http://localhost:3000/api/users");
        allUsers = await response.json(); // <-- преобразуем в массив
        filteredUsers = [];
        currentPage = 1;
        sortField = null;
        sortDirection = 1;
        updateSortButtons();
        renderPage();
    } catch(err) {
        alert("Viga andmete laadimisel: " + err.message);
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        name: nameEl.value.trim(),
        age: ageEl.value.trim() ? Number(ageEl.value) : undefined,
        email: emailEl.value.trim()
    };
    if (!payload.name) {
        alert("Palun sisesta nimi");
        nameEl.focus();
        return;
    }
    if (payload.email && !validateEmail(payload.email)) {
        alert("Palun sisesta korrektne e-post");
        emailEl.focus();
        return;
    }
    if (payload.age !== undefined && (isNaN(payload.age) || payload.age < 0)) {
        alert("Palun sisesta korrektne vanus");
        ageEl.focus();
        return;
    }

    submitBtn.disabled = true;
    try {
        if (idEl.value){
            await fetch(`http://localhost:3000/api/users/${idEl.value}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } else {
            await fetch("http://localhost:3000/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        }
        form.reset();
        idEl.value = "";
        await reloadAfterChange();
    } catch(err) {
        alert("Salvestamisel tekkis viga: " + err.message);
    } finally {
        submitBtn.disabled = false;
    }
});

resetBtn.addEventListener("click", () => {
    form.reset();
    idEl.value = "";
});

searchEl.addEventListener("input", () => {
    const q = searchEl.value.toLowerCase().trim();
    if (!q) {
        filteredUsers = [];
        currentPage = 1;
        renderPage();
        return;
    }
    filteredUsers = allUsers.filter(u =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
    currentPage = 1;
    renderPage();
});

addDemoBtn.addEventListener("click", async () => {
    const rand = Math.floor(Math.random()*1000);
    const demoUser = {
        name: `Kasutaja ${rand}`,
        age: 18 + (rand % 10),
        email: `kasutaja${rand}@mail.com`
    };
    try {
        await fetch("http://localhost:3000/api/users", {
            method: "POST",
            body: JSON.stringify(demoUser)
        });
        await reloadAfterChange();
    } catch(err) {
        alert("Demo kasutaja lisamisel viga: " + err.message);
    }
});

initControls();
load().catch(err => alert(err.message));
