/* ============ CONFIG: ubah maklumat di sini ============ */
const CONFIG = {
  whatsapp: "601114987898",          // nombor WhatsApp, format 60xxxxxxxxx (tanpa + atau -)
  instagram:"vilakita_casahill",
  address:  "Casa Hill, 28400 Mentakab, Pahang",   // alamat yang dipaparkan
  lat: 3.48475, lng: 102.33874,     // koordinat dari pin Waze
  waze:     "https://waze.com/ul/hw28gbf2u1",
  maxAdults: 20, maxKids: 10,       // pilihan dalam borang tempah, tukar ikut kapasiti sebenar
  ADS_CONVERSION: ""                // contoh: "AW-123456789/AbCdEfGhIj" (dari Google Ads)
};
/* ======================================================= */

/* teks ikut bahasa halaman (<html lang="ms"> atau <html lang="en">) */
const LANG = {
  ms: { loc:"ms-MY", wd:["Isn","Sel","Rab","Kha","Jum","Sab","Ahd"],
    msg:"Hai, saya ingin bertanya tentang tarikh kosong dan harga Vila Kita.",
    pick:"Pilih tarikh", pickIn:"Pilih tarikh check-in", pickOut:"Pilih tarikh check-out", nights: n=> n + " malam",
    note:"Pilih tarikh dan kami akan membalas melalui WhatsApp.",
    coOnly:"Check-out sahaja", full:"Penuh", loading:"Memuatkan tarikh…", err:"Tarikh akan disahkan melalui WhatsApp.",
    waHead:"Hai, saya ingin menyemak tarikh kosong di Vila Kita:", guests:"Tetamu", adults: n=> n + " dewasa", kids: n=> n + " kanak-kanak",
    price:"Boleh maklumkan harga?",
    wkThis:"Hujung minggu ini masih kosong", wkNext:"Hujung minggu depan masih kosong", wkSoon:"Hujung minggu kosong terdekat" },
  en: { loc:"en-GB", wd:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    msg:"Hi, I would like to ask about available dates and rates at Vila Kita.",
    pick:"Select date", pickIn:"Select check-in date", pickOut:"Select check-out date", nights: n=> n + (n === 1 ? " night" : " nights"),
    note:"Choose your dates and we will reply via WhatsApp.",
    coOnly:"Check-out only", full:"Booked", loading:"Loading dates…", err:"Dates will be confirmed via WhatsApp.",
    waHead:"Hi, I would like to check availability at Vila Kita:", guests:"Guests", adults: n=> n + (n == 1 ? " adult" : " adults"), kids: n=> n + (n == 1 ? " child" : " children"),
    price:"Could you let me know the rate?",
    wkThis:"This weekend is available", wkNext:"Next weekend is available", wkSoon:"Next available weekend" }
};
const T = LANG[document.documentElement.lang] || LANG.ms;

const waLink = msg => "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
const trackWa = ()=>{ if (CONFIG.ADS_CONVERSION && typeof gtag === "function") gtag("event","conversion",{send_to:CONFIG.ADS_CONVERSION}); };
document.querySelectorAll(".wa-link").forEach(a=>{
  a.href = waLink(T.msg); a.target = "_blank"; a.rel = "noopener";
  a.addEventListener("click", trackWa);
});

/* borang tempah */
const book = document.getElementById("tempah"), fin = document.getElementById("f-in"), fout = document.getElementById("f-out"),
      fad = document.getElementById("f-ad"), fkid = document.getElementById("f-kid"), note = document.getElementById("booknote");
for (let n = 1; n <= CONFIG.maxAdults; n++) fad.add(new Option(n, n, n===2, n===2));
for (let n = 0; n <= CONFIG.maxKids; n++) fkid.add(new Option(n, n));
const iso = d => new Date(d.getTime() - d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const day = s => new Date(s + "T00:00");
const plus1 = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const fmt = (s,o) => day(s).toLocaleDateString(T.loc, o);
let ci = "", co = "";                      // tarikh check-in / check-out terpilih (YYYY-MM-DD)
const nights = () => Math.round((day(co) - day(ci)) / 864e5);
const syncBook = ()=>{
  const o = {weekday:"short", day:"numeric", month:"short"};
  [[fin,ci],[fout,co]].forEach(([b,v])=>{ b.textContent = v ? fmt(v,o) : T.pick; b.classList.toggle("ph", !v); });
  calMsg.textContent = !ci ? T.pickIn : !co ? T.pickOut
    : T.nights(nights()) + " · " + fmt(ci,o) + " → " + fmt(co,o);
  note.textContent = ci && co ? calMsg.textContent : T.note;
};

/* kalender: malam penuh datang dari /api/availability (iCal Google Calendar / Airbnb) */
const cal = document.getElementById("cal"), calBox = cal.querySelector(".cal-box"), calMonths = document.getElementById("cal-months"),
      calMsg = document.getElementById("cal-msg"), calSt = document.getElementById("cal-st"), calNav = cal.querySelectorAll(".cal-nav");
const MAX_MONTHS = 12;
let booked = new Set(), vm = new Date();
vm.setDate(1);
const today = () => iso(new Date());
const nextBooked = s => { for (let d = plus1(day(s)), k = 0; k < 400; k++, d = plus1(d)) if (booked.has(iso(d))) return iso(d); return "9999"; };
const renderCal = ()=>{
  const t = today(), lim = ci && !co ? nextBooked(ci) : "", now = new Date(), n = innerWidth >= 720 ? 2 : 1;
  const off = (vm.getFullYear() - now.getFullYear()) * 12 + vm.getMonth() - now.getMonth();
  calNav[0].disabled = off <= 0; calNav[1].disabled = off + n > MAX_MONTHS;
  calMonths.innerHTML = "";
  for (let m = 0; m < n; m++) {
    const first = new Date(vm.getFullYear(), vm.getMonth() + m, 1), el = document.createElement("div");
    el.className = "cal-m";
    el.innerHTML = "<b>" + first.toLocaleDateString(T.loc, {month:"long", year:"numeric"}) + "</b><div class='cal-g'>" + T.wd.map(w=> "<i>" + w + "</i>").join("") + "</div>";
    const g = el.lastChild;
    for (let k = (first.getDay() + 6) % 7; k--; ) g.append(document.createElement("span"));
    for (let d = first; d.getMonth() === first.getMonth(); d = plus1(d)) {
      const s = iso(d), b = document.createElement("button"), full = booked.has(s);
      b.type = "button"; b.textContent = d.getDate(); b.dataset.d = s;
      // semasa pilih check-out: malam penuh pertama selepas check-in masih boleh jadi hari check-out
      b.disabled = s < t || (lim && s > ci ? s > lim : full);
      b.className = (full && s !== lim ? "x " : "") + (s === ci ? "s" : s === co ? "e" : ci && co && s > ci && s < co ? "r" : "");
      if (full) b.title = s === lim ? T.coOnly : T.full;
      g.append(b);
    }
    calMonths.append(el);
  }
};
const openCal = which =>{
  if (which === "out" && ci) co = "";
  vm = ci ? day(ci) : new Date(); vm.setDate(1);
  syncBook(); renderCal();
  cal.classList.add("on"); document.body.style.overflow = "hidden"; calBox.focus();
};
const closeCal = ()=>{ cal.classList.remove("on"); document.body.style.overflow = ""; };
calMonths.addEventListener("click", e=>{
  const s = e.target.dataset.d;
  if (!s || e.target.disabled) return;
  if (ci && !co && s > ci) { co = s; setTimeout(closeCal, 300); } else { ci = s; co = ""; }
  syncBook(); renderCal();
});
calNav.forEach(b=> b.addEventListener("click", ()=>{ vm = new Date(vm.getFullYear(), vm.getMonth() + +b.dataset.m, 1); renderCal(); }));
cal.querySelector(".cal-clr").onclick = ()=>{ ci = co = ""; syncBook(); renderCal(); };
cal.querySelector(".cal-ok").onclick = closeCal;
cal.addEventListener("click", e=>{ if (e.target === cal) closeCal(); });
addEventListener("keydown", e=>{ if (e.key === "Escape" && cal.classList.contains("on")) closeCal(); });
addEventListener("resize", ()=>{ if (cal.classList.contains("on")) renderCal(); });
book.querySelectorAll("[data-cal]").forEach(f=> f.addEventListener("click", ()=> openCal(f.dataset.cal)));

/* lencana hujung minggu kosong: malam Jumaat dan Sabtu, check-out Ahad */
const wk = document.getElementById("wk");
const showWeekend = ()=>{
  const now = new Date(), d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() + (12 - d.getDay()) % 7);          // Jumaat terdekat (hari ini jika Jumaat)
  for (let k = 0; k < 8; k++, d.setDate(d.getDate() + 7)) {
    const fri = iso(d), sat = iso(plus1(d)), sun = iso(plus1(plus1(d)));
    if (booked.has(fri) || booked.has(sat)) continue;
    const o = {day:"numeric", month:"short"};
    wk.lastChild.textContent = (k ? T.wkSoon : now.getDay() % 6 ? T.wkThis : T.wkNext) + " · " + fmt(fri,o) + " – " + fmt(sun,o);
    wk.onclick = ()=>{ ci = fri; co = sun; syncBook(); };
    wk.hidden = false;
    return;
  }
};

calSt.textContent = T.loading;
fetch("/api/availability").then(r=> r.ok ? r.json() : Promise.reject()).then(j=>{
  booked = new Set(j.booked); calSt.textContent = "";
  if (ci && (booked.has(ci) || co && nextBooked(ci) < co)) ci = co = "";   // pilihan awal bertembung dengan tempahan
  showWeekend();
}).catch(()=>{ calSt.textContent = T.err; })
  .finally(()=>{ syncBook(); if (cal.classList.contains("on")) renderCal(); });
syncBook();

book.addEventListener("submit", e=>{
  e.preventDefault();
  if (!ci || !co) return openCal(ci ? "out" : "in");
  const o = {weekday:"long", day:"numeric", month:"short", year:"numeric"}, kids = +fkid.value;
  const msg = [T.waHead,
    "Check-in: " + fmt(ci,o),
    "Check-out: " + fmt(co,o) + " (" + T.nights(nights()) + ")",
    T.guests + ": " + T.adults(fad.value) + (kids ? ", " + T.kids(kids) : ""),
    T.price].join("\n");
  trackWa();
  open(waLink(msg), "_blank", "noopener");
});
document.querySelector(".nav-cta").addEventListener("click", ()=> setTimeout(()=> fin.focus({preventScroll:true}), 600));

/* hero slideshow */
const slides = [...document.querySelectorAll(".slide")];
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
let si = 0, timer;
const go = i => { si = (i + slides.length) % slides.length; slides.forEach((s,k)=> s.classList.toggle("on", k===si)); };
const play = ()=>{ clearInterval(timer); if (!still) timer = setInterval(()=> go(si+1), 6000); };
document.addEventListener("visibilitychange", ()=>{ if (document.hidden) clearInterval(timer); else play(); });
requestAnimationFrame(()=> requestAnimationFrame(()=>{ go(0); play(); }));
document.getElementById("ig").href = "https://instagram.com/" + CONFIG.instagram;
document.getElementById("igtext").textContent = "@" + CONFIG.instagram;
document.getElementById("addr").textContent = CONFIG.address;
const ll = CONFIG.lat + "," + CONFIG.lng;
document.getElementById("mapframe").src = "https://maps.google.com/maps?q=" + ll + "&z=16&output=embed";
document.getElementById("waze").href = CONFIG.waze;
document.getElementById("mapfb").href = "https://www.google.com/maps/search/?api=1&query=" + ll;
document.getElementById("gmaps").href = "https://www.google.com/maps/search/?api=1&query=" + ll;
document.getElementById("yr").textContent = new Date().getFullYear();

const nav = document.getElementById("nav");
const onScroll = ()=> nav.classList.toggle("solid", scrollY > 40);
addEventListener("scroll", onScroll, {passive:true}); onScroll();

const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));

const imgs = [...document.querySelectorAll("#gal img")], lb = document.getElementById("lb"), lbi = lb.querySelector("img");
let cur = 0;
const show = i => { cur = (i + imgs.length) % imgs.length; lbi.src = imgs[cur].src; lbi.alt = imgs[cur].alt; };
imgs.forEach((im,i)=> im.parentElement.addEventListener("click",()=>{ show(i); lb.classList.add("on"); }));
lb.querySelector(".x").onclick = ()=> lb.classList.remove("on");
lb.querySelector(".pv").onclick = e=>{ e.stopPropagation(); show(cur-1); };
lb.querySelector(".nx").onclick = e=>{ e.stopPropagation(); show(cur+1); };
lb.addEventListener("click", e=>{ if(e.target===lb) lb.classList.remove("on"); });
addEventListener("keydown", e=>{ if(!lb.classList.contains("on")) return;
  if(e.key==="Escape") lb.classList.remove("on"); if(e.key==="ArrowLeft") show(cur-1); if(e.key==="ArrowRight") show(cur+1); });
