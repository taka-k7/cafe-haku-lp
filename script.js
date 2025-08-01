let selectedDate = "";
let selectedTime = "";
let availability = {};


const GAS_URL = "https://script.google.com/macros/s/AKfycbzPiKlEsx23B0EflgOiD57TrFf3zID-zjVt8OC-JnOF9THlaEtOCSi6ADIcw-Y8F8BW/exec";
const GOOGLE_FORM_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSc8Af38W71sj-llPYZjfSUNAD7t9c7YFrC8JMnSa9sllhDf5g/formResponse";

function initLazyMapLoader() {
  const mapPlaceholder = document.getElementById("map-placeholder");
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        obs.unobserve(mapPlaceholder);

        const iframe = document.createElement("iframe");
        iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3267.8997575040985!2d135.759837776625!3d35.00921437281163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6001088fe4e0ddc7%3A0x8c8ffcd119edb92f!2z5Lqs6YO95paH5YyW5Y2a54mp6aSo!5e0!3m2!1sja!2sjp!4v1754016738421!5m2!1sja!2sjp";
        iframe.width = "100%";
        iframe.height = "300";
        iframe.style.border = "0";
        iframe.loading = "lazy";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "no-referrer-when-downgrade";

        mapPlaceholder.innerHTML = "";
        mapPlaceholder.appendChild(iframe);
      }
    });
  });

  observer.observe(mapPlaceholder);
}

document.addEventListener("DOMContentLoaded", () => {
  initLazyMapLoader();
});

// ▼ 先に openModal を定義
function openModal() {
  document.getElementById("calendar-modal").style.display = "flex";
  console.log("モーダル開いたよ");
  fetchReservationStatus(true); // 再取得時はローディング表示あり
}

// ▼ その後に DOMContentLoaded イベント内で使う
document.addEventListener("DOMContentLoaded", () => {
  const reservationBtn = document.getElementById("reservation-btn");
  const submitBtn = document.getElementById("submit-btn");

  fetchReservationStatus(false); // 初期読み込みでは loading 表示なし

  reservationBtn.addEventListener("click", openModal);
  submitBtn.addEventListener("click", handleReservationSubmit);

  document.getElementById("modal-close").addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("calendar-modal")) {
      closeModal();
    }
  });
});

function fetchReservationStatus(showLoading = true) {
  if (showLoading) {
    document.getElementById("loading").style.display = "block";
  }

  fetch(GAS_URL)
    .then(res => res.json())
    .then(data => {
      availability = data;
      console.log("✅ 予約状況取得完了", availability);
      renderCalendar();
    })
    .catch(error => {
      console.error("❌ 予約状況取得失敗", error);
    })
    .finally(() => {
      document.getElementById("loading").style.display = "none";
    });
}

function renderCalendar() {
  const calendar = document.getElementById("calendar");
	calendar.innerHTML = "";

	document.getElementById("loading").style.display = "none";
			

  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}/${mm}/${dd}`;
    const dayOfWeek = days[date.getDay()];
    const label = `${dateStr}（${dayOfWeek}）`;
    const status = availability[dateStr] ? getOverallStatus(availability[dateStr]) : "◎";

    const button = document.createElement("button");
    button.textContent = `${label} ${status}`;
    button.classList.add("calendar-btn");
    button.addEventListener("click", () => handleDateSelect(dateStr, button));

    calendar.appendChild(button);
  }
}

function getOverallStatus(statuses) {
  // 日付ごとの時間帯ステータスのうち、一番厳しいものを採用
  return Object.values(statuses).includes("×") ? "×"
       : Object.values(statuses).includes("△") ? "△"
       : "◎";
}

function handleDateSelect(dateStr, button) {
  selectedDate = dateStr;

  document.querySelectorAll(".calendar-btn").forEach(btn => {
    btn.classList.remove("selected-date");
  });
  button.classList.add("selected-date");

  document.getElementById("time-options").style.display = "block";

  const timeButtons = document.getElementById("time-buttons");
  timeButtons.innerHTML = "";
  const times = ["14:00〜", "15:00〜", "16:00〜", "17:00〜"];

  times.forEach(time => {
    const timeBtn = document.createElement("button");
    timeBtn.textContent = time;
    timeBtn.classList.add("time-btn");

    timeBtn.addEventListener("click", () => {
      selectedTime = time;
      document.querySelectorAll(".time-btn").forEach(btn => {
        btn.classList.remove("selected-time");
      });
      timeBtn.classList.add("selected-time");
      document.getElementById("user-info").style.display = "block";
    });

    timeButtons.appendChild(timeBtn);
  });
}

function handleReservationSubmit() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const guests = document.getElementById("guests").value;
  const duration = document.getElementById("duration").value;

  // ▼ バリデーションチェック
  if (!selectedDate) {
    alert("日付を選択してください。");
    return;
  }
  if (!selectedTime) {
    alert("時間を選択してください。");
    return;
  }
  if (!name) {
    alert("お名前を入力してください。");
    return;
  }
  if (!email || !email.includes("@")) {
    alert("正しいメールアドレスを入力してください。");
    return;
  }
  if (!guests || guests === "0") {
    alert("人数を選択してください。");
    return;
  }
  if (!duration || duration === "0") {
    alert("滞在時間を選択してください。");
    return;
  }

  // ▼ 以下、バリデーション通過後の送信処理
  const formData = new FormData();
  formData.append("entry.102184869", selectedTime);
  formData.append("entry.1634128870", selectedDate);
  formData.append("entry.487337058", name);
  formData.append("entry.1732855082", email);
  formData.append("entry.1798283938", guests);
  formData.append("entry.2123602417", duration);
	
	for (let pair of formData.entries()) {
  console.log(`${pair[0]}: ${pair[1]}`);
	}
	
document.getElementById("submit-loading").style.display = "block";

fetch(GOOGLE_FORM_URL, {
  method: "POST",
  mode: "no-cors",
  body: formData
})
.then(() => {
  // 表示だけちょっと遅延させる（ユーザーが気づく程度）
  setTimeout(() => {
    fetchReservationStatus();
    closeModal();
    alert("ご予約が完了しました。入力されたメールアドレスに確認メールをお送りしております。");
  }, 300); // 300〜500ms くらいがバランスいい
})
.catch(error => {
  console.error("送信失敗", error);
  alert("送信に失敗しました。もう一度お試しください。");
})
.finally(() => {
  // 確実にローディング非表示
  setTimeout(() => {
    document.getElementById("submit-loading").style.display = "none";
  }, 500); // ちょい遅めにすることで UX 安定
});
}

// ✅ 外に出す！ここから下が独立した関数
function closeModal() {
  document.getElementById("calendar-modal").style.display = "none";

  // リセット処理
  document.querySelectorAll(".calendar-btn").forEach(btn => btn.classList.remove("selected-date"));
  document.querySelectorAll(".time-btn").forEach(btn => btn.classList.remove("selected-time"));
  document.getElementById("time-options").style.display = "none";
  document.getElementById("user-info").style.display = "none";
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("guests").selectedIndex = 0;
  document.getElementById("duration").selectedIndex = 0;
  selectedDate = "";
  selectedTime = "";
}

// ▼ ハンバーガーメニュー切り替え用関数
function toggleMenu() {
  const nav = document.querySelector(".header-nav");
  nav.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }
});

