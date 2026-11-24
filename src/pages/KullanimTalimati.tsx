export default function KullanimTalimati() {
  const abbreviations = [
    { short: "AR", long: "Arıza" },
    { short: "WO", long: "Work Order (İş Emri)" },
    { short: "WC", long: "Work Center (İş Merkezi)" },
    { short: "OEE", long: "Overall Equipment Effectiveness (Toplam Ekipman Verimliliği)" },
    { short: "SPC", long: "Statistical Process Control (İstatistiksel Proses Kontrol)" },
    { short: "KPI", long: "Key Performance Indicator (Anahtar Performans Göstergesi)" },
    { short: "HM", long: "Hammadde" },
    { short: "YM", long: "Yarı Mamul" },
    { short: "MM", long: "Mamul" },
    { short: "LOT", long: "Lot (Parti) Takibi" },
    { short: "SN", long: "Seri Numarası" },
    { short: "PPM", long: "Parts Per Million (Milyonda Parça)" },
    { short: "MTTR", long: "Mean Time To Repair (Ortalama Onarım Süresi)" },
  ];

  const Section = ({ title, children }: { title: string; children: any }) => (
    <div className="card p-4 space-y-2">
      <h2 className="font-semibold text-lg" style={{ color: "var(--accent)" }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kullanım Talimatı</h1>
      <p className="text-muted text-sm">MES-G arayüzü, modülleri ve kısaltmalar hakkında kapsamlı rehber.</p>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold text-lg" style={{ color: "var(--accent)" }}>Vizyon & Misyon</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Vizyon:</strong> Ford Otosan İmalat Yürütme Sistemleri (MES) yaklaşımıyla, otomotiv üretiminde dijital, izlenebilir ve veri odaklı bir üretim yönetimi kültürü oluşturmak; küçük ve orta ölçekli imalat işletmelerinin de büyük fabrikalar gibi verimli, kaliteli ve şeffaf çalışmasını sağlamak.</p>
          <p><strong>Misyon:</strong> Üretim emirlerinden makine performansına, kalite kontrolünden stok ve izlenebilirliğe kadar tüm süreçleri tek bir platformda toplamak; operatörlerin işini kolaylaştırmak, yöneticilere gerçek zamanlı ve doğru bilgi sunmak, israfı azaltmak ve sürekli iyileşmeyi desteklemek.</p>
          <p className="text-muted"><strong>Hazırlayan:</strong> Eymen Gülleroğlu</p>
        </div>
      </div>

      <Section title="1. Genel Bakış">
        <p className="text-sm">MES-G, küçük ve orta ölçekli imalat işletmeleri için üretim yürütme sistemidir (MES). Tüm veriler sentetik demodur; gerçek şirket verisi kullanılmaz. Sol menüden modüllere erişilir, her modülde veri eklenebilir, düzenlenebilir, silinebilir ve sıralanabilir.</p>
      </Section>

      <Section title="2. Giriş ve Tema">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Uygulama açılırken 4 saniyelik başlangıç logosu (splash) gösterilir.</li>
          <li>Sol üstteki tema butonu veya Ayarlar'dan açık/koyu tema seçilebilir; tercih tarayıcıda saklanır.</li>
          <li>Sistem renk tercihi (açık/koyu) otomatik algılanır.</li>
        </ul>
      </Section>

      <Section title="3. Sol Menü ve Navigasyon">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Sol menü gruplar halindedir: Üretim, Makine, Kalite, Stok, İzlenebilirlik, Raporlar, Yönetim.</li>
          <li>Grup başlıklarına tıklayarak alt modüller açılıp kapanır.</li>
          <li>Grup başlıkları hover'da parlar ve sağa kayar.</li>
          <li>Pano (Dashboard) en üstte yer alır.</li>
          <li>Sol menü bağımsız scroll eder; sağ içerik sabit kalır.</li>
        </ul>
      </Section>

      <Section title="4. Arama">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>MES-G logosunun yanında büyüteç ikonu ile global arama açılır.</li>
          <li>Yazdıkça tüm modüller ve kayıtlar filtrelenir (Google mantığı).</li>
          <li>Sonuçlara tıklayarak ilgili sayfaya gidilir.</li>
        </ul>
      </Section>

      <Section title="5. Pano (Dashboard) Özelleştirme">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Panoyu Düzenle</strong> ile düzenleme modu açılır.</li>
          <li>Widget'lar eklenebilir/çıkarılabilir (katalogdan).</li>
          <li>Yukarı/aşağı butonları ile yer değiştirme (sıralama).</li>
          <li>Her widget için boyut seçimi: Küçük / Orta / Büyük.</li>
          <li>Görünüm: Tablo veya Kart (modül sayfalarında).</li>
          <li>Düzen tarayıcıda saklanır (kalıcı).</li>
        </ul>
      </Section>

      <Section title="6. Modül Sayfaları (CRUD)">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Her modülde <strong>Yeni Kayıt</strong> ile form açılır; alanlar doldurulup <strong>Kaydet</strong> ile eklenir.</li>
          <li>Satırdaki <strong>kalem</strong> ikonu ile düzenleme, <strong>çöp kutusu</strong> ile silme (onay ile).</li>
          <li>Kolon başlıklarına tıklayarak artan/azalan sıralama.</li>
          <li>Durum filtreleri (İş Emirleri'nde) ile filtreleme.</li>
          <li><strong>Detay</strong> butonu ile tüm veriler popup'ta gösterilir; yüzde barları (ilerleme, OEE, verim) görüntülenir.</li>
          <li>Tablo ve Kart görünümü arasında geçiş yapılabilir.</li>
          <li>Tüm kayıtlar localStorage'a kalıcı olarak saklanır.</li>
        </ul>
      </Section>

      <Section title="7. Detay Popup">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Kayıt üzerinde "Detay" tıklayınca popup açılır.</li>
          <li>Tüm alanlar listelenir; durum/öncelik değerleri renkli badge olarak gösterilir.</li>
          <li>Yüzde değerler (ilerleme, OEE, verim) için renkli progress bar gösterilir.</li>
          <li>Popup dışına tıklayarak veya "Kapat" ile kapatılır.</li>
        </ul>
      </Section>

      <Section title="8. Kısaltmalar">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "var(--surface-2)" }}>
            <tr>
              <th className="text-left p-2">Kısaltma</th>
              <th className="text-left p-2">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {abbreviations.map((a) => (
              <tr key={a.short} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="p-2 font-bold" style={{ color: "var(--accent)" }}>{a.short}</td>
                <td className="p-2">{a.long}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="9. Veri ve Demo">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Sistem, örnek üretim senaryosu verileriyle başlar; tüm kayıtlar eklenebilir, düzenlenebilir ve silinebilir.</li>
          <li>İş Merkezleri, İş Emirleri ve Modül verileri tarayıcıda (localStorage) saklanır.</li>
          <li>Ayarlar → <strong>Verileri Sıfırla</strong> ile başlangıç senaryosuna dönülür.</li>
          <li>Renk skalası: yüzde/verim/OEE (yüksek daha iyi) ve duruş/fire/hata (düşük daha iyi) değerleri renkli gösterilir.</li>
        </ul>
      </Section>

      <Section title="10. Modüller">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Üretim:</strong> Siparişler, Ürünler, İş Emirleri, Üretim Girişi, Üretim Takibi</li>
          <li><strong>Makine:</strong> İş Merkezleri, Makine Listesi, Arıza Nedenleri, Bakım Planları, OEE, Duruş &amp; Fire</li>
          <li><strong>Kalite:</strong> Kontrol Parametreleri, Hata Türleri, SPC</li>
          <li><strong>Stok:</strong> Hammadde, Yarı Mamul, Mamul</li>
          <li><strong>İzlenebilirlik:</strong> Lot Takibi, Seri No Takibi</li>
          <li><strong>Raporlar:</strong> Üretim, Verimlilik, Arıza, Kalite</li>
          <li><strong>Yönetim:</strong> Kullanıcılar, Yetkiler, Sistem Ayarları, Kullanım Talimatı</li>
        </ul>
      </Section>
    </div>
  );
}