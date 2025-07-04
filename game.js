// Stoklar
const PRODUCT_LIST = [
  {id:"wheat", name:"Buğday",    img:"21.png", sell:5},
  {id:"flour", name:"Un",        img:"12.png", sell:10},
  {id:"water", name:"Su",        img:"20.png", sell:7},
  {id:"bread", name:"Ekmek",     img:"9.png", sell:30},
  {id:"bretzel", name:"Bretzel", img:"11.png", sell:60},
  {id:"cookie", name:"Cookie",   img:"10.png", sell:100}
];
let depot = {
  wheat: 0, flour:0, water:0, bread:0, bretzel:0, cookie:0
};
let energy = 70;
let money = 2500;
let diamonds = 10;

// Tarlalar ve binalar (yeni: büyük ve aynı mantıkta, draggable)
let fields = [];
const FIELD_MAX = 4;
let buildings = [
  {id: "well", name:"Su Kuyusu", img: "23.png", color: "23.png", gray:"23.png", price:100, owned:false, x:null, y:null},
  {id: "mill", name:"Değirmen",  img: "24.png", color: "24.png", gray:"24.png", price:150, owned:false, x:null, y:null},
  {id: "oven", name:"Fırın",     img: "22.png", color: "22.png", gray:"22.png", price:200, owned:false, x:null, y:null}
];

// Üst bar güncelle
const topBar = {
  money: document.getElementById("money-amount"),
  energy: document.getElementById("energy-amount"),
  diamond: document.getElementById("diamond-amount"),
};
function updateBar() {
  topBar.money.textContent = money;
  topBar.energy.textContent = energy;
  topBar.diamond.textContent = diamonds;
}

// Animasyon
function showAnim(type, amount, icon) {
  const animDiv = document.createElement("div");
  animDiv.className = "floating-anim";
  animDiv.innerHTML = `<img src="${icon}" alt="">${amount > 0 ? "+" : ""}${amount}`;
  // Ortada ya da üst bar altında göster
  let x = window.innerWidth / 2 - 30 + Math.random()*15;
  let y = 110 + Math.random()*32;
  animDiv.style.left = `${x}px`;
  animDiv.style.top = `${y}px`;
  document.getElementById("floating-animations").appendChild(animDiv);
  setTimeout(() => animDiv.remove(), 1100);
}

// Field Spawner (büyük objeler için mesafe büyük tutuldu)
function randomFieldPos() {
  const pad = 18;
  const area = document.getElementById("field-area");
  const w = area.offsetWidth || window.innerWidth;
  const h = area.offsetHeight || (window.innerHeight-180);
  let tries = 14;
  while (tries--) {
    let x = pad + Math.random() * (w-240-pad);
    let y = 36 + Math.random() * (h-270-pad);
    let clash = fields.concat(buildings).some(f => f.x!==null && Math.abs(f.x-x) < 170 && Math.abs(f.y-y) < 170);
    if (!clash) return {x, y};
  }
  return {x: pad+Math.random()*(w-230-pad), y: 40+Math.random()*(h-240-pad)};
}

// Tarla oluşturma
function createField(initPos) {
  let field = {
    state: "empty",
    timer: null,
    timePassed: 0,
    container: null,
    x: initPos.x,
    y: initPos.y
  };
  const area = document.getElementById("field-area");
  const cont = document.createElement("div");
  cont.className = "field-container";
  cont.style.left = `${initPos.x}px`;
  cont.style.top  = `${initPos.y}px`;
  const img = document.createElement("img");
  img.className = "field-img";
  img.src = "1.png";
  cont.appendChild(img);

  // Action icons
  const act = document.createElement("div");
  act.className = "action-icons";
  act.style.display = "none";
  // Tohum (saydam, büyük)
  const seedBtn = document.createElement("button");
  seedBtn.innerHTML = `<img src="17.png" alt="Tohum" draggable="false">`;
  // Orak (saydam, büyük)
  const sickleBtn = document.createElement("button");
  sickleBtn.innerHTML = `<img src="19.png" alt="Orak" draggable="false">`;
  act.appendChild(seedBtn);
  act.appendChild(sickleBtn);
  cont.appendChild(act);

  // Drag
  let isDragging = false, dragTimeout = null, dragOffset = {x:0,y:0};
  function onPointerDown(e) {
    if (field.state !== "empty") return;
    dragTimeout = setTimeout(() => {
      isDragging = true;
      cont.classList.add("dragging");
      const rect = cont.getBoundingClientRect();
      let clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;
    }, 330);
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    let x = e.touches ? e.touches[0].clientX : e.clientX;
    let y = e.touches ? e.touches[0].clientY : e.clientY;
    cont.style.position = "fixed";
    cont.style.zIndex = "233";
    cont.style.left = (x - dragOffset.x) + "px";
    cont.style.top = (y - dragOffset.y) + "px";
  }
  function onPointerUp(e) {
    clearTimeout(dragTimeout);
    if (isDragging) {
      cont.classList.remove("dragging");
      cont.style.position = "absolute";
      let nx = Math.max(12, Math.min(window.innerWidth-225, parseInt(cont.style.left)));
      let ny = Math.max(22, Math.min(window.innerHeight-320, parseInt(cont.style.top)));
      cont.style.left = nx + "px";
      cont.style.top  = ny + "px";
      field.x = nx; field.y = ny;
      cont.style.zIndex = "";
      isDragging = false;
    }
  }
  img.addEventListener("touchstart", onPointerDown);
  img.addEventListener("mousedown", onPointerDown);
  window.addEventListener("touchmove", onPointerMove, {passive:false});
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("touchend", onPointerUp);
  window.addEventListener("mouseup", onPointerUp);

  // Tık: Action ikonlarını aç
  function showActions() {
    if(field.state==="growing"||field.state==="growing2") return;
    act.style.display="flex";
    setTimeout(()=>{act.style.display="none";}, 3900);
  }
  img.addEventListener("click", showActions);
  img.addEventListener("touchend", function(e){
    if(e.touches && e.touches.length>0) return;
    showActions();
  });

  // Tohum ekme
  seedBtn.onclick = function(e){
    e.stopPropagation();
    if(field.state!=="empty" || field.timer) return;
    if(energy<1||money<1) { alert("Yetersiz enerji/para!"); return; }
    energy--; money--;
    updateBar();
    showAnim("energy", "-1", "14.png");
    showAnim("money", "-1", "15.png");
    field.state = "growing";
    img.src = "2.png";
    act.style.display="none";
    field.timePassed = 0;
    field.timer = setTimeout(()=>{
      field.state="growing2"; img.src="3.png";
      field.timer = setTimeout(()=>{
        field.state="ready";
        img.src="4.png";
        field.timer=null;
      },15000);
    },15000);
  };
  // Orak
  sickleBtn.onclick = function(e){
    e.stopPropagation();
    if(field.state!=="ready") return;
    if(energy<1) { alert("Yetersiz enerji!"); return; }
    energy--;
    updateBar();
    showAnim("energy", "-1", "14.png");
    depot.wheat+=2;
    showAnim("wheat", "+2", "21.png");
    field.state="empty";
    img.src="1.png";
    act.style.display="none";
    updateDepotUI();
  };

  area.appendChild(cont);
  field.container = cont;
  return field;
}

// Bina oluşturma (değirmen, su kuyusu, fırın)
function createBuilding(build) {
  // zaten eklendiyse tekrar ekleme
  if(build.container) return;
  const area = document.getElementById("field-area");
  let b = build;
  let {x, y} = b.x!=null && b.y!=null ? b : randomFieldPos();
  b.x = x; b.y = y;
  const cont = document.createElement("div");
  cont.className = "building-container";
  cont.style.left = `${x}px`;
  cont.style.top  = `${y}px`;
  const img = document.createElement("img");
  img.className = "building-img";
  img.src = b.owned ? b.color : b.gray;
  if(!b.owned) img.classList.add("grayscale");
  else img.classList.add("owned");
  cont.appendChild(img);

  // Fiyat etiketi / satın alma
  let priceTag = null;
  function showPriceTag() {
    if(b.owned) return;
    if(priceTag) priceTag.remove();
    priceTag = document.createElement("div");
    priceTag.className = "price-tag";
    priceTag.innerHTML = `${b.price} <img src="15.png" style="width:30px;height:30px;margin-left:3px;"> 
      <button class="price-buy-btn">Satın Al</button>`;
    priceTag.querySelector("button").onclick = function(e){
      e.stopPropagation();
      if(money<b.price){alert("Yetersiz para!");return;}
      money-=b.price; updateBar();
      b.owned=true;
      img.classList.remove("grayscale"); img.classList.add("owned");
      img.src = b.color;
      if(priceTag) priceTag.remove();
      showAnim("money", `-${b.price}`, "15.png");
    };
    cont.appendChild(priceTag);
    setTimeout(()=>{if(priceTag) priceTag.remove();}, 4000);
  }

  // Drag
  let isDragging = false, dragTimeout = null, dragOffset = {x:0,y:0};
  function onPointerDown(e) {
    dragTimeout = setTimeout(() => {
      isDragging = true;
      cont.classList.add("dragging");
      const rect = cont.getBoundingClientRect();
      let clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;
    }, 320);
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    let x = e.touches ? e.touches[0].clientX : e.clientX;
    let y = e.touches ? e.touches[0].clientY : e.clientY;
    cont.style.position = "fixed";
    cont.style.zIndex = "237";
    cont.style.left = (x - dragOffset.x) + "px";
    cont.style.top = (y - dragOffset.y) + "px";
  }
  function onPointerUp(e) {
    clearTimeout(dragTimeout);
    if (isDragging) {
      cont.classList.remove("dragging");
      cont.style.position = "absolute";
      let nx = Math.max(12, Math.min(window.innerWidth-225, parseInt(cont.style.left)));
      let ny = Math.max(22, Math.min(window.innerHeight-320, parseInt(cont.style.top)));
      cont.style.left = nx + "px";
      cont.style.top  = ny + "px";
      b.x = nx; b.y = ny;
      cont.style.zIndex = "";
      isDragging = false;
    }
  }
  img.addEventListener("touchstart", onPointerDown);
  img.addEventListener("mousedown", onPointerDown);
  window.addEventListener("touchmove", onPointerMove, {passive:false});
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("touchend", onPointerUp);
  window.addEventListener("mouseup", onPointerUp);

  // Tık: Fiyat etiketi aç (satın alınmadıysa)
  function showPrice() {
    if(!b.owned) showPriceTag();
  }
  img.addEventListener("click", showPrice);
  img.addEventListener("touchend", function(e){
    if(e.touches && e.touches.length>0) return;
    showPrice();
  });

  area.appendChild(cont);
  b.container = cont;
  return b;
}

// Alanı temizle ve tarlaları + binaları göster
function renderFields() {
  document.getElementById("field-area").innerHTML = "";
  buildings.forEach(b=>createBuilding(b));
  fields.forEach(f=>document.getElementById("field-area").appendChild(f.container));
}

// MODAL LOGIC (Depo)
function updateDepotUI(){
  const depoList = document.getElementById("depo-list");
  depoList.innerHTML = "";
  PRODUCT_LIST.forEach(pr=>{
    if(depot[pr.id]>0){
      const row = document.createElement("div");
      row.className="depo-item";
      row.innerHTML = `<img src="${pr.img}"><span class="depo-item-name">${pr.name}</span><span class="depo-item-count" id="depo-count-${pr.id}">${depot[pr.id]}</span>
      <button class="depo-sell-btn" id="sell-${pr.id}">Sat (+${pr.sell})</button>`;
      depoList.appendChild(row);
      row.querySelector(`#sell-${pr.id}`).onclick = function(){
        depot[pr.id]--;
        money+=pr.sell;
        showAnim("money", `+${pr.sell}`, "15.png");
        updateBar();
        updateDepotUI();
      };
    }
  });
  if(depoList.innerHTML==="") depoList.innerHTML = "<div>Depoda ürün yok.</div>";
}
// MODAL Depo aç/kapat
document.getElementById("depo-btn").onclick = () => {
  updateDepotUI();
  document.getElementById("modal-depo").style.display="flex";
};
document.getElementById("close-depo").onclick = () => {
  document.getElementById("modal-depo").style.display="none";
};

// MODAL LOGIC (Mağaza)
function updateMagazaUI(){
  const magazaList = document.getElementById("magaza-list");
  magazaList.innerHTML = "";
  if(fields.length<FIELD_MAX){
    const row = document.createElement("div");
    row.className="magaza-item";
    row.innerHTML = `<img src="1.png"><span class="depo-item-name">Yeni Tarla</span><span class="depo-item-count">50</span>
    <button class="magaza-item-btn" id="buy-field">Satın Al</button>`;
    magazaList.appendChild(row);
    row.querySelector("#buy-field").onclick = function(){
      if(money<50){
        alert("Yetersiz para!");
        return;
      }
      money-=50;
      showAnim("money", "-50", "15.png");
      updateBar();
      const pos = randomFieldPos();
      let f = createField(pos);
      fields.push(f);
      renderFields();
      updateMagazaUI();
    };
  } else {
    magazaList.innerHTML = "<div>En fazla 4 tarla sahibi olabilirsin!</div>";
  }
}
// MODAL Mağaza aç/kapat
document.getElementById("magaza-btn").onclick = () => {
  updateMagazaUI();
  document.getElementById("modal-magaza").style.display="flex";
};
document.getElementById("close-magaza").onclick = () => {
  document.getElementById("modal-magaza").style.display="none";
};

// Alt butonlar
document.getElementById("gorevler-btn").onclick = () => alert("Görevler gösterilecek!");
document.getElementById("ayarlar-btn").onclick = () => alert("Ayarlar menüsü!");

// BAŞLANGIÇ
updateBar();
fields.push(createField({x:window.innerWidth/2-110, y:window.innerHeight/2-160}));
renderFields();

window.addEventListener("resize",()=>renderFields());
