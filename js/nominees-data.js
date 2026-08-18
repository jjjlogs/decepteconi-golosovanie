// Номинации и варианты — статичные данные (раньше отдавались сервером через /api/categories)
const NOMINEES_DATA = [
  {
    "id": "deceptiking",
    "title": "Deceptiking",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "shaitan",
        "label": "Шайтан"
      },
      {
        "id": "makson",
        "label": "Максон"
      },
      {
        "id": "dcp",
        "label": "Дцп"
      },
      {
        "id": "yura",
        "label": "Юра"
      },
      {
        "id": "andro",
        "label": "Андро"
      },
      {
        "id": "lyoha",
        "label": "Лёха"
      },
      {
        "id": "zhabka",
        "label": "Жабка"
      },
      {
        "id": "ilya-pm",
        "label": "Илья пм"
      }
    ]
  },
  {
    "id": "deceptiqueen",
    "title": "Deceptiqueen",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "mushko",
        "label": "Мушо"
      },
      {
        "id": "entamblood",
        "label": "Entamblood"
      },
      {
        "id": "nasto",
        "label": "Насто"
      },
      {
        "id": "ryzhaya",
        "label": "Рыжая"
      }
    ]
  },
  {
    "id": "zavoz-arki",
    "title": "Завоз арки",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "andro-dasha",
        "label": "Андро съел бумажную Дашу"
      },
      {
        "id": "zhabka-golubi",
        "label": "Жабка ловит голубей"
      },
      {
        "id": "zhazhda-ph",
        "label": "Жажда Пх"
      },
      {
        "id": "serdca-za-lyubov",
        "label": "Сердца за любовь"
      },
      {
        "id": "larpceptikony",
        "label": "Larpсептиконы"
      },
      {
        "id": "monolog-shaitana",
        "label": "Монолог шайтана про копиум"
      }
    ]
  },
  {
    "id": "zavoznik-arki",
    "title": "Завозник арки",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "timur-king",
        "label": "Тимур кинг"
      },
      {
        "id": "andro",
        "label": "Андро"
      },
      {
        "id": "shaitan2",
        "label": "Шайтан"
      }
    ]
  },
  {
    "id": "igra-arki",
    "title": "Игра арки",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "dota2",
        "label": "Dota 2"
      },
      {
        "id": "shararam",
        "label": "Шарарам"
      },
      {
        "id": "roblox",
        "label": "Roblox"
      },
      {
        "id": "minecraft",
        "label": "Minecraft"
      }
    ]
  },
  {
    "id": "samyi-tupoi-arki",
    "title": "Самый тупой персонаж арки",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "dcp2",
        "label": "Дцп"
      },
      {
        "id": "yura2",
        "label": "Юра"
      },
      {
        "id": "masha-schetchikova",
        "label": "Маша счетчикова"
      },
      {
        "id": "senseji",
        "label": "Сенсеи"
      },
      {
        "id": "gabriel",
        "label": "Gabriel"
      }
    ]
  },
  {
    "id": "legenda-arki",
    "title": "Легенда арки",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "nasto2",
        "label": "Насто"
      },
      {
        "id": "zhabka2",
        "label": "Жабка"
      },
      {
        "id": "denchik",
        "label": "Денчик"
      },
      {
        "id": "ilya-pm2",
        "label": "Илья пм"
      },
      {
        "id": "vanya-uf",
        "label": "Ваня уф"
      }
    ]
  },
  {
    "id": "mem-arki",
    "title": "Мем арки",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "ab-eto-8",
        "label": "Аб это 8"
      },
      {
        "id": "kreslo-meshok",
        "label": "Кресло-мешок"
      },
      {
        "id": "afrodiziak",
        "label": "Афродизиак"
      },
      {
        "id": "timur-tc",
        "label": "Тимур кинг обосрался в тц"
      },
      {
        "id": "deda",
        "label": "@деда"
      },
      {
        "id": "esli-by-sestra",
        "label": "Если бы у меня была сестра…"
      },
      {
        "id": "dobroe-utro",
        "label": "Всем доброе утро и хорошего настроения"
      }
    ]
  },
  {
    "id": "duo-arki",
    "title": "Дуо арки",
    "subtitle": "",
    "allowCustom": true,
    "options": [
      {
        "id": "makson-shaitan",
        "label": "Максон и Шайтан"
      },
      {
        "id": "dcp-dasha",
        "label": "Дцп и Даша"
      },
      {
        "id": "andro-dcp",
        "label": "Андро и Дцп"
      },
      {
        "id": "andro-lyoha",
        "label": "Андро и Лёха"
      },
      {
        "id": "lyoha-denchik",
        "label": "Лёха и Денчик"
      },
      {
        "id": "mushko-shaitan",
        "label": "Мушо и Шайтан"
      },
      {
        "id": "dasha-yura",
        "label": "Даша и Юра"
      }
    ]
  }
];
