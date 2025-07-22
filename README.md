# 🤖 PUBLİC V14 DİSCORD BOT 


## 📋 Özellikler

### 🛡️ Koruma Sistemleri
- **Sunucu Koruması:** Yetkisiz sunucu değişikliklerini engeller
- **Rol Koruması:** Yetkisiz rol değişikliklerini ve silmeleri engeller
- **Kanal Koruması:** Kanalların yetkisiz değişikliklerini engeller
- **Emoji Koruması:** Yetkisiz emoji silme ve değişikliklerini engeller
- **Bot Koruması:** Yetkisiz bot eklemelerini engeller
- **URL Koruması:** Zararlı URL'leri filtreler ve engeller
- **Sticker Koruması:** Sunucu çıkartmalarını korur
- **Ban/Kick Koruması:** Yetkisiz ban ve kick işlemlerini engeller
- **Küfür Koruması:** Uygunsuz dil kullanımını filtreler
- **Reklam Koruması:** Yetkisiz reklamları engeller
- **Capslock Koruması:** Aşırı büyük harf kullanımını kontrol eder
- **Spam Koruması:** Mesaj spamını engeller
- **Web Koruması:** Web durumunu izler
- **Çevrimdışı Koruması:** Çevrimdışı durum değişikliklerini izler

### 👮 Moderasyon Özellikleri
- **Kayıt Sistemi:** Erkek/Kadın kayıt sistemi
- **Kayıtsız Sistemi:** Kayıtsız üye yönetimi
- **Hoşgeldin Sistemi:** Özelleştirilebilir hoşgeldin mesajları
- **Davet Sistemi:** Davet takip ve yönetimi
- **Ceza Sistemi:** Ban, kick, mute, jail gibi ceza sistemleri
- **Rol Sistemi:** Otomatik rol verme ve alma
- **Tag Sistemi:** Sunucu tagı yönetimi
- **Yaş Sistemi:** Hesap yaşı kontrolü
- **Şüpheli Hesap Sistemi:** Yeni hesapları tespit etme

### ⭐ Ek Özellikler
- **Whitelist Sistemi:** Güvenilir kullanıcılar için istisna sistemi
- **Özelleştirilebilir Limitler:** Her koruma özelliği için limit ayarları
- **Denetim Kaydı İzleme:** Tüm işlemlerin kaydını tutma
- **Otomatik Yedekleme:** Kanallar ve roller için otomatik yedekleme
- **Webhook Entegrasyonu:** Bildirimler için webhook desteği
- **MongoDB Veritabanı:** Tüm verilerin güvenli saklanması
- **Özel Komut Sistemi:** Sunucuya özel komutlar oluşturma
- **Komut İzin Sistemi:** Komutları belirli rollere özel yapma
- **Vampir Köylü Oyunu:** Sunucu içi eğlence oyunu
- **XP & Seviye Sistemi:** Kullanıcı aktivite takibi
- **Ekonomi Sistemi:** Coin ve günlük ödül sistemi
- **AFK Sistemi:** AFK durumu takibi
- **Ticket Sistemi:** Destek talep sistemi

## 🚀 Kurulum

### 1. Discord Bot Oluşturma

1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. "New Application" butonuna tıklayın
3. Botunuza bir isim verin ve "Create" butonuna tıklayın
4. Sol menüden "Bot" sekmesine gidin
5. "Add Bot" butonuna tıklayın
6. "Token" bölümünden botunuzun tokenını kopyalayın

### 2. Bot İzinleri

Bot Permissions bölümünden aşağıdaki izinleri seçin:
- Administrator (Önerilen - Tüm özellikler için)

Veya spesifik izinler:
- View Channels
- Send Messages
- Manage Messages
- Embed Links
- Attach Files
- Read Message History
- Use External Emojis
- Add Reactions
- Manage Channels
- Manage Roles
- Manage Server
- Kick Members
- Ban Members
- Manage Nicknames
- Mute Members
- View Audit Log

### 3. MongoDB Kurulumu

#### Seçenek A: MongoDB Atlas (Ücretsiz Cloud)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)'a gidin
2. Ücretsiz hesap oluşturun
3. Yeni cluster oluşturun
4. Database Access'ten kullanıcı oluşturun
5. Network Access'ten IP adresinizi ekleyin (0.0.0.0/0 herkese açık için)
6. Connection string'inizi kopyalayın

#### Seçenek B: Local MongoDB
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mongodb

# CentOS/RHEL
sudo yum install mongodb-org

# macOS
brew install mongodb-community
```

### 4. Replit'te Kurulum

1. Bu repository'yi Replit'te açın
2. Secrets bölümünden aşağıdaki değişkenleri ekleyin:

```
DISCORD_TOKEN=your_bot_token_here
MONGODB_URI=your_mongodb_connection_string_here
```

3. Run butonuna basarak botu başlatın

### 5. Local Kurulum

```bash
# Repository'yi klonlayın
git clone https://github.com/yourusername/discord-protection-bot.git
cd discord-protection-bot

# Bağımlılıkları yükleyin
npm install

# Environment dosyası oluşturun
cp .env.example .env

# .env dosyasını düzenleyin
DISCORD_TOKEN=your_bot_token_here
MONGODB_URI=mongodb://localhost:27017/discordbot

# Botu başlatın
node index.js
```

## 📝 Komutlar

### 🛡️ Koruma Komutları
```
!koruma aç <tür>        - Koruma sistemini açar
!koruma kapat <tür>     - Koruma sistemini kapatır  
!koruma limit <tür> <sayı> - Koruma limitini ayarlar
```

**Koruma Türleri:**
- `guild` - Sunucu koruması
- `role` - Rol koruması
- `channel` - Kanal koruması
- `emoji` - Emoji koruması
- `sticker` - Sticker koruması
- `bot` - Bot koruması
- `ban` - Ban koruması
- `kick` - Kick koruması
- `antiSwear` - Küfür koruması
- `antiSpam` - Spam koruması
- `antiCaps` - Caps koruması
- `antiAd` - Reklam koruması
- `antiUrl` - URL koruması

### 👮 Moderasyon Komutları
```
!ban @kullanıcı [sebep]     - Kullanıcıyı banlar
!kick @kullanıcı [sebep]    - Kullanıcıyı atar
!mute @kullanıcı [dakika] [sebep] - Kullanıcıyı susturur
!tempmute @kullanıcı <dakika> [sebep] - Geçici susturma
!unmute @kullanıcı          - Susturmayı kaldırır
!jail @kullanıcı            - Kullanıcıyı jail'e gönderir
!uyar @kullanıcı [sebep]    - Kullanıcıyı uyarır
!uyarılar [@kullanıcı]      - Uyarıları gösterir
!temizle <sayı>             - Mesajları temizler
!slowmode <saniye>          - Yavaş modu ayarlar
!lock                       - Kanalı kilitler
!unlock                     - Kanal kilidini açar
```

### 📋 Kayıt Komutları
```
!erkek @kullanıcı           - Erkek olarak kaydeder
!kadın @kullanıcı           - Kadın olarak kaydeder
```

### 🎮 Eğlence Komutları
```
!vampirköylü                - Vampir köylü oyunu başlatır
!anket <soru>               - Anket oluşturur
!çekiliş <dakika> <ödül>    - Çekiliş başlatır
```

### 📊 Bilgi Komutları
```
!stats                      - Sunucu istatistikleri
!seviye [@kullanıcı]        - Seviye bilgisi
!leaderboard                - XP sıralaması
!kullanıcı-bilgi [@kullanıcı] - Kullanıcı bilgileri
!sunucu-bilgi               - Sunucu bilgileri
!avatar [@kullanıcı]        - Avatar gösterir
```

### 💰 Ekonomi Komutları
```
!bakiye [@kullanıcı]        - Bakiye gösterir
!günlük                     - Günlük ödül alır
!transfer @kullanıcı <miktar> - Para transferi
```

### 📨 Davet Komutları
```
!davet bilgi @kullanıcı     - Davet bilgilerini gösterir
!davet sıfırla @kullanıcı   - Davet sayısını sıfırlar
!davet top                  - Davet sıralaması
```

### 🔒 Whitelist Komutları
```
!whitelist ekle @kullanıcı  - Whitelist'e ekler
!whitelist çıkar @kullanıcı - Whitelist'ten çıkarır
```

### 🏷️ Tag Komutları
```
!tag ayarla <tag>           - Sunucu tagını ayarlar
!tag kapat                  - Tag sistemini kapatır
```

### 🎭 Rol Komutları
```
!rol-ver @kullanıcı <rol>   - Rol verir
!rol-al @kullanıcı <rol>    - Rol alır
```

### 🎫 Ticket Komutları
```
!ticket-oluştur             - Destek talebi oluşturur
!ticket-kapat               - Ticket'ı kapatır
```

### 😴 AFK Komutları
```
!afk [sebep]                - AFK moduna geçer
```

## ⚙️ Ayarlar

### Bot Kurulumu Sonrası Ayarlar

1. **Roller Ayarlama:**
```
- Erkek rolü ID'si
- Kadın rolü ID'si  
- Kayıtsız rolü ID'si
- Susturulmuş rolü ID'si
- Jail rolü ID'si
```

2. **Kanallar Ayarlama:**
```
- Log kanalı ID'si
- Hoşgeldin kanalı ID'si
- Erkek kayıt kanalı ID'si
- Kadın kayıt kanalı ID'si
```

Bu ayarları veritabanında manuel olarak güncelleyebilir veya gelecekte eklenecek setup komutlarını kullanabilirsiniz.

## 🐛 Sorun Giderme

### Bot Çevrimiçi Değil
- Discord tokeninizi kontrol edin
- Bot izinlerini kontrol edin
- İnternet bağlantınızı kontrol edin

### Komutlar Çalışmıyor
- Botun mesaj okuma izninin olduğundan emin olun
- Komutları doğru yazdığınızdan emin olun
- Bot rolünün diğer rollerden üstte olduğundan emin olun

### Veritabanı Hatası
- MongoDB bağlantı string'inizi kontrol edin
- MongoDB servisinin çalıştığından emin olun
- Network erişiminin açık olduğundan emin olun

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Önce bu rehberi tekrar okuyun
2. Hata mesajlarını kontrol edin
3. GitHub Issues'tan destek isteyin

## 📄 Lisans

Bu proje GNU General Public  v3.0 lisansı altında lisanslanmıştır.

---

**Not:** Bu bot sürekli geliştirilmektedir. Yeni özellikler ve güncellemeler için **TAKİPTE KALIN**
