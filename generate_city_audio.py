

from gtts import gTTS
import os

if not os.path.exists('public'):
    os.makedirs('public')

city = {
    'building': {
        'en': 'building',
        'es': 'edificio',
        'pt': 'edifício',
        'cs': 'budova',
        'fr': 'bâtiment',
        'de': 'Gebäude',
        'ja': '建物',
        'ar': 'مبنى',  # mabna
    },
    'car': {
        'en': 'car',
        'es': 'coche',
        'pt': 'carro',
        'cs': 'auto',
        'fr': 'voiture',
        'de': 'Auto',
        'ja': '車',
        'ar': 'سيارة',  # sayyāra
    },
    'bus': {
        'en': 'bus',
        'es': 'autobús',
        'pt': 'ônibus',
        'cs': 'autobus',
        'fr': 'bus',
        'de': 'Bus',
        'ja': 'バス',
        'ar': 'حافلة',  # ḥāfila
    },
    'street': {
        'en': 'street',
        'es': 'calle',
        'pt': 'rua',
        'cs': 'ulice',
        'fr': 'rue',
        'de': 'Straße',
        'ja': '通り',
        'ar': 'شارع',  # shāriʿ
    },
    'park': {
        'en': 'park',
        'es': 'parque',
        'pt': 'parque',
        'cs': 'park',
        'fr': 'parc',
        'de': 'Park',
        'ja': '公園',
        'ar': 'حديقة',  # ḥadīqa
    },
    'bridge': {
        'en': 'bridge',
        'es': 'puente',
        'pt': 'ponte',
        'cs': 'most',
        'fr': 'pont',
        'de': 'Brücke',
        'ja': '橋',
        'ar': 'جسر',  # jisr
    },
    'traffic light': {
        'en': 'traffic light',
        'es': 'semáforo',
        'pt': 'sinal de trânsito',
        'cs': 'semafory',
        'fr': 'feu de circulation',
        'de': 'Ampel',
        'ja': '信号機',
        'ar': 'إشارة مرور',  # ishāra murūr
    },
    'hospital': {
        'en': 'hospital',
        'es': 'hospital',
        'pt': 'hospital',
        'cs': 'nemocnice',
        'fr': 'hôpital',
        'de': 'Krankenhaus',
        'ja': '病院',
        'ar': 'مستشفى',  # mustashfā
    },
    'school': {
        'en': 'school',
        'es': 'escuela',
        'pt': 'escola',
        'cs': 'škola',
        'fr': 'école',
        'de': 'Schule',
        'ja': '学校',
        'ar': 'مدرسة',  # madrasah
    },
    'store': {
        'en': 'store',
        'es': 'tienda',
        'pt': 'loja',
        'cs': 'obchod',
        'fr': 'magasin',
        'de': 'Geschäft',
        'ja': '店',
        'ar': 'متجر',  # matjar
    },
    'police station': {
        'en': 'police station',
        'es': 'comisaría',
        'pt': 'delegacia',
        'cs': 'policejní stanice',
        'fr': 'commissariat',
        'de': 'Polizeiwache',
        'ja': '警察署',
        'ar': 'مركز شرطة',  # markaz shurṭa
    },
    'fire station': {
        'en': 'fire station',
        'es': 'estación de bomberos',
        'pt': 'bombeiros',
        'cs': 'hasičská stanice',
        'fr': 'caserne de pompiers',
        'de': 'Feuerwache',
        'ja': '消防署',
        'ar': 'مركز إطفاء',  # markaz iṭfāʾ
    },
    'library': {
        'en': 'library',
        'es': 'biblioteca',
        'pt': 'biblioteca',
        'cs': 'knihovna',
        'fr': 'bibliothèque',
        'de': 'Bibliothek',
        'ja': '図書館',
        'ar': 'مكتبة',  # maktabah
    },
    'restaurant': {
        'en': 'restaurant',
        'es': 'restaurante',
        'pt': 'restaurante',
        'cs': 'restaurace',
        'fr': 'restaurant',
        'de': 'Restaurant',
        'ja': 'レストラン',
        'ar': 'مطعم',  # maṭʿam
    },
    'bank': {
        'en': 'bank',
        'es': 'banco',
        'pt': 'banco',
        'cs': 'banka',
        'fr': 'banque',
        'de': 'Bank',
        'ja': '銀行',
        'ar': 'بنك',  # bank
    },
    'house': {
        'en': 'house',
        'es': 'casa',
        'pt': 'casa',
        'cs': 'dům',
        'fr': 'maison',
        'de': 'Haus',
        'ja': '家',
        'ar': 'منزل',  # manzil
    },
    'castle': {
        'en': 'castle',
        'es': 'castillo',
        'pt': 'castelo',
        'cs': 'hrad',
        'fr': 'château',
        'de': 'Schloss',
        'ja': '城',
        'ar': 'قلعة',  # qalʿa
    },
    'train': {
        'en': 'train',
        'es': 'tren',
        'pt': 'trem',
        'cs': 'vlak',
        'fr': 'train',
        'de': 'Zug',
        'ja': '電車',
        'ar': 'قطار',  # qiṭār
    },
    'playground': {
        'en': 'playground',
        'es': 'parque infantil',
        'pt': 'parquinho',
        'cs': 'hřiště',
        'fr': 'terrain de jeu',
        'de': 'Spielplatz',
        'ja': '遊び場',
        'ar': 'ملعب',  # malʿab
    },
    'airplane': {
        'en': 'airplane',
        'es': 'avión',
        'pt': 'avião',
        'cs': 'letadlo',
        'fr': 'avion',
        'de': 'Flugzeug',
        'ja': '飛行機',
        'ar': 'طائرة',  # ṭāʾira
    },
    'taxi': {
        'en': 'taxi',
        'es': 'taxi',
        'pt': 'táxi',
        'cs': 'taxík',
        'fr': 'taxi',
        'de': 'Taxi',
        'ja': 'タクシー',
        'ar': 'تاكسي',  # tāksī
    },
    'subway': {
        'en': 'subway',
        'es': 'metro',
        'pt': 'metrô',
        'cs': 'metro',
        'fr': 'métro',
        'de': 'U-Bahn',
        'ja': '地下鉄',
        'ar': 'مترو',  # mitrū
    },
    'bicycle': {
        'en': 'bicycle',
        'es': 'bicicleta',
        'pt': 'bicicleta',
        'cs': 'kolo',
        'fr': 'vélo',
        'de': 'Fahrrad',
        'ja': '自転車',
        'ar': 'دراجة',  # darāja
    },
    'fountain': {
        'en': 'fountain',
        'es': 'fuente',
        'pt': 'fonte',
        'cs': 'fontána',
        'fr': 'fontaine',
        'de': 'Brunnen',
        'ja': '噴水',
        'ar': 'نافورة',  # nāfūra
    }
}


for english_word, translations in city.items():
    for lang_code, translated_word in translations.items():
        try:
            tts = gTTS(text=translated_word, lang=lang_code, slow=False)
            filename = f"public/{english_word}_{lang_code}.mp3"
            tts.save(filename)
            print(f"✅ Generated: {filename} ({english_word} in {lang_code} = '{translated_word}')")
        except Exception as e:
            print(f"❌ Failed to generate {english_word} in {lang_code}: {e}")

print("All audio files generated in the 'public' folder!")