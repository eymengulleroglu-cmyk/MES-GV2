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
          <p><strong>Vizyon:</strong> Dijital, izlenebilir ve veri odaklı bir üretim yönetimi kültürü oluşturmak; küçük ve orta ölçekli imalat işletmelerinin de büyük fabrikalar gibi verimli, kaliteli ve şeffaf çalışmasını sağlamak.</p>
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

      <Section title="9. Veri, Senkronizasyon ve Demo">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Sistem, örnek üretim senaryosu verileriyle başlar; tüm kayıtlar eklenebilir, düzenlenebilir ve silinebilir.</li>
          <li>İş Merkezleri, İş Emirleri ve Modül verileri tarayıcıda (localStorage) saklanır.</li>
          <li>
            <strong>Bulut Senkronizasyonu (Ayarlar):</strong> Açıkken eklenen/düzenlenen/silinen her kayıt internette saklanır.
            Başka bir bilgisayardan aynı token ile giriş yapıldığında tüm veriler otomatik olarak görünür.
            Değişiklikler yaklaşık 8 saniyede bir buluta yazılır, 30 saniyede bir + pencere odaklanınca bulut okunur.
          </li>
          <li>
            <strong>Kurulum:</strong> GitHub'dan gist izinli bir token alınır (Ayarlar'daki bağlantı adım adım gösterir),
            her iki bilgisayarda da aynı token "Bağlan" ile girilir. Token yalnızca o tarayıcıda saklanır.
          </li>
          <li>Ayarlar → <strong>Verileri Sıfırla</strong> ile başlangıç senaryosuna dönülür (senkronizasyon ayarları korunur).</li>
          <li>Renk skalası: yüzde/verim/OEE (yüksek daha iyi) ve duruş/fire/hata (düşük daha iyi) değerleri renkli gösterilir.</li>
        </ul>
      </Section>

      <Section title="10. Modüller">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Üretim:</strong> Planlama, Siparişler, Ürünler, İş Emirleri, Üretim Girişi, Üretim Takibi, Vardiya Planı, Üretim Simülasyonu, Andon Panosu, Olay &amp; Alarm Merkezi</li>
          <li><strong>Makine:</strong> İş Merkezleri, Makine Listesi, Arıza Nedenleri, Bakım Planları, OEE, Duruş &amp; Fire</li>
          <li><strong>Kalite:</strong> Kontrol Parametreleri, Hata Türleri, SPC</li>
          <li><strong>Stok:</strong> Hammadde, Yarı Mamul, Mamul</li>
          <li><strong>İzlenebilirlik:</strong> Lot Takibi, Seri No Takibi, İzlenebilirlik Sorgu</li>
          <li><strong>Raporlar:</strong> Üretim, Verimlilik, Arıza, Kalite, Kayıp Analizi</li>
          <li><strong>Yönetim:</strong> Kullanıcılar, Müşteriler, Yetkiler, Alarm Kuralları, Sistem Ayarları, Kullanım Talimatı</li>
        </ul>
      </Section>

      <Section title="11. Üretim Simülasyonu (Üretime Başla)">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Pano → “Üretime Başla”</strong> düğmesi (veya Sol Menü → Üretim → Üretim Simülasyonu)
            fabrikayı normal üretim hızında canlıya alır; durdurulana kadar devam eder (1x/2x/4x hız).
          </li>
          <li>
            <strong>Tüm modüller bağlı:</strong> Ürünler, Siparişler, İş Emirleri, Üretim Girişi, Üretim Takibi,
            Makine Listesi, Arıza Nedenleri, Bakım Planları, OEE, Kontrol Parametreleri, Hata Türleri, SPC,
            Hammadde/Yarı Mamul/Mamul, Lot ve Seri No Takibi, 4 rapor, Kullanıcılar ve Yetkiler.
          </li>
          <li><strong>Stok akışı:</strong> Üretim hammaddeleri tüketir, yarı mamul biriktirir; emir tamamlanınca mamule dönüşür. Hammadde tükenirse üretim durur, sevkiyat gelince devam eder.</li>
          <li><strong>Siparişler:</strong> Mamul stoğu yeterli olunca sipariş otomatik olarak hazırlanır (Pano'da ve Siparişler sayfasında görünür).</li>
          <li><strong>Kalite:</strong> Rastgele ölçümler Kontrol Parametreleri limitlerine göre değerlendirilir; sınır dışı değer fire kaydı ve SPC kartı uyarısı üretir.</li>
          <li><strong>Bakım:</strong> Bakım Planları periyodu dolan makine planlı bakıma girer; arızadan farklı renkte gösterilir.</li>
          <li><strong>İzlenebilirlik:</strong> Emir bitince Lot ve Seri No kayıtları oluşturulur, kısa süre sonra kalite onayı alınır.</li>
          <li><strong>Raporlar:</strong> Üretim, Verimlilik, Arıza ve Kalite raporları İş Emirleri + Duruş &amp; Fire verisinden canlı hesaplanır.</li>
          <li>Tüm emirler tamamlanınca otomatik olarak yeni vardiya başlar (geçmiş stok/sipariş/lot kayıtları korunur).</li>
          <li>Bulut senkronizasyonu açıkken simülasyon kayıtları da diğer cihazlara aktarılır.</li>
        </ul>
      </Section>

      <Section title="12. Andon, Alarm, Planlama ve İzlenebilirlik (v1.5.0)">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Andon Panosu (Üretim → Andon Panosu):</strong> Fabrikanın canlı ekranı.
            Makine kartları yeşil (üretimde), sarı (boşta), kırmızı (duruş) renktedir; üzerinde iş emri,
            ilerleme ve OEE görünür. Üstte saat, aktif vardiya ve 5 KPI vardır. 2 saniyede bir tazelenir —
            büyük ekran/TV'ye koyup F11 ile tam ekran yapabilirsiniz.
          </li>
          <li>
            <strong>Olay &amp; Alarm Merkezi (Üretim → Olay &amp; Alarm Merkezi):</strong>
            Alarm Kuralları modülündeki eşikler canlı verilere karşı sürekli değerlendirilir.
            Aşan durumlar "Müdadele Bekleyenler" listesinde görünür; <strong>Onayla</strong> ile sessizleşir,
            <strong>Tümünü Onayla</strong> ile hepsi kapatılır. Onaylananlar sağdaki listede zaman damgasıyla durur.
            Sol menüde kırmızı rozet, onaylanmamış alarm sayısını gösterir.
          </li>
          <li>
            <strong>Alarm Kuralları (Yönetim → Alarm Kuralları):</strong> 6 hazır kural: düşük OEE, kritik hammadde
            stoğu, uzun süren arıza, SPC kartı uyarısı, vadesi geçmiş sipariş, yüksek fire oranı.
            Eşik, önem (Kritik/Uyarı/Bilgi) ve aktiflik düzenlenebilir; pasif kurallar değerlendirilmez.
          </li>
          <li>
            <strong>Üretim Planlama (Üretim → Planlama):</strong> Açık siparişler listelenir; termin riski
            (gecikti / 2 gün kaldı) rozetle gösterilir. <strong>İş Emri Oluştur</strong> ile sipariş doğrudan
            iş emrine dönüşür ve Üretim Takibi'ne planlı satır olarak yazılır. Makine önerisi aynı ürünün en çok
            üretildiği makinedir; altta tüm makinelerin yükü ve tahmini bitiş süresi gösterilir.
          </li>
          <li>
            <strong>Vardiya Planı (Üretim → Vardiya Planı):</strong> Vardiya tanımları (kod, ad, başlangıç, bitiş, günler).
            Andon ve Planlama aktif vardiyayı otomatik bulur; gece yarısını aşan aralıklar da desteklenir.
          </li>
          <li>
            <strong>Kayıp Analizi (Raporlar → Kayıp Analizi):</strong> Duruş ve fire için Pareto grafikleri —
            kırmızı sütunlar kümülatif %80'in içindeki nedenleri işaretler, yeşil çizgi kümülatif yüzdedir.
            Ayrıca OEE kayıp kırılımı (kullanılabilirlik/performance/kalite) ve kurallara dayalı otomatik öneriler bulunur.
          </li>
          <li>
            <strong>İzlenebilirlik Sorgu (İzlenebilirlik → İzlenebilirlik Sorgu):</strong> Lot No veya Seri No girin
            (datalist'ten seçim yapılabilir). Sonuç tek bir zincirde: hammadde → yarı mamul → iş emri/makine →
            operatör → kalite/SPC → duruşlar → mamul stok → ilişkili lot/SN → müşteri siparişi.
            İleri izleme (müşteriye doğru) ve geri izleme (hammaddeye doğru) aynı ekranda gösterilir.
          </li>
        </ul>
      </Section>
    </div>
  );
}