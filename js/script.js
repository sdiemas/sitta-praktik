/* ========== HELPER FUNCTIONS ========== */
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => context.querySelectorAll(selector);
const on = (element, event, handler) => {
  if (element) {
    element.addEventListener(event, handler);
  }
};

/* ========== PROTEKSI LOGIN ========== */
(() => {
  const currentPage = document.body.dataset.page;
  const protectedPages = ["dashboard", "tracking", "stok"];
  
  if (protectedPages.includes(currentPage) && !localStorage.getItem("currentUser")) {
    sessionStorage.setItem("needLogin", "true");
    window.location.replace("index.html");
  }
})();

/* ========== NAVBAR FUNCTIONALITY ========== */
(() => {
  const toggleBtn = $("#navToggle");
  const menu = $("#primaryMenu");
  const laporanItem = $("#laporanItem");
  const laporanToggle = $("#laporanToggle");
  
  on(toggleBtn, "click", () => {
    const isOpen = menu.classList.toggle("open");
    toggleBtn.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  
  on(laporanToggle, "click", (e) => {
    e.preventDefault();
    laporanItem.classList.toggle("show");
  });
  
  document.addEventListener("click", (e) => {
    if (menu && toggleBtn && !menu.contains(e.target) && !toggleBtn.contains(e.target)) {
      menu.classList.remove("open");
      toggleBtn.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
    
    if (laporanItem && !laporanItem.contains(e.target)) {
      laporanItem.classList.remove("show");
    }
  });
  
  const logoutBtn = $("#logoutBtn");
  on(logoutBtn, "click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
  
  const currentPath = location.pathname.split("/").pop() || "index.html";
  $$(".nav-link[href]").forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
})();

/* ========== LOGIN PAGE ========== */
if (document.body.dataset.page === "login") {
  const noticePanel = $("#loginNotice");
  
  if (sessionStorage.getItem("needLogin") === "true") {
    if (noticePanel) {
      noticePanel.textContent = "Anda harus login terlebih dahulu.";
      noticePanel.classList.remove("hidden");
    }
    sessionStorage.removeItem("needLogin");
  }
  
  $$("[data-open]").forEach(btn => {
    on(btn, "click", () => {
      const modalId = btn.dataset.open;
      const modal = $("#" + modalId);
      if (modal) modal.showModal();
    });
  });
  
  $$("[data-close]").forEach(btn => {
    on(btn, "click", () => {
      const modalId = btn.dataset.close;
      const modal = $("#" + modalId);
      if (modal) modal.close();
    });
  });
  
  const loginForm = $("#loginForm");
  const loginMsg = $("#loginMsg");
  
  on(loginForm, "submit", (e) => {
    e.preventDefault();
    if (loginMsg) loginMsg.classList.add("hidden");
    
    const emailEl = $("#email");
    const passwordEl = $("#password");
    
    if (!emailEl || !passwordEl) return;
    
    const email = emailEl.value.trim().toLowerCase();
    const password = passwordEl.value.trim();
    
    const users = (Array.isArray(window.dataPengguna) ? window.dataPengguna : [])
      .concat(JSON.parse(localStorage.getItem("users") || "[]"));
    
    const user = users.find(u => 
      u.email.toLowerCase() === email && u.password === password
    );
    
    if (!user) {
      if (loginMsg) {
        loginMsg.textContent = "Email atau password salah.";
        loginMsg.classList.remove("hidden");
      }
      return;
    }
    
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location.href = "dashboard.html";
  });
}

/* ========== DASHBOARD PAGE ========== */
if (document.body.dataset.page === "dashboard") {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const greetingText = $("#greetingText");
  
  const updateGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Selamat Malam";
    
    if (hour >= 5 && hour < 11) {
      greeting = "Selamat Pagi";
    } else if (hour >= 11 && hour < 15) {
      greeting = "Selamat Siang";
    } else if (hour >= 15 && hour < 18) {
      greeting = "Selamat Sore";
    }
    
    if (greetingText) {
      greetingText.textContent = currentUser 
        ? `${greeting}, ${currentUser.nama}` 
        : greeting;
    }
  };
  
  updateGreeting();
}

/* ========== TRACKING PAGE ========== */
if (document.body.dataset.page === "tracking") {
  const input = $("#doInput");
  const searchBtn = $("#doSearch");
  const resultCard = $("#doResult");
  const messagePanel = $("#doMsg");
  
  const getStatusMeta = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    if (statusLower.includes("selesai")) {
      return { percent: 100, label: "Selesai" };
    }
    if (statusLower.includes("dalam")) {
      return { percent: 70, label: "Dalam Perjalanan" };
    }
    if (statusLower.includes("dikirim")) {
      return { percent: 40, label: "Dikirim" };
    }
    if (statusLower.includes("proses")) {
      return { percent: 25, label: "Proses" };
    }
    if (statusLower.includes("gagal")) {
      return { percent: 100, label: "Gagal" };
    }
    
    return { percent: 10, label: status || "Tidak diketahui" };
  };
  
  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    return new Date(isoDate).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };
  
  const showNotFound = () => {
    if (!resultCard) return;
    
    // Tampilkan card hasil dengan konten "tidak ditemukan"
    resultCard.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📦</div>
        <div style="font-size: 22px; font-weight: 600; color: #374151; margin-bottom: 12px;">
          Data Tidak Ditemukan
        </div>
        <div style="font-size: 15px; color: #6b7280; line-height: 1.6;">
          Nomor DO yang Anda cari tidak ditemukan dalam sistem.<br>
          Pastikan Anda memasukkan nomor yang benar.
        </div>
      </div>
    `;
    resultCard.style.display = "block";
  };
  
  const renderResult = (data) => {
    if (!resultCard) return;
    
    if (messagePanel) messagePanel.classList.add("hidden");
    
    // Render struktur lengkap hasil tracking
    resultCard.innerHTML = `
      <div class="result-head">
        <div>
          <h3 id="resNomor"></h3>
          <div class="muted">Nama: <span id="resNama"></span></div>
        </div>
        <span id="resStatus" class="badge">Status</span>
      </div>

      <div class="progress"><div id="resBar" class="bar"></div></div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">Ekspedisi</span>
          <span id="resEkspedisi" class="value"></span>
        </div>
        <div class="detail-item">
          <span class="label">Tanggal Kirim</span>
          <span id="resTanggal" class="value"></span>
        </div>
        <div class="detail-item">
          <span class="label">Jenis Paket</span>
          <span id="resPaket" class="value"></span>
        </div>
        <div class="detail-item">
          <span class="label">Total</span>
          <span id="resTotal" class="value"></span>
        </div>
      </div>

      <div class="timeline">
        <h4>Perjalanan</h4>
        <ul id="resTimeline"></ul>
      </div>
    `;
    
    resultCard.style.display = "block";
    
    // Isi data ke element yang baru dibuat
    const resNomor = $("#resNomor");
    const resNama = $("#resNama");
    const resStatus = $("#resStatus");
    const resBar = $("#resBar");
    const resEkspedisi = $("#resEkspedisi");
    const resTanggal = $("#resTanggal");
    const resPaket = $("#resPaket");
    const resTotal = $("#resTotal");
    const resTimeline = $("#resTimeline");
    
    if (resNomor) resNomor.textContent = `Nomor DO: ${data.nomorDO}`;
    if (resNama) resNama.textContent = data.nama;
    
    const statusMeta = getStatusMeta(data.status);
    if (resStatus) resStatus.textContent = statusMeta.label;
    if (resBar) {
      setTimeout(() => {
        resBar.style.width = statusMeta.percent + "%";
      }, 100);
    }
    
    if (resEkspedisi) resEkspedisi.textContent = data.ekspedisi || "-";
    if (resTanggal) resTanggal.textContent = formatDate(data.tanggalKirim);
    if (resPaket) resPaket.textContent = data.paket || "-";
    if (resTotal) resTotal.textContent = data.total || "-";
    
    if (resTimeline) {
      resTimeline.innerHTML = "";
      (data.perjalanan || []).forEach(item => {
        const li = document.createElement("li");
        const timeSpan = document.createElement("span");
        timeSpan.className = "time";
        timeSpan.textContent = item.waktu;
        
        const ketSpan = document.createElement("span");
        ketSpan.className = "ket";
        ketSpan.textContent = item.keterangan;
        
        li.appendChild(timeSpan);
        li.appendChild(ketSpan);
        resTimeline.appendChild(li);
      });
    }
  };
  
  const searchTracking = () => {
    if (!input) return;
    
    const searchKey = input.value.trim();
    
    if (!searchKey) {
      if (messagePanel) {
        messagePanel.textContent = "Masukkan nomor DO terlebih dahulu.";
        messagePanel.className = "panel error";
        messagePanel.classList.remove("hidden");
      }
      if (resultCard) resultCard.style.display = "none";
      return;
    }
    
    // Hide message panel saat search
    if (messagePanel) messagePanel.classList.add("hidden");
    
    const trackingData = (window.dataTracking || {})[searchKey];
    
    if (!trackingData) {
      showNotFound();
      return;
    }
    
    renderResult(trackingData);
  };
  
  on(searchBtn, "click", searchTracking);
  
  on(input, "keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchTracking();
    }
  });
  
  // Hide result card pada load awal
  if (resultCard) {
    resultCard.style.display = "none";
  }
}

/* ========== STOK PAGE ========== */
if (document.body.dataset.page === "stok") {
  const tbody = $("#stok-body");
  const form = $("#stok-form");
  const searchInput = $("#stok-q");
  const messagePanel = $("#stokMsg");
  const coverFileInput = $("#stok-inCoverFile");
  const modal = $("#modalTambahStok");
  const btnTambah = $("#btnTambahStok");
  const btnClose = $("#closeModalStok");
  const btnBatal = $("#btnBatalStok");
  
  let stokData = Array.isArray(window.dataBahanAjar) 
    ? [...window.dataBahanAjar] 
    : [];
  
  // Open Modal
  if (btnTambah) {
    btnTambah.addEventListener("click", () => {
      if (modal) {
        modal.showModal();
        if (form) form.reset();
        if (messagePanel) messagePanel.classList.add("hidden");
      }
    });
  }
  
  // Close Modal Function
  const closeModal = () => {
    if (modal) {
      modal.close();
      if (form) form.reset();
      if (messagePanel) messagePanel.classList.add("hidden");
    }
  };
  
  // Event listeners untuk close
  if (btnClose) {
    btnClose.addEventListener("click", closeModal);
  }
  
  if (btnBatal) {
    btnBatal.addEventListener("click", closeModal);
  }
  
  // Close modal saat click backdrop
  if (modal) {
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        closeModal();
      }
    });
  }
  
  // Fungsi create row dengan DOM
  const createTableRow = (item) => {
    const tr = document.createElement("tr");
    
    // Cell Cover
    const tdCover = document.createElement("td");
    if (item.cover) {
      const img = document.createElement("img");
      img.className = "stok-thumb";
      img.src = item.cover;
      img.alt = item.namaBarang || "";
      img.onclick = () => {
        if (window.openLightbox) {
          window.openLightbox(item.cover);
        }
      };
      tdCover.appendChild(img);
    }
    tr.appendChild(tdCover);
    
    // Cell Kode Lokasi
    const tdLokasi = document.createElement("td");
    tdLokasi.textContent = item.kodeLokasi;
    tr.appendChild(tdLokasi);
    
    // Cell Kode Barang
    const tdKode = document.createElement("td");
    tdKode.textContent = item.kodeBarang;
    tr.appendChild(tdKode);
    
    // Cell Nama Barang
    const tdNama = document.createElement("td");
    tdNama.textContent = item.namaBarang;
    tr.appendChild(tdNama);
    
    // Cell Jenis
    const tdJenis = document.createElement("td");
    tdJenis.textContent = item.jenisBarang;
    tr.appendChild(tdJenis);
    
    // Cell Edisi
    const tdEdisi = document.createElement("td");
    tdEdisi.textContent = item.edisi;
    tr.appendChild(tdEdisi);
    
    // Cell Stok
    const tdStok = document.createElement("td");
    const strongStok = document.createElement("strong");
    strongStok.textContent = item.stok;
    tdStok.appendChild(strongStok);
    tr.appendChild(tdStok);
    
    return tr;
  };
  
  const renderTable = (dataList) => {
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    // JIKA DATA KOSONG - TAMPILKAN NOTIFIKASI
    if (!dataList || dataList.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.style.textAlign = "center";
      td.style.padding = "60px 20px";
      td.style.background = "linear-gradient(135deg, #f9fafb 0%, #eff6ff 100%)";
      
      const icon = document.createElement("div");
      icon.style.fontSize = "48px";
      icon.style.marginBottom = "16px";
      icon.textContent = "📦";
      
      const title = document.createElement("div");
      title.style.fontSize = "18px";
      title.style.fontWeight = "600";
      title.style.color = "#374151";
      title.style.marginBottom = "8px";
      title.textContent = "Stok Tidak Ditemukan";
      
      const subtitle = document.createElement("div");
      subtitle.style.fontSize = "14px";
      subtitle.style.color = "#6b7280";
      subtitle.textContent = "Tidak ada data yang sesuai dengan pencarian Anda";
      
      td.appendChild(icon);
      td.appendChild(title);
      td.appendChild(subtitle);
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    
    // RENDER DATA NORMAL dengan DOM
    dataList.forEach(item => {
      const row = createTableRow(item);
      tbody.appendChild(row);
    });
  };
  
  renderTable(stokData);
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.trim().toLowerCase();
      
      if (searchTerm === "") {
        renderTable(stokData);
        return;
      }
      
      const filteredData = stokData.filter(item => {
        return item.namaBarang.toLowerCase().includes(searchTerm) ||
               item.kodeBarang.toLowerCase().includes(searchTerm) ||
               item.kodeLokasi.toLowerCase().includes(searchTerm) ||
               item.jenisBarang.toLowerCase().includes(searchTerm);
      });
      
      renderTable(filteredData);
    });
  }
  
  // Form Submit dengan validasi
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (messagePanel) messagePanel.classList.add("hidden");
      
      const getValue = (id) => {
        const el = document.querySelector(id);
        return el ? el.value.trim() : "";
      };
      
      const kodeLokasi = getValue("#stok-inLokasi");
      const kodeBarang = getValue("#stok-inKode");
      const namaBarang = getValue("#stok-inNama");
      const jenisBarang = getValue("#stok-inJenis");
      const edisiStr = getValue("#stok-inEdisi");
      const stokStr = getValue("#stok-inStok");
      
      const edisi = Number(edisiStr);
      const stok = Number(stokStr);
      
      if (!kodeLokasi || !kodeBarang || !namaBarang || !jenisBarang || !edisiStr || !stokStr) {
        if (messagePanel) {
          messagePanel.textContent = "Lengkapi semua field.";
          messagePanel.className = "panel error";
          messagePanel.classList.remove("hidden");
        }
        return;
      }
      
      if (!Number.isFinite(edisi) || edisi < 1) {
        if (messagePanel) {
          messagePanel.textContent = "Edisi harus angka valid ≥ 1.";
          messagePanel.className = "panel error";
          messagePanel.classList.remove("hidden");
        }
        return;
      }
      
      if (!Number.isFinite(stok) || stok < 0) {
        if (messagePanel) {
          messagePanel.textContent = "Stok harus angka valid ≥ 0.";
          messagePanel.className = "panel error";
          messagePanel.classList.remove("hidden");
        }
        return;
      }
      
      if (stokData.some(item => item.kodeBarang.toLowerCase() === kodeBarang.toLowerCase())) {
        if (messagePanel) {
          messagePanel.textContent = "Kode barang sudah ada.";
          messagePanel.className = "panel error";
          messagePanel.classList.remove("hidden");
        }
        return;
      }
      
      let coverUrl = "";
      if (coverFileInput && coverFileInput.files[0]) {
        coverUrl = URL.createObjectURL(coverFileInput.files[0]);
      }
      
      const newItem = {
        kodeLokasi: kodeLokasi,
        kodeBarang: kodeBarang,
        namaBarang: namaBarang,
        jenisBarang: jenisBarang,
        edisi: String(edisi),
        stok: stok,
        cover: coverUrl
      };
      
      stokData.unshift(newItem);
      if (window.dataBahanAjar) {
        window.dataBahanAjar.unshift(newItem);
      }
      
      renderTable(stokData);
      
      if (form) form.reset();
      if (searchInput) searchInput.value = "";
      
      closeModal();
      
      alert("✅ Stok berhasil ditambahkan!");
    });
  }
  
  // LIGHTBOX FUNCTIONALITY
  const lightbox = $("#lb");
  const lightboxImg = $("#lbImg");
  const lightboxClose = $("#lbClose");
  
  window.openLightbox = (src) => {
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  };
  
  if (lightboxClose) {
    lightboxClose.addEventListener("click", () => {
      if (lightbox) {
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
        
        if (lightboxImg && lightboxImg.src.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(lightboxImg.src);
          } catch (error) {
            // Ignore
          }
        }
        
        if (lightboxImg) lightboxImg.src = "";
      }
    });
  }
  
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox && lightboxClose) {
        lightboxClose.click();
      }
    });
  }
  
  // Close dengan ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lightbox && lightbox.classList.contains("open") && lightboxClose) {
        lightboxClose.click();
      }
      if (modal && modal.open) {
        closeModal();
      }
    }
  });
}

console.log('✅ SITTA App initialized successfully');