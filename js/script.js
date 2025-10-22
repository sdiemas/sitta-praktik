// ============ Utilities ============
const $ = (s, c=document) => c.querySelector(s);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

// Toast only (tanpa alert OK)
function notify(msg, type = "info"){
  let box = document.querySelector(".toast-container");
  if(!box){
    box = document.createElement("div");
    box.className = "toast-container";
    document.body.appendChild(box);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(()=> t.remove(), 3800);
}

// ============ User store (merge default + local) ============
const DEFAULT_USERS = Array.isArray(window.dataPengguna) ? window.dataPengguna : [];
const LS_KEY_USERS = "users";

function getLocalUsers(){
  try { return JSON.parse(localStorage.getItem(LS_KEY_USERS) || "[]"); }
  catch { return []; }
}
function saveLocalUsers(arr){
  localStorage.setItem(LS_KEY_USERS, JSON.stringify(arr || []));
}
function getAllUsers(){
  // gabung default + lokal (tanpa duplikat email)
  const map = new Map();
  DEFAULT_USERS.forEach(u => map.set(u.email.toLowerCase(), u));
  getLocalUsers().forEach(u => map.set(u.email.toLowerCase(), u));
  return Array.from(map.values());
}

// ============ Proteksi Login (redirect halus) ============
(() => {
  const page = document.body.dataset.page;
  const userData = localStorage.getItem("currentUser");
  const protectedPages = ["dashboard","tracking","stok"];

  if (protectedPages.includes(page) && !userData) {
    sessionStorage.setItem("needLogin", "true");
    window.location.replace("index.html");
  }

  if (page === "login" && sessionStorage.getItem("needLogin") === "true") {
    notify("Silakan login terlebih dahulu!", "error");
    sessionStorage.removeItem("needLogin");
  }
})();

// ============ LOGIN & REGISTER ============
if (document.body.dataset.page === "login") {
  // ---- LOGIN ----
  const form = $("#loginForm");
  on(form, "submit", (e)=>{
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase();
    const pass  = $("#password").value.trim();
    const user = getAllUsers().find(u => u.email.toLowerCase() === email && u.password === pass);
    if (!user) return notify("Email/password yang anda masukkan salah", "error");
    localStorage.setItem("currentUser", JSON.stringify(user));
    notify(`Selamat datang, ${user.nama}!`, "success");
    setTimeout(()=> window.location.href = "dashboard.html", 500);
  });

  // ---- MODAL open/close ----
  document.querySelectorAll("[data-open]").forEach(b=> on(b,"click",()=> $("#"+b.dataset.open).showModal()));
  document.querySelectorAll("[data-close]").forEach(b=> on(b,"click",()=> $("#"+b.dataset.close).close()));

  on($("#sendReset"),"click",()=>{ 
    const e = $("#resetEmail").value.trim(); 
    if(!e) return notify("Masukkan email Anda.", "error");
    notify("Tautan reset dikirim (simulasi).", "info"); 
    $("#forgotModal").close();
  });

  // ---- REGISTER (nyata, simpan ke localStorage) ----
  const regBtn = $("#submitRegister");
  on(regBtn,"click",()=>{
    const name = $("#regName").value.trim();
    const email = $("#regEmail").value.trim().toLowerCase();
    const pass1 = $("#regPass").value;
    const pass2 = $("#regPass2").value;

    // validasi sederhana
    if(!name || !email || !pass1 || !pass2) return notify("Lengkapi semua field pendaftaran.", "error");
    if(!/^\S+@\S+\.\S+$/.test(email)) return notify("Format email tidak valid.", "error");
    if(pass1.length < 6) return notify("Password minimal 6 karakter.", "error");
    if(pass1 !== pass2) return notify("Konfirmasi password tidak sama.", "error");

    const exists = getAllUsers().some(u => u.email.toLowerCase() === email);
    if(exists) return notify("Email sudah terdaftar.", "error");

    const local = getLocalUsers();
    const newUser = {
      id: Date.now(),
      nama: name,
      email,
      password: pass1,
      role: "UPBJJ-UT",
      lokasi: "Pusat"
    };
    local.push(newUser);
    saveLocalUsers(local);

    // opsional: auto-login setelah daftar
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    $("#registerModal").close();
    notify("Pendaftaran berhasil. Anda sudah login.", "success");
    setTimeout(()=> window.location.href="dashboard.html", 600);
  });
}

// ============ NAVBAR (semua halaman) ============
(() => {
  const navToggle = $("#navToggle");
  const primaryMenu = $("#primaryMenu");
  const laporanItem = $("#laporanItem");
  const laporanToggle = $("#laporanToggle");

  if (navToggle && primaryMenu) {
    navToggle.addEventListener("click", () => {
      const opened = primaryMenu.classList.toggle("open");
      navToggle.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", opened ? "true" : "false");
    });
  }

  if (laporanToggle && laporanItem) {
    laporanToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const show = laporanItem.classList.toggle("show");
      laporanToggle.setAttribute("aria-expanded", show ? "true" : "false");
    });
  }

  document.addEventListener("click", (e) => {
    if (!primaryMenu || !navToggle) return;
    if (!primaryMenu.contains(e.target) && !navToggle.contains(e.target)) {
      primaryMenu.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded","false");
      if (laporanItem) laporanItem.classList.remove("show");
    }
  });

  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      notify("Anda telah logout.", "info");
      setTimeout(()=> window.location.href="index.html", 500);
    });
  }

  // Tandai menu aktif otomatis berdasarkan path
  const path = location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".nav-link[href]");
  links.forEach(a => {
    const href = a.getAttribute("href");
    if (href && path === href) a.classList.add("active");
  });
})();

// ============ DASHBOARD ============
if (document.body.dataset.page === "dashboard") {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  const greetingText = $("#greetingText");
  const timeBadge = $("#timeBadge");

  const setGreeting = () => {
    const now = new Date(); const h = now.getHours();
    let greet = "Selamat Malam";
    if (h >= 5 && h < 11) greet = "Selamat Pagi";
    else if (h >= 11 && h < 15) greet = "Selamat Siang";
    else if (h >= 15 && h < 18) greet = "Selamat Sore";
    greetingText.textContent = user ? `${greet}, ${user.nama}` : greet; // tanpa emoji
    timeBadge.textContent = now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
  };
  setGreeting();
}

// ============ TRACKING ============
if (document.body.dataset.page === "tracking") {
  const input = $("#doInput");
  const btn   = $("#doSearch");
  const card  = $("#doResult");
  card.style.display = "none"; // sembunyikan dari awal

  const el = {
    nomor: $("#resNomor"), nama: $("#resNama"), status: $("#resStatus"), bar: $("#resBar"),
    ekspedisi: $("#resEkspedisi"), tanggal: $("#resTanggal"), paket: $("#resPaket"),
    total: $("#resTotal"), timeline: $("#resTimeline")
  };

  const statusToMeta = (status)=>{
    const s=(status||"").toLowerCase();
    if (s.includes("selesai")) return {cls:"done",pct:100,label:"Selesai"};
    if (s.includes("dalam"))   return {cls:"inroute",pct:60,label:"Dalam Perjalanan"};
    if (s.includes("dikirim")) return {cls:"shipped",pct:40,label:"Dikirim"};
    if (s.includes("proses"))  return {cls:"pending",pct:25,label:"Proses"};
    if (s.includes("gagal"))   return {cls:"failed",pct:100,label:"Gagal"};
    return {cls:"pending",pct:10,label:status||"Tidak diketahui"};
  };
  const fmt = (iso)=>!iso?"-":new Date(iso).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});

  function render(item){
    card.style.display = "block";
    el.nomor.textContent = `Nomor DO: ${item.nomorDO}`;
    el.nama.textContent  = item.nama;
    const m = statusToMeta(item.status);
    el.status.className = "badge " + m.cls; el.status.textContent = m.label;
    el.bar.style.width = m.pct + "%";
    el.ekspedisi.textContent = item.ekspedisi || "-";
    el.tanggal.textContent   = fmt(item.tanggalKirim);
    el.paket.textContent     = item.paket || "-";
    el.total.textContent     = item.total || "-";

    el.timeline.innerHTML = "";
    (item.perjalanan||[]).forEach(p=>{
      const li=document.createElement("li");
      li.innerHTML=`<span class="time">${p.waktu}</span><span class="ket">${p.keterangan}</span>`;
      el.timeline.appendChild(li);
    });
  }

  function lookup(){
    const key = (input.value||"").trim();
    if(!key){
      notify("Masukkan nomor DO terlebih dahulu.", "error");
      card.style.display = "none";
      return;
    }
    const item = (window.dataTracking||{})[key];
    if(!item){
      notify("Nomor DO tidak ditemukan.", "error");
      card.style.display = "none";
      return;
    }
    render(item);
    notify("Data DO ditemukan.", "success");
  }

  on(btn,"click",lookup);
  on(input,"keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); lookup(); }});
  if (input) input.value="";
}

// ============ STOK ============
if (document.body.dataset.page === "stok") {
  const tbody = $("#stok-body");
  const form  = $("#stok-form");
  const q     = $("#stok-q");
  const fileInput = $("#stok-inCoverFile");

  let stokData = Array.isArray(window.dataBahanAjar) ? [...window.dataBahanAjar] : [];

  function rowHTML(row){
    const img = row.cover ? `<img class="stok-thumb" src="${row.cover}" alt="${row.namaBarang||''}">` : "";
    return `<td>${img}</td><td>${row.kodeLokasi}</td><td>${row.kodeBarang}</td><td>${row.namaBarang}</td><td>${row.jenisBarang}</td><td>${row.edisi}</td><td>${row.stok}</td>`;
  }
  function render(list = stokData){
    tbody.innerHTML=""; list.forEach(r=>{ const tr=document.createElement("tr"); tr.innerHTML=rowHTML(r); tbody.appendChild(tr); });
  }
  render();

  on(q,"input",()=>{
    const t=q.value.trim().toLowerCase();
    const f=stokData.filter(x =>
      x.namaBarang.toLowerCase().includes(t) ||
      x.kodeBarang.toLowerCase().includes(t) ||
      x.kodeLokasi.toLowerCase().includes(t) ||
      x.jenisBarang.toLowerCase().includes(t)
    );
    render(f);
  });

  on(form,"submit",(e)=>{
    e.preventDefault();
    const kodeLokasi=$("#stok-inLokasi").value.trim();
    const kodeBarang=$("#stok-inKode").value.trim();
    const namaBarang=$("#stok-inNama").value.trim();
    const jenisBarang=$("#stok-inJenis").value.trim();
    const edisiStr=$("#stok-inEdisi").value.trim();
    const stokStr=$("#stok-inStok").value.trim();
    const file=fileInput.files[0]||null;

    const edisi=Number(edisiStr), stok=Number(stokStr);
    if(!kodeLokasi||!kodeBarang||!namaBarang||!jenisBarang||!edisiStr||!stokStr) return notify("Lengkapi semua field wajib.", "error");
    if(!Number.isFinite(edisi)||edisi<1) return notify("Edisi harus angka valid ≥ 1.", "error");
    if(!Number.isFinite(stok)||stok<0)   return notify("Stok harus angka valid ≥ 0.", "error");
    if(stokData.some(x=>x.kodeBarang.toLowerCase()===kodeBarang.toLowerCase())) return notify("Kode barang sudah ada.", "error");

    let cover=""; 
    if(file){ cover=URL.createObjectURL(file); }
    const baru={kodeLokasi,kodeBarang,namaBarang,jenisBarang,edisi:String(edisi),stok,cover};
    stokData.push(baru); 
    if(Array.isArray(window.dataBahanAjar)) window.dataBahanAjar.push(baru);

    if(q.value.trim()) q.dispatchEvent(new Event("input")); else render();
    form.reset(); 
    notify("Baris stok berhasil ditambahkan.", "success");
  });

  // LIGHTBOX PREVIEW cepat (no delay)
  const lb=$("#lb"), lbImg=$("#lbImg"), lbClose=$("#lbClose");

  on(tbody,"click",(e)=>{
    const t=e.target.closest("img.stok-thumb");
    if(!t) return;
    lbImg.src = t.src;
    lb.classList.add("open"); // tampil instan
  });

  on(lbClose,"click",()=>{
    lb.classList.remove("open");
    if (lbImg.src.startsWith("blob:")) {
      try { URL.revokeObjectURL(lbImg.src); } catch(_) {}
    }
    lbImg.src = "";
  });

  on(lb,"click",(e)=>{
    if (e.target === lb) lbClose.click(); // klik backdrop → tutup
  });
}
