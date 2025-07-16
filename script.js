// Sayfa yüklendikçe ilgili sekmeyi aktif eder ve içeriğini yükler
const sayfa_yonlendirme = () => {
    document.querySelectorAll('#sideMenu .nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('#sideMenu .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('#yorumYeri > div').forEach(div => div.classList.remove('active'));
            const sayfa_id = this.getAttribute('data-page');
            const sayfa_elementi = document.getElementById(sayfa_id);
            if (sayfa_elementi) {
                sayfa_elementi.classList.add('active');
            }
            sayfa_icerigi_yukle(sayfa_id);
        });
    });
};

//seçilen sayfaya göre div gösterir
const sayfa_icerigi_yukle = (sayfa_id) => {
    switch(sayfa_id) {
        case 'dashboard':
            son_servisleri_yukle();
            teslim_durumu_yukle();
            grafik_baslat();
            servis_durum_sayilarini_guncelle();
            break;
        case 'servis_kayitlari':
            servis_kayitlarini_yukle();
            break;
        case 'faturalar':
            
            fatura_tablosunu_guncelle();
            break;
        case 'sms_gonder':
            
            break;

    }
};

//kullanım grafik oluşturur
const grafik_baslat = () => {
    const ctx = document.getElementById('analiz_grafigi').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1 Mart', '2 Mart', '3 Mart', '4 Mart', '5 Mart', '6 Mart'],
            datasets: [{
                label: 'İşlem Sayısı',
                data: [0, 2, 2, 1, 1, 0],
                fill: true,
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderColor: 'rgba(13, 110, 253, 1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

//son 10 servisi ana menüde listeleme
const son_servisleri_yukle = () => {
let servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
servisler = servisler.slice(-10);

const container = document.getElementById('son_servisler');
container.innerHTML = servisler.map(servis => `
    <div class="list-group-item d-flex justify-content-between align-items-center">
        <div>
            <h6 class="mb-0">${servis.cihaz_marka_model} - ${servis.musteri_adi}</h6>
            <small class="text-muted">${yardimci_fonksiyonlar.tarih_formatla(servis.tarih)}</small>
        </div>
        <span class="badge bg-${servis_durumu_renk(servis.servis_durumu)} rounded-pill">${servis_durumu_formatla(servis.servis_durumu)}</span>
    </div>
`).join('');
};

//teslim sürelerini kontrol eder ve duruma göre renk kodlar
const teslim_durumu_yukle = () => {
let servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
const bugun = new Date();
const container = document.getElementById('teslim_durumu');

container.innerHTML = servisler.map(servis => {
    const teslim_tarihi = new Date(servis.tarih);
    const gun_farki = Math.floor((bugun - teslim_tarihi) / (1000 * 60 * 60 * 24));
    let durum_metni = '';
    let durum_tipi = '';

    if (servis.servis_durumu === 'teslim_edildi') {
        return '';
    }

    if (gun_farki > 0) {
        durum_metni = `${gun_farki} gün geçti`;
        durum_tipi = 'danger';
    } else if (gun_farki === 0) {
        durum_metni = 'Bugün';
        durum_tipi = 'warning';
    } else {
        durum_metni = `${-gun_farki} gün kaldı`;
        durum_tipi = 'primary';
    }
    return `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-0">${servis.cihaz_marka_model} - ${servis.musteri_adi}</h6>
                <small class="text-muted">Tahmini Teslim: ${yardimci_fonksiyonlar.tarih_formatla(servis.tarih)}</small>
            </div>
            <span class="badge bg-${durum_tipi} rounded-pill">${durum_metni}</span>
        </div>
    `;
}).join('');
};

// tüm servisleri tabloya yazar
const servis_kayitlarini_yukle = () => {
    const servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
    const tablo_body = document.getElementById('servis_kayitlari_tablosu');
    tablo_body.innerHTML = servisler.map(servis => `
        <tr>
            <td>${servis.id}</td>
            <td>${servis.musteri_adi}</td>
            <td>${servis.cihaz_marka_model}</td>
            <td><span class="badge bg-${servis_durumu_renk(servis.servis_durumu)}">${servis_durumu_formatla(servis.servis_durumu)}</span></td>
            <td>${yardimci_fonksiyonlar.tarih_formatla(servis.tarih)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="servis_goruntule('${servis.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="servis_duzenle('${servis.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="servis_sil('${servis.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
     servis_durum_sayilarini_guncelle();
};

//servis durumuna göre renk belirler.
const servis_durumu_renk = (durum) => {
switch (durum) {
    case 'beklemede': return 'warning';
    case 'teslime_hazir': return 'danger';
    case 'teslim_edildi': return 'success';
    case 'garantide': return 'primary';
    default: return 'secondary';
}
};

//servis durum sayılarını ana menüdeki sayıları-
// günceller , yani beklemede, teslime hazır, teslim edildi, garantide
const servis_durum_sayilarini_guncelle = () => {
const servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
const beklemede_sayisi = servisler.filter(s => s.servis_durumu === 'beklemede').length;
const teslime_hazir_sayisi = servisler.filter(s => s.servis_durumu === 'teslime_hazir').length;
const teslim_edildi_sayisi = servisler.filter(s => s.servis_durumu === 'teslim_edildi').length;
const garantide_sayisi = servisler.filter(s => s.servis_durumu === 'garantide').length;

document.getElementById('beklemede_sayisi').textContent = beklemede_sayisi;
document.getElementById('teslime_hazir_sayisi').textContent = teslime_hazir_sayisi;
document.getElementById('teslim_edildi_sayisi').textContent = teslim_edildi_sayisi;
document.getElementById('garantide_sayisi').textContent = garantide_sayisi;
}

//yeni servis kaydı ekler
const yeni_servis_kaydet = (event) => {
event.preventDefault();

const musteri_adi = document.getElementById('musteri_adi').value;
const musteri_telefon = document.getElementById('musteri_telefon').value;
const cihaz_marka_model = document.getElementById('cihaz_marka_model').value;
const ariza_sikayet = document.getElementById('ariza_sikayet').value;
const servis_durumu = document.getElementById('servis_durumu').value;
const tarih = new Date().toISOString();

const yeni_servis = {
    id: yardimci_fonksiyonlar.id_olustur('SRV'),
    musteri_adi,
    musteri_telefon,
    cihaz_marka_model,
    ariza_sikayet,
    servis_durumu,
    tarih
};

const servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
servisler.push(yeni_servis);
localStorage.setItem('servisler', JSON.stringify(servisler));

alert('Servis kaydı başarıyla oluşturuldu!');
event.target.reset();
servis_kayitlarini_yukle();
son_servisleri_yukle();
teslim_durumu_yukle();
servis_durum_sayilarini_guncelle();

document.querySelector('[data-page="dashboard"]').click();
};

// servis detaylarını gösterir
const servis_goruntule = (id) => {
    const servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
    const servis = servisler.find(s => s.id === id);
    if (servis) {
        alert(`Servis Detayları:\nID: ${servis.id}\nMüşteri: ${servis.musteri_adi}\nCihaz: ${servis.cihaz_marka_model}\nArıza: ${servis.ariza_sikayet}\nDurum: ${servis_durumu_formatla(servis.servis_durumu)}\nTarih: ${yardimci_fonksiyonlar.tarih_formatla(servis.tarih)}`);
    } else {
        alert('Servis kaydı bulunamadı.');
    }
};

// servis düzenleme menüsünü açar
const servis_duzenle = (id) => {
const servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
const servis_index = servisler.findIndex(s => s.id === id);

if (servis_index === -1) {
    alert('Servis kaydı bulunamadı.');
    return;
}

const servis = servisler[servis_index];

const form = `
<form id="servis_duzenleme_formu">
    <div class="mb-3">
        <label class="form-label">Müşteri Adı</label>
        <input type="text" class="form-control" id="duzenlenmis_musteri_adi" value="${servis.musteri_adi}" required>
    </div>
    <div class="mb-3">
        <label class="form-label">Telefon</label>
        <input type="tel" class="form-control" id="duzenlenmis_musteri_telefon" value="${servis.musteri_telefon}" required>
    </div>
    <div class="mb-3">
        <label class="form-label">Cihaz Marka/Model</label>
        <input type="text" class="form-control" id="duzenlenmis_cihaz_marka_model" value="${servis.cihaz_marka_model}" required>
                </div>
    <div class="mb-3">
        <label class="form-label">Arıza/Şikayet</label>
        <textarea class="form-control" id="duzenlenmis_ariza_sikayet" rows="3" required>${servis.ariza_sikayet}</textarea>
    </div>
    <div class="mb-3">
        <label class="form-label">Servis Durumu</label>
        <select class="form-select" id="duzenlenmis_servis_durumu" required>
            <option value="beklemede" ${servis.servis_durumu === 'beklemede' ? 'selected' : ''}>Beklemede</option>
            <option value="teslime_hazir" ${servis.servis_durumu === 'teslime_hazir' ? 'selected' : ''}>Teslime Hazır</option>
            <option value="teslim_edildi" ${servis.servis_durumu === 'teslim_edildi' ? 'selected' : ''}>Teslim Edildi</option>
            <option value="garantide" ${servis.servis_durumu === 'garantide' ? 'selected' : ''}>Garantide</option>
        </select>
    </div>
    <button type="button" class="btn btn-primary" onclick="servis_guncelle('${servis.id}')">Güncelle</button>
</form>
`;

document.getElementById('servisDuzenleModalBody').innerHTML = form;
const modal = new bootstrap.Modal(document.getElementById('servisDuzenleModal'));
modal.show();
};

// Servis kaydını günceller
const servis_guncelle = (id) => {
const servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
const servis_index = servisler.findIndex(s => s.id === id);

const duzenlenmis_musteri_adi = document.getElementById('duzenlenmis_musteri_adi').value;
const duzenlenmis_musteri_telefon = document.getElementById('duzenlenmis_musteri_telefon').value;
const duzenlenmis_cihaz_marka_model = document.getElementById('duzenlenmis_cihaz_marka_model').value;
const duzenlenmis_ariza_sikayet = document.getElementById('duzenlenmis_ariza_sikayet').value;
const duzenlenmis_servis_durumu = document.getElementById('duzenlenmis_servis_durumu').value;

servisler[servis_index] = {
...servisler[servis_index],
musteri_adi: duzenlenmis_musteri_adi,
musteri_telefon: duzenlenmis_musteri_telefon,
cihaz_marka_model: duzenlenmis_cihaz_marka_model,
ariza_sikayet: duzenlenmis_ariza_sikayet,
servis_durumu: duzenlenmis_servis_durumu,
};

localStorage.setItem('servisler', JSON.stringify(servisler));
servis_kayitlarini_yukle();
son_servisleri_yukle();
teslim_durumu_yukle();
servis_durum_sayilarini_guncelle();

const modal = bootstrap.Modal.getInstance(document.getElementById('servisDuzenleModal'));
modal.hide();

alert('Servis kaydı güncellendi!');
};

// onaydan sonra servis kaydını siler
const servis_sil = (id) => {
    if (confirm('Bu servis kaydını silmek istediğinizden emin misiniz?')) {
        let servisler = JSON.parse(localStorage.getItem('servisler') || '[]');
        servisler = servisler.filter(s => s.id !== id);
        localStorage.setItem('servisler', JSON.stringify(servisler));
        servis_kayitlarini_yukle();
        son_servisleri_yukle();
        teslim_durumu_yukle();
        servis_durum_sayilarini_guncelle();
        alert('Servis kaydı silindi!');
    }
};

// UI iyileşmesi için çevirme.
const servis_durumu_formatla = (durum) => {
    switch (durum) {
case 'beklemede': return 'Beklemede';
case 'incelemede': return 'İncelemede';
case 'tamir_edildi': return 'Tamir Edildi';
case 'teslime_hazir': return 'Teslime Hazır';
case 'teslim_edildi': return 'Teslim Edildi';
case 'garantide': return 'Garantide';
default: return durum.charAt(0).toUpperCase() + durum.slice(1).replace(/_/g, ' ');
}
};


const servis_listesi_goster = (durum) => {
    document.querySelector('[data-page="servis_kayitlari"]').click();
};


const tum_servisleri_goster = () => {
    document.querySelector('[data-page="servis_kayitlari"]').click();
};


let faturalar = JSON.parse(localStorage.getItem('faturalar') || '[]');

// alert'te soru sorarak fatura oluşturtturur
const yeni_fatura_olustur = () => {
const musteri = prompt("Müşteri adını girin:");
const tutar = parseFloat(prompt("Fatura tutarını girin:"));

const yeni_fatura = {
id: yardimci_fonksiyonlar.id_olustur('FAT'),
musteri: musteri,
tarih: new Date().toISOString(),
tutar: tutar,
durum: 'Ödenmedi'
};
faturalar.push(yeni_fatura);
localStorage.setItem('faturalar', JSON.stringify(faturalar));
fatura_tablosunu_guncelle();

};

// faturaları dışa aktarır.
const fatura_disa_aktar = () => {
const csv_icerik = "Fatura No,Müşteri,Tarih,Tutar,Durum\n" +
    faturalar.map(f => `${f.id},${f.musteri},${f.tarih.toLocaleDateString()},${f.tutar},${f.durum}`).join("\n");

const blob = new Blob([csv_icerik], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement("a");
const url = URL.createObjectURL(blob);
link.setAttribute("href", url);
link.setAttribute("download", "faturalar.csv");
link.style.visibility = 'hidden';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

};

// fatura tablosunu veriler ile doldurur.
const fatura_tablosunu_guncelle = () => {
const faturalar = JSON.parse(localStorage.getItem('faturalar') || '[]'); 
const tbody = document.getElementById('fatura_tablosu');
if (!tbody) return;

tbody.innerHTML = faturalar.map(fatura => `
<tr>
    <td>${fatura.id}</td>
    <td>${fatura.musteri}</td>
    <td>${yardimci_fonksiyonlar.tarih_formatla(fatura.tarih)}</td>
    <td>${yardimci_fonksiyonlar.para_formatla(fatura.tutar)}</td>
    <td>${fatura.durum}</td>
    <td>
        <button class="btn btn-sm btn-info" onclick="fatura_goruntule('${fatura.id}')">
            <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-warning" onclick="fatura_duzenle('${fatura.id}')">
            <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="fatura_sil('${fatura.id}')">
            <i class="fas fa-trash"></i>
        </button>
    </td>
</tr>
`).join('');
};

// fatura detaylarını gösterir
const fatura_goruntule = (id) => {
const fatura = faturalar.find(f => f.id === id);
if (fatura) {
alert(`Fatura Detayları :
Fatura No : ${fatura.id}
Müşteri : ${fatura.musteri}
Tarih : ${yardimci_fonksiyonlar.tarih_formatla(fatura.tarih)}
Tutar : ${yardimci_fonksiyonlar.para_formatla(fatura.tutar)}
Durum : ${fatura.durum}`);
} else {
alert('Fatura bulunamadı.');
}
};

// fatura düzenleme menüsünü açar
const fatura_duzenle = (id) => {
const faturalar = JSON.parse(localStorage.getItem('faturalar') || '[]');
const fatura_index = faturalar.findIndex(f => f.id === id);

if (fatura_index === -1) {
alert('Fatura bulunamadı.');
return;
}

const fatura = faturalar[fatura_index];

const form = `
<form id="fatura_duzenleme_formu">
<div class="mb-3">
    <label class="form-label">Müşteri Adı</label>
    <input type="text" class="form-control" id="duzenlenmis_musteri" value="${fatura.musteri}" required>
</div>
<div class="mb-3">
    <label class="form-label">Fatura Tutarı</label>
    <input type="number" step="0.01" class="form-control" id="duzenlenmis_tutar" value="${fatura.tutar}" required>
</div>
<div class="mb-3">
    <label class="form-label">Fatura Durumu</label>
    <select class="form-select" id="duzenlenmis_durum" required>
        <option value="Ödendi" ${fatura.durum === 'Ödendi' ? 'selected' : ''}>Ödendi</option>
        <option value="Ödenmedi" ${fatura.durum === 'Ödenmedi' ? 'selected' : ''}>Ödenmedi</option>
    </select>
</div>
<button type="button" class="btn btn-primary" onclick="fatura_guncelle('${fatura.id}')">Güncelle</button>
</form>
`;

document.getElementById('faturaDuzenleModalBody').innerHTML = form;
const modal = new bootstrap.Modal(document.getElementById('faturaDuzenleModal'));
modal.show();
};

// Düzenlenen faturayı kaydet ve tablosunu güncelle
const fatura_guncelle = (id) => {
const faturalar = JSON.parse(localStorage.getItem('faturalar') || '[]');
const fatura_index = faturalar.findIndex(f => f.id === id);

if (fatura_index === -1) {
alert('Fatura bulunamadı.');
return;
}

const duzenlenmis_musteri = document.getElementById('duzenlenmis_musteri').value;
const duzenlenmis_tutar = parseFloat(document.getElementById('duzenlenmis_tutar').value);
const duzenlenmis_durum = document.getElementById('duzenlenmis_durum').value;

faturalar[fatura_index] = {
...faturalar[fatura_index],
musteri: duzenlenmis_musteri,
tutar: duzenlenmis_tutar,
durum: duzenlenmis_durum,
};

localStorage.setItem('faturalar', JSON.stringify(faturalar));
fatura_tablosunu_guncelle();

const modal = bootstrap.Modal.getInstance(document.getElementById('faturaDuzenleModal'));
modal.hide();

alert('Fatura güncellendi!');

};

// Faturayı onay sonrası siler
const fatura_sil = (id) => {
if (confirm('Faturayı silmek istediğinize emin misiniz?')) {
const index = faturalar.findIndex(f => f.id === id);
if (index !== -1) {
    faturalar.splice(index, 1);
    localStorage.setItem('faturalar', JSON.stringify(faturalar));
    fatura_tablosunu_guncelle();
    
}
}
};

// Yardımcı fonksiyonlar paketi
const yardimci_fonksiyonlar = {
id_olustur: (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

tarih_formatla: (tarih) => {
  const tarihObj = new Date(tarih);
  if (isNaN(tarihObj.getTime())) {
    return 'Geçersiz Tarih';
  }
  return tarihObj.toLocaleDateString('tr-TR');
},

para_formatla: (miktar) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(miktar)
};

// SMS karakter sayacını günceller
document.getElementById('mesaj').addEventListener('input', function() {
let karakterSayisi = this.value.length;
document.getElementById('karakterSayaci').textContent = karakterSayisi;

if (karakterSayisi > 160) {
document.getElementById('karakterSayaci').classList.add('text-danger');
} else {
document.getElementById('karakterSayaci').classList.remove('text-danger');
}
});

// Hazır SMS şablonları
const smsTemplates = {
servis_tamamlandi: "Sayın Müşterimiz, için servis işleminiz tamamlanmıştır. Cihazınızı teslim alabilirsiniz.",
randevu_hatirlatma: "Sayın Müşterimiz, cihazınız için yarın saat 14:00'de servis randevunuz bulunmaktadır. Bilgilerinize sunarız.",
fiyat_onayi: "Sayın Müşterimiz, cihazınızda tespit edilen Arıza için tamir ücreti 850 TL olarak belirlenmiştir. Onayınız halinde işleme başlanacaktır."
};

// Seçilen SMS şablonunu yükler
function sablonYukle() {
const secilenSablon = document.getElementById('sablonSecin').value;

if (secilenSablon && smsTemplates[secilenSablon]) {
let mesajMetni = smsTemplates[secilenSablon];
document.getElementById('mesaj').value = mesajMetni;
document.getElementById('karakterSayaci').textContent = mesajMetni.length;
}
}

// SMS formunu sıfırlar
function mesajTemizle() {
document.getElementById('telefonNumarasi').value = "";
document.getElementById('mesaj').value = "";
document.getElementById('sablonSecin').value = "";
document.getElementById('karakterSayaci').textContent = "0";
document.getElementById('servisKadiEkle').checked = false;
}

// SMS gönderme işlemi
function smsGonder() {
const telefonNumarasi = document.getElementById('telefonNumarasi').value;
const mesaj = document.getElementById('mesaj').value;

if (!telefonNumarasi || !mesaj) {
alert("Lütfen telefon numarası ve mesaj alanlarını doldurunuz.");
return;
}

//gerçek verileri getir
let gonderilecekMesaj = mesaj;
for (const [key, value] of Object.entries(musteriVerileri)) {
gonderilecekMesaj = gonderilecekMesaj.replace(new RegExp(`{${key}}`, 'g'), value);
}


smsGecmisineEkle(telefonNumarasi, gonderilecekMesaj);
alert("SMS başarıyla gönderildi!");

if (document.getElementById('servisKadiEkle').checked) {

}

mesajTemizle();
}

//localStorage ekleme işlemi
function smsGecmisineEkle(telefon, mesaj) {
const smsGecmisiTablosu = document.getElementById('sms_gecmisi');

//tarih al
const simdi = new Date();
const tarihSaat = `${simdi.getDate()}.${simdi.getMonth() + 1}.${simdi.getFullYear()} ${simdi.getHours()}:${simdi.getMinutes()}`;

//innerhtml ile yeni satır ekle
const yeniSatir = document.createElement('tr');
yeniSatir.innerHTML = `
<td>${tarihSaat}</td>
<td>${telefon}</td>
<td>${mesaj.length > 30 ? mesaj.substring(0, 30) + '...' : mesaj}</td>
<td><span class="badge bg-success">İletildi</span></td>
`;

smsGecmisiTablosu.insertBefore(yeniSatir, smsGecmisiTablosu.firstChild);

//sms gecmisini tabloda listele
let smsGecmisi = JSON.parse(localStorage.getItem('smsGecmisi')) || [];
smsGecmisi.push({ tarihSaat, telefon, mesaj });
localStorage.setItem('smsGecmisi', JSON.stringify(smsGecmisi));
}

//sayfa yüklendiğinde sms geçmişini yükletme.
document.addEventListener('DOMContentLoaded', function() {
const smsGecmisi = JSON.parse(localStorage.getItem('smsGecmisi')) || [];
const smsGecmisiTablosu = document.getElementById('sms_gecmisi');

smsGecmisi.forEach(({ tarihSaat, telefon, mesaj }) => {
const yeniSatir = document.createElement('tr');
yeniSatir.innerHTML = `
    <td>${tarihSaat}</td>
    <td>${telefon}</td>
    <td>${mesaj.length > 30 ? mesaj.substring(0, 30) + '...' : mesaj}</td>
    <td><span class="badge bg-success">İletildi</span></td>
`;
smsGecmisiTablosu.insertBefore(yeniSatir, smsGecmisiTablosu.firstChild);
});
});
// sayfa yüklendikten sonra gelecek methodlar.
window.onload = () => {
sayfa_yonlendirme();
sayfa_icerigi_yukle('dashboard');
fatura_tablosunu_guncelle();

};
