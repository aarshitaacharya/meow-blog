try{const e=JSON.parse(localStorage.getItem("meowlog.cfg")||"{}");e&&e.token&&document.querySelectorAll("[data-admin-link]").forEach(t=>t.classList.remove("hidden"))}catch{}
