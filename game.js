// ---- OYUN DEĞİŞKENLERİ
let durum = {
  coin: 100, energy: 100, gem: 100, depot: {},
  slotlar: [null,null,null,null,null,null,null,null,null],
  // slot tipi: {type: "tarla"|"firin"|"degirmen"|"sukuyusu", ... }
  suKuyusu: { su:0, last:Date.now() },
  gorev: { hasat:0, ekmek:0, su:0, odulAldi:false }
};
// --- ÜRÜN BİLGİLERİ
let urunler = [
  { ad:"Buğday", key:"bugday", sprite:"21.png", grow:30, fiyat:5 }
];
// --- BAŞLANGIÇTA 1 TARLA
durum.slotlar[0] = {type:"tarla", durum:"empty", time:0, crop:null};
// --- ARAYÜZ & BAR
function updateBar(){
  document.getElementById("coin").innerText = durum.coin;
  document.getElementById("energy").innerText = durum.energy;
  document.getElementById("gem").innerText = durum.gem;
}
// ---- SLOT ÇİZ (Drag & Drop)
function renderSlots(){
  let alan = document.getElementById("slot-area"); alan.innerHTML = "";
  durum.slotlar.forEach((s, i)=>{
    alan.innerHTML += `
    <div class="slot" data-slot="${i}">
      ${s ? binaHtml(s,i) : ""}
    </div>`;
  });
  // Drag eventi için hazırlık
  Array.from(document.querySelectorAll(".bina")).forEach(el=>{
    el.ondragstart = e => {e.preventDefault();};
    dragHandler(el);
  });
}
// -- Drag/Drop/Longtouch fonksiyonları
let dragObj = null, dragIdx = null;
function dragHandler(el){
  let t0, moved=false, slotIndex = +el.dataset.idx;
  el.onmousedown = el.ontouchstart = function(ev){
    t0 = Date.now(); moved=false;
    let timeout = setTimeout(()=>{
      dragObj = el; dragIdx=slotIndex;
      el.classList.add("dragging");
      document.body.style.cursor="grabbing";
    },250);
    function move(e){
      if(dragObj){
        moved = true;
        let touch = e.touches?e.touches[0]:e;
        dragObj.style.position="fixed";
        dragObj.style.pointerEvents="none";
        dragObj.style.left = (touch.clientX-80)+"px";
        dragObj.style.top  = (touch.clientY-40)+"px";
      }
    }
    function up(e){
      clearTimeout(timeout);
      if(dragObj){
        dragObj.classList.remove("dragging");
        dragObj.style.position="";
        dragObj.style.left=dragObj.style.top="";
        document.body.style.cursor="";
        let elem = document.elementFromPoint(
          (e.changedTouches?e.changedTouches[0]:e).clientX,
          (e.changedTouches?e.changedTouches[0]:e).clientY
        );
        let slotDiv = elem.closest(".slot");
        if(slotDiv){
          let target = +slotDiv.dataset.slot;
          let temp = durum.slotlar[target];
          durum.slotlar[target]=durum.slotlar[dragIdx];
          durum.slotlar[dragIdx]=temp;
          renderSlots();
        }
        dragObj=null;
      }
      window.removeEventListener("mousemove",move);
      window.removeEventListener("touchmove",move);
      window.removeEventListener("mouseup",up);
      window.removeEventListener("touchend",up);
    }
    window.addEventListener("mousemove",move);
    window.addEventListener("touchmove",move);
    window.addEventListener("mouseup",up);
    window.addEventListener("touchend",up);
  }
}
// -- Bina kutu içeriği
function binaHtml(s,idx){
  if(s.type==="tarla"){
    let img = "1.png";
    if(s.durum==="growing") img = (s.time<15)?"2.png":"3.png";
    if(s.durum==="ready") img="4.png";
    let action = "";
    if(s.durum==="empty")
      action = `<img src="17.png" class="action-btn" onclick="tarlaEkim(${idx})" title="Tohum ek">`;
    if(s.durum==="ready")
      action = `<img src="19.png" class="action-btn" onclick="tarlaHasat(${idx})" title="Hasat et">`;
    return `<div class="bina" data-idx="${idx}">
      <img src="${img}" class="bina-img">
      <div class="actions">${action}</div>
      <div class="timer">${
        s.durum==="growing"?`<img src="21.png"> <small>${30-s.time}s</small>`:""
      }${s.durum==="ready"?`<img src="21.png"> <small>Hazır!</small>`:""}</div>
    </div>`;
  }
  if(s.type==="firin"){
    return `<div class="bina" data-idx="${idx}">
      <img src="22.png" class="bina-img">
      <div class="actions"><img src="10.png" class="action-btn" onclick="firinPanel()" title="Ekmek üret"></div>
    </div>`;
  }
  if(s.type==="degirmen"){
    return `<div class="bina" data-idx="${idx}">
      <img src="24.png" class="bina-img">
      <div class="actions"><img src="11.png" class="action-btn" onclick="degirmenPanel()" title="Un üret"></div>
    </div>`;
  }
  if(s.type==="sukuyusu"){
    return `<div class="bina" data-idx="${idx}">
      <img src="23.png" class="bina-img">
      <div class="actions"><img src="20.png" class="action-btn" onclick="wellPanel()" title="Su toplama"></div>
    </div>`;
  }
}
// --- TARLA Fonksiyonları
window.tarlaEkim = function(idx){
  if(durum.energy<1) return alert("Yeterli enerji yok!");
  durum.energy -= 1;
  durum.slotlar[idx] = {type:"tarla", durum:"growing", time:0, crop:"bugday"};
  updateBar(); renderSlots();
}
window.tarlaHasat = function(idx){
  durum.slotlar[idx] = {type:"tarla", durum:"empty", time:0, crop:null};
  durum.depot["Buğday"]=(durum.depot["Buğday"]||0)+1;
  durum.gorev.hasat++;
  updateBar(); renderSlots();
  checkGorev();
}
// --- SU KUYUSU
window.wellPanel = function(){
  let su = durum.suKuyusu.su;
  let buton = `<button ${su==0?"disabled":""} onclick="suTopla()">Su Topla</button>`;
  let info = `<div class='well-panel'><img src='23.png'> <b>Su Kuyusu</b> <br>
  <small>Biriken Su: <b>${su}/10</b> (30sn'de 1 su)</small><br>${buton}</div>`;
  modalGoster(info);
}
window.suTopla = function(){
  let su = durum.suKuyusu.su;
  if(su>0){
    durum.depot["Su"] = (durum.depot["Su"]||0) + su;
    durum.gorev.su += su;
    durum.suKuyusu.su = 0;
    wellPanel();
    checkGorev();
  }
}
// --- DEĞİRMEN
window.degirmenPanel = function(){
  let bugday = durum.depot["Buğday"]||0, un = durum.depot["Un"]||0;
  let buton = `<button ${(bugday<1||durum.energy<1)?"disabled":""} onclick="unUret()">Un Üret (1 <img src='21.png'>, 1 <img src='14.png'>)</button>`;
  let info = `<div style='padding:7px;'><img src='24.png'> <b>Değirmen</b><br>
  <small>1 Buğday + 1 Enerji = 1 Un</small><br>${buton}<br>
  Depo: <img src='21.png'>${bugday} <img src='12.png'>${un}</div>`;
  modalGoster(info);
}
window.unUret = function(){
  if((durum.depot["Buğday"]||0)<1||durum.energy<1) return;
  durum.depot["Buğday"]-=1;
  durum.depot["Un"] = (durum.depot["Un"]||0)+1;
  durum.energy -= 1;
  degirmenPanel(); updateBar();
  checkGorev();
}
// --- FIRIN
window.firinPanel = function(){
  let un = durum.depot["Un"]||0, su = durum.depot["Su"]||0, ekmek = durum.depot["Ekmek"]||0;
  let buton = `<button ${(un<1||su<1||durum.energy<1)?"disabled":""} onclick="ekmekUret()">Ekmek Üret (1 <img src='12.png'> 1 <img src='20.png'> 1 <img src='14.png'>)</button>`;
  let info = `<div style='padding:7px;'><img src='22.png'> <b>Fırın</b><br>
  <small>1 Un + 1 Su + 1 Enerji = 1 Ekmek</small><br>${buton}<br>
  Depo: <img src='12.png'>${un} <img src='20.png'>${su} <img src='9.png'>${ekmek}</div>`;
  modalGoster(info);
}
window.ekmekUret = function(){
  if((durum.depot["Un"]||0)<1||(durum.depot["Su"]||0)<1||durum.energy<1) return;
  durum.depot["Un"]-=1; durum.depot["Su"]-=1;
  durum.depot["Ekmek"]=(durum.depot["Ekmek"]||0)+1;
  durum.energy -= 1;
  durum.gorev.ekmek++;
  firinPanel(); updateBar();
  checkGorev();
}
// --- MAĞAZA
document.getElementById("magazaBtn").onclick = function() {
  let magazaHTML = `
  <div class="magaza-list">
    <div class="magaza-item">
      <img src="1.png"><b>Tarla</b>
      <button onclick="satinal('tarla')">10 <img src='15.png' style='width:14px;vertical-align:middle'></button>
    </div>
    <div class="magaza-item">
      <img src="22.png"><b>Fırın</b>
      <button onclick="satinal('firin')">40 <img src='15.png' style='width:14px;vertical-align:middle'></button>
    </div>
    <div class="magaza-item">
      <img src="24.png"><b>Değirmen</b>
      <button onclick="satinal('degirmen')">30 <img src='15.png' style='width:14px;vertical-align:middle'></button>
    </div>
    <div class="magaza-item">
      <img src="23.png"><b>Su Kuyusu</b>
      <button onclick="satinal('sukuyusu')">20 <img src='15.png' style='width:14px;vertical-align:middle'></button>
    </div>
  </div>`;
  modalGoster("<h3>Mağaza</h3>" + magazaHTML);
};
// Satın alma fonksiyonu (KAYBOLMA HATASIZ!)
window.satinal = function(ne) {
  let fiyat = { "tarla":10, "firin":40, "degirmen":30, "sukuyusu":20 }[ne];
  if(durum.coin < fiyat) { alert("Yeterli paran yok!"); return; }
  durum.coin -= fiyat;
  let idx = durum.slotlar.findIndex(x=>x===null);
  if(idx<0){ alert("Daha fazla alan yok!"); return; }
  if(ne==="tarla") durum.slotlar[idx]={type:"tarla", durum:"empty", time:0, crop:null};
  if(ne==="firin") durum.slotlar[idx]={type:"firin"};
  if(ne==="degirmen") durum.slotlar[idx]={type:"degirmen"};
  if(ne==="sukuyusu") durum.slotlar[idx]={type:"sukuyusu"};
  updateBar(); renderSlots(); modalKapat();
}
// --- DEPO (ÜRÜN SAT)
document.getElementById("depoBtn").onclick = function() {
  let depoHTML = `<h3>Depo</h3><div class="depo-list">`;
  let dep = durum.depot;
  let satF = function(ad,fiyat){
    return `<button onclick="urunSat('${ad}',${fiyat})">Sat (${fiyat} <img src='15.png' style='width:13px;vertical-align:middle'>)</button>`;
  };
  let varMi = false;
  Object.keys(dep).forEach(ad=>{
    if(dep[ad]>0){
      varMi=true;
      let spr = (ad=="Buğday"?"21.png":ad=="Un"?"12.png":ad=="Ekmek"?"9.png":ad=="Su"?"20.png":"");
      let fiyat = ad=="Buğday"?5:ad=="Un"?18:ad=="Ekmek"?35:ad=="Su"?3:1;
      depoHTML += `<div class="depo-item"><img src="${spr}">${ad} <b>x${dep[ad]}</b> ${satF(ad,fiyat)}</div>`;
    }
  });
  if(!varMi) depoHTML += `<div style="opacity:.75; font-size:.98em;">Depo boş</div>`;
  depoHTML += "</div>";
  modalGoster(depoHTML);
};
window.urunSat = function(ad,fiyat){
  if(!durum.depot[ad]||durum.depot[ad]<1) return;
  durum.depot[ad]-=1;
  durum.coin+=fiyat;
  updateBar();
  document.getElementById("depoBtn").click();
  if(ad=="Su") durum.gorev.su++; // görev sayacı
  checkGorev();
}
// -- GÖREVLER --
document.getElementById("gorevBtn").onclick = function(){
  let g = durum.gorev, bitti = g.hasat>=3 && g.ekmek>=2 && g.su>=5 && !g.odulAldi;
  let gorevHTML = `<h3>Görevler</h3>
  <div class="gorevler-list">
    <div class="gorev-kutu">${g.hasat>=3?'<span class="gorev-done">✓</span>':'🟩'} 3 kez hasat yap (${g.hasat}/3)</div>
    <div class="gorev-kutu">${g.ekmek>=2?'<span class="gorev-done">✓</span>':'🟩'} 2 ekmek üret (${g.ekmek}/2)</div>
    <div class="gorev-kutu">${g.su>=5?'<span class="gorev-done">✓</span>':'🟩'} 5 su sat (${g.su}/5)</div>
  </div>
  ${bitti?`<button class="gorev-buton" id="gorevOdul">200 <img src='15.png' style='width:13px;vertical-align:middle'> Ödülü Al</button>`:""}
  `;
  modalGoster(gorevHTML);
  if(bitti){
    document.getElementById("gorevOdul").onclick = function(){
      durum.coin+=200; durum.gorev.odulAldi=true; updateBar(); modalKapat();
    }
  }
}
document.getElementById("ayarBtn").onclick = ()=>modalGoster("<img src='18.png'><h3>Ayarlar</h3><div>Ayarlar yakında aktif olacak.</div>");
// --- SU KUYUSU TIMER
setInterval(function(){
  let idx = durum.slotlar.findIndex(s=>s && s.type==="sukuyusu");
  if(idx>=0){
    let now = Date.now();
    let delta = Math.floor((now - durum.suKuyusu.last)/1000);
    if(delta >= 30 && durum.suKuyusu.su < 10) {
      let ekle = Math.min(Math.floor(delta/30), 10-durum.suKuyusu.su);
      durum.suKuyusu.su += ekle;
      durum.suKuyusu.last = now - ((delta%30)*1000);
    }
  }
},1000);
// --- TARLA BÜYÜME TIMER
setInterval(function(){
  durum.slotlar.forEach((s,i)=>{
    if(s && s.type=="tarla" && s.durum=="growing"){
      s.time+=1;
      if(s.time>=30){ s.durum="ready"; }
    }
  });
  renderSlots();
},1000);
// --- Görev tamamlamasını her önemli aksiyonda çağır!
function checkGorev(){ }
// --- BAŞLANGIÇ
renderSlots(); updateBar();
// --- MODAL sistemi
function modalGoster(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalbg").style.display="flex";
}
function modalKapat() {
  document.getElementById("modalbg").style.display="none";
}
