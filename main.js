// --- 1. KHAI BÁO BIẾN ---
let maxPostId = 0;
let maxCommentId = 0;
let allPosts = [];
let currentPage = 1;
let pageSize = 10;
let searchQuery = '';
let sortField = '';
let sortOrder = 'asc';

// --- 2. MAIN FLOW ---
document.addEventListener("DOMContentLoaded", function() { LoadData(); });

function LoadData() {
    init();
    loadPosts();
    LoadComments();
}

function init() {
    const pageSizeEl = document.getElementById('page_size');
    if (pageSizeEl) pageSizeEl.value = pageSize;
}

// --- 3. POSTS LOGIC ---
function loadPosts() {
    pageSize = parseInt(document.getElementById('page_size').value) || 10;
    fetch('https://api.escuelajs.co/api/v1/products')
        .then(res => res.json())
        .then(products => {
            allPosts = products;
            displayPosts();
        })
        .catch(err => console.error(err));
}

function displayPosts() {
    // Filter
    let filtered = allPosts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort
    if (sortField) {
        filtered.sort((a, b) => {
            let aVal = sortField === 'views' ? parseInt(a.views) : a.title.toLowerCase();
            let bVal = sortField === 'views' ? parseInt(b.views) : b.title.toLowerCase();
            return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
    }

    // Pagination
    let totalPages = Math.ceil(filtered.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    let start = (currentPage - 1) * pageSize;
    let pagePosts = filtered.slice(start, start + pageSize);

    // Render HTML
    let body = document.getElementById('post-body');
    body.innerHTML = "";
    pagePosts.forEach(post => { body.innerHTML += convertDataToHTML(post); });
    
    renderPagination(totalPages);
}

function convertDataToHTML(post) {
    const isDel = post.isDeleted === true;
    const rowClass = isDel ? 'class="deleted-row"' : '';
    const imgUrl = post.image || 'https://via.placeholder.com/100';
    
    // Nút Sửa (Edit) - chỉ hiện khi chưa xoá
    const editBtn = !isDel ? 
        `<button class="btn btn-warning" onclick="editPost(${post.id})"><i class="fa-solid fa-pen"></i> Sửa</button>` : '';

    // Nút Xoá/Khôi phục
    const delBtnClass = isDel ? 'btn-restore' : 'btn-danger';
    const delText = isDel ? 'Khôi phục' : 'Xoá';
    const delIcon = isDel ? '<i class="fa-solid fa-trash-arrow-up"></i>' : '<i class="fa-solid fa-trash"></i>';

    return `<tr ${rowClass}>
        <td>#${post.id}</td>
        <td style="font-weight: 500;">${post.title}</td>
        <td>${post.views}</td>
        <td><img src="${imgUrl}" class="product-thumb" onerror="this.src='https://via.placeholder.com/100?text=Error'"></td>
        <td>
            <div class="action-buttons">
                ${editBtn}
                <button class="btn ${delBtnClass}" onclick="Delete(${post.id})">${delIcon} ${delText}</button>
            </div>
        </td>
    </tr>`;
}

// --- 4. CRUD ACTIONS ---
function saveData() {
    let id = document.getElementById("id_txt").value.trim();
    let title = document.getElementById("title_txt").value.trim();
    let views = document.getElementById('views_txt').value.trim();
    let image = document.getElementById('image_txt').value.trim();

    if (!title || !views) return alert("Vui lòng nhập Tiêu đề và Views");
    if (!image) image = 'https://via.placeholder.com/100?text=No+Image';

    const isNew = !id;
    if (isNew) id = String(maxPostId + 1);

    const url = 'http://localhost:3001/posts' + (isNew ? '' : '/' + id);
    const method = isNew ? 'POST' : 'PUT';

    let bodyData = { title: title, views: parseInt(views), image: image };
    
    if (isNew) {
        bodyData.id = id;
        bodyData.isDeleted = false;
    } else {
        // Giữ nguyên trạng thái isDeleted cũ
        let old = allPosts.find(p => p.id == id);
        bodyData.isDeleted = old ? old.isDeleted : false;
    }

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    }).then(res => {
        if (res.ok) {
            loadPosts();
            resetForm(); // Xoá trắng form sau khi lưu
        } else alert("Lỗi server");
    });
}

function editPost(id) {
    const post = allPosts.find(p => p.id == id);
    if (!post) return;

    // Đẩy dữ liệu lên form
    document.getElementById("id_txt").value = post.id;
    document.getElementById("title_txt").value = post.title;
    document.getElementById("views_txt").value = post.views;
    document.getElementById("image_txt").value = post.image || "";
    
    // Đổi màu ID để biết đang sửa
    document.getElementById("id_txt").style.backgroundColor = "#fff3cd"; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function Delete(id) {
    fetch('http://localhost:3001/posts/' + id).then(r => r.json()).then(post => {
        fetch('http://localhost:3001/posts/' + id, {
            method: "PATCH",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: !post.isDeleted })
        }).then(res => { if(res.ok) loadPosts(); });
    });
}

// --- 5. UTILS ---
function resetForm() {
    document.getElementById("id_txt").value = "";
    document.getElementById("title_txt").value = "";
    document.getElementById("views_txt").value = "";
    document.getElementById("image_txt").value = "";
    document.getElementById("id_txt").style.backgroundColor = "#e9ecef";
}

function onSearchChange() {
    searchQuery = document.getElementById('search_txt').value;
    currentPage = 1;
    displayPosts();
}

function sortBy(field, order) {
    sortField = field; sortOrder = order;
    displayPosts();
}

function renderPagination(totalPages) {
    let pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        let btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.classList.add('active');
        btn.onclick = () => { currentPage = i; displayPosts(); };
        pagination.appendChild(btn);
    }
}

// --- 6. COMMENTS ---
function LoadComments() {
    fetch('http://localhost:3001/comments').then(r => r.json()).then(comments => {
        let div = document.getElementById('comment-body');
        div.innerHTML = "";
        maxCommentId = comments.length > 0 ? Math.max(...comments.map(c => parseInt(c.id)||0), 0) : 0;
        comments.forEach(c => {
            const isDel = c.isDeleted;
            const cls = isDel ? 'comment-item deleted' : 'comment-item';
            const btn = isDel ? `<button class="btn btn-restore" onclick="DeleteComment(${c.id})"><i class="fa-solid fa-trash-arrow-up"></i></button>` 
                              : `<button class="btn btn-danger" onclick="DeleteComment(${c.id})"><i class="fa-solid fa-trash"></i></button>`;
            div.innerHTML += `<div class="${cls}"><div><strong>#${c.postId}</strong>: ${c.text}</div>${btn}</div>`;
        });
    });
}

function saveComment() {
    let text = document.getElementById("comment_txt").value;
    let pid = document.getElementById("post_id_txt").value;
    if (!text || !pid) return alert("Thiếu thông tin");
    fetch('http://localhost:3001/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(maxCommentId+1), text: text, postId: pid, isDeleted: false })
    }).then(res => { if(res.ok) { LoadComments(); document.getElementById("comment_txt").value = ""; } });
}

function DeleteComment(id) {
    fetch('http://localhost:3001/comments/' + id).then(r => r.json()).then(c => {
        fetch('http://localhost:3001/comments/' + id, {
            method: "PATCH",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ isDeleted: !c.isDeleted })
        }).then(res => { if(res.ok) LoadComments(); });
    });
}