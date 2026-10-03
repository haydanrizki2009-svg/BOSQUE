// ============================================================
//  PENGATURAN – ISI BAGIAN INI SAJA
//  Tempel link Web App dari Google Apps Script di antara tanda kutip:
//  (Deploy > New deployment > Web app > salin URL yang berakhiran /exec)
//  Contoh: const SCRIPT_URL="https://script.google.com/macros/s/XXXX/exec";
// ============================================================
const SCRIPT_URL="PASTE_URL_WEB_APP_DI_SINI";
// ============================================================

const $=id=>document.getElementById(id);
const rp=n=>"Rp "+n.toLocaleString("id-ID");
let item=null,method=null;
document.body.classList.add("js");

// ---------- klik (dipasang paling awal & lewat delegasi, supaya selalu aktif) ----------
document.addEventListener("click",e=>{
  const t=e.target.closest?e.target:e.target.parentElement;if(!t)return;
  const it=t.closest(".item");if(it)return pickItem(it);
  const py=t.closest(".pay");if(py)return pickPay(py);
  if(t.closest("#sendBtn"))return sendOrder();
});

// ---------- aturan data akun ----------
const RULES=[["uid",v=>/^\d{5,}$/.test(v),"ID harus berupa angka"],["srv",v=>/^\d{3,5}$/.test(v),"Server harus berupa angka"],["nick",v=>v.length>=2,"Nick dalam game belum diisi"],["hp",v=>/^0?8\d{8,12}$|^\+?628\d{8,12}$/.test(v.replace(/[\s-]/g,"")),"Nomor HP tidak valid (contoh 0812xxxxxxx)"]];
const LABEL={uid:"ID",srv:"Server",nick:"Nick dalam game",hp:"Nomor HP"};
const dataOk=()=>RULES.every(([id,ok])=>ok($(id).value.trim()));

// ---------- popup peringatan ----------
function modal(title,msg,el){
  let m=$("modal");
  if(!m){
    m=document.createElement("div");m.id="modal";m.className="modal";m.setAttribute("role","alertdialog");m.setAttribute("aria-modal","true");
    m.innerHTML='<div class="mbox"><img alt="" id="mimg"><h3 id="mt"></h3><p id="mm"></p><button type="button" id="mok">Oke, isi sekarang</button></div>';
    document.body.appendChild(m);$("mimg").src=$("heroMas").src;
    m.addEventListener("click",e=>{if(e.target===m||e.target.id==="mok")closeModal()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
  }
  $("mt").textContent=title;$("mm").textContent=msg;m._el=el;m.classList.add("on");$("mok").focus();
}
function closeModal(){
  const m=$("modal");if(!m||!m.classList.contains("on"))return;
  m.classList.remove("on");
  if(m._el){m._el.scrollIntoView({behavior:"smooth",block:"center"});m._el.focus({preventScroll:true})}
}
function validate(){
  document.querySelectorAll("input").forEach(i=>i.classList.remove("bad"));
  const empty=RULES.filter(([id])=>!$(id).value.trim());
  if(empty.length){
    empty.forEach(([id])=>$(id).classList.add("bad"));
    const list=empty.map(([id])=>LABEL[id]).join(", ");
    $("err").textContent="Isi data akun terlebih dahulu: "+list+".";
    modal("Isi data akun dulu ya!","Kamu belum mengisi: "+list+". Lengkapi dulu sebelum memilih produk.",$(empty[0][0]));
    return false;
  }
  for(const [id,ok,m] of RULES){const el=$(id);if(!ok(el.value.trim())){
    el.classList.add("bad");$("err").textContent=m+".";modal("Data belum benar",m+".",el);return false}}
  $("err").textContent="";return true;
}

// ---------- langkah & maskot ----------
const SAY=["Isi data akunmu dulu ya!","Mantap! Sekarang pilih item.","Pilih cara bayarnya!","Tekan KIRIM kalau sudah bayar!"];
function step(n){const b=$("bubble");b.textContent=SAY[n-1];b.style.animation="none";void b.offsetWidth;b.style.animation="";
  document.querySelectorAll(".st").forEach((s,i)=>s.classList.toggle("on",i<n))}

// produk redup selama data belum lengkap; tutup pembayaran jika data jadi tidak valid
function lock(){const ok=dataOk();document.querySelectorAll(".item").forEach(i=>i.classList.toggle("locked",!ok));return ok}
document.querySelectorAll("input").forEach(el=>el.addEventListener("input",()=>{
  el.classList.remove("bad");
  if(lock())$("err").textContent="";
  else if(item){
    item=null;method=null;
    document.querySelectorAll(".item,.pay").forEach(x=>x.classList.remove("sel"));
    $("pay").classList.remove("show");$("send").classList.remove("show");$("detail").innerHTML="";
    $("err").textContent="Data akun belum lengkap, pilih item lagi setelah data benar.";step(1);
  }
}));
lock();

// ---------- pilih produk ----------
function pickItem(btn){
  if(!validate()){step(1);return}   // data kosong/salah: berhenti, tidak lanjut ke pembayaran
  document.querySelectorAll(".item").forEach(i=>i.classList.remove("sel"));btn.classList.add("sel");
  item={name:btn.dataset.name,price:+btn.dataset.price};
  $("sumItem").textContent=item.name;$("sumPrice").textContent=rp(item.price);
  $("pay").classList.add("show");step(3);
  $("pay").scrollIntoView({behavior:"smooth",block:"start"});
  if(method)showPay(document.querySelector(".pay.sel"));
}

// ---------- pilih metode bayar ----------
function showPay(b){
  const num=b.dataset.num,d=$("detail");
  d.innerHTML=num
    ?'<p class="sub">Transfer '+rp(item.price)+' ke '+method+':</p><div class="acc"><b>'+num+'</b><button class="copy" type="button">Salin</button></div>'
    :'<p class="sub">Scan QRIS, bayar '+rp(item.price)+':</p><img class="qr" alt="QRIS KIKIK" src="'+$("qrisSrc").src+'">';
  const c=d.querySelector(".copy");
  if(c)c.onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText(num):Promise.reject()).then(()=>c.textContent="Tersalin!",()=>c.textContent=num);setTimeout(()=>c.textContent="Salin",1800)};
}
function pickPay(b){
  if(!item)return;
  document.querySelectorAll(".pay").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");method=b.dataset.m;
  showPay(b);
  $("send").classList.add("show");step(4);
  setTimeout(()=>$("send").scrollIntoView({behavior:"smooth",block:"center"}),150);
}

// ---------- tombol KIRIM ----------
function confetti(){
  const cols=["#ffd27a","#4de3ff","#ff8fc2","#a678ff"];
  for(let i=0;i<44;i++){const c=document.createElement("div");c.className="conf";c.style.left=Math.random()*100+"%";c.style.background=cols[i%4];c.style.animationDuration=(2+Math.random()*2.5)+"s";c.style.animationDelay=Math.random()*.8+"s";document.body.appendChild(c);setTimeout(()=>c.remove(),6000)}
}
async function sendOrder(){
  if(!item||!method||!validate())return;
  const btn=$("sendBtn"),orderId="BQ"+Date.now().toString(36).toUpperCase(),url=SCRIPT_URL.trim();
  const data={orderId,id:$("uid").value.trim(),server:$("srv").value.trim(),nick:$("nick").value.trim(),hp:$("hp").value.trim(),item:item.name,price:item.price,method};
  btn.disabled=true;btn.textContent="MENGIRIM...";
  try{
    if(url.startsWith("http")){
      // text/plain + no-cors agar tidak diblokir CORS oleh Apps Script
      await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)});
    }else console.warn("SCRIPT_URL belum diisi: pesanan tidak tersimpan ke Google Sheet.");
  }catch(e){
    btn.disabled=false;btn.textContent="KIRIM";
    alert("Pesanan gagal dikirim. Periksa koneksi internet lalu coba lagi.");return;
  }
  $("main").style.display="none";$("thanks").classList.add("show");
  $("recap").textContent="Order "+orderId+" • "+item.name+" • "+rp(item.price)+" • "+method;
  window.scrollTo(0,0);confetti();
}

// ---------- hiasan (jika gagal, tidak mengganggu fungsi di atas) ----------
try{
  document.querySelectorAll("#thanks .mas").forEach(i=>i.src=$("heroMas").src);
  for(let i=0;i<16;i++){const e=document.createElement("i");e.style.left=Math.random()*100+"%";e.style.animationDuration=(10+Math.random()*14)+"s";e.style.animationDelay=(-Math.random()*20)+"s";$("gems").appendChild(e)}
}catch(e){console.warn(e)}
