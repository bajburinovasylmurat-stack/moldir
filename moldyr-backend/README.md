# Мөлдір Өлең — Full-stack сайт

Бұл жоба Express backend + JSON файлдық база (`lowdb`) + frontend сайттан тұрады.

## Іске қосу

```bash
cd /Users/asylmuratbaiburinov/Desktop/pp2_asyl/aitys/moldyr-backend
npm install
npm start
```

Сайт:

```text
http://localhost:3001/
```

API health:

```text
http://localhost:3001/api/health
```

## Админ панель

Сайттың жоғарғы менюінен `Админ` батырмасын басыңыз.

Әдепкі құпия сөз:

```text
admin2024
```

Админ панельде:

- айтыс датасын, уақытын, екі қарсылас өңірді қосу/өңдеу;
- афиша суретін файл ретінде жүктеу;
- айтыскерлер туралы ақпарат жазу;
- билет бағасын, жалпы 100 орын және қалған орынды басқару;
- әр айтысқа Kaspi төлем сілтемесін қою;
- билет чек жіберілетін WhatsApp нөмірін баптау;
- БАҚ бөліміне фото/видео және мәтін қосу;
- демеушілерді логотипімен қосу;
- дауыстарды көру және тазалау бар.

## Дерекқор

Деректер `moldyr-backend/moldyr.json` файлына сақталады. Бұл файл автоматты түрде жасалады.

## Маңызды: Kaspi төлемі

Сайт дауыс беру алдында Kaspi төлем сілтемесін ашады және 200 ₸ төлем flow-ын көрсетеді. Бірақ нақты төленген соманы автоматты тексеру үшін Kaspi ресми merchant/API интеграциясы қажет. Онсыз браузер немесе сервер Kaspi ішіндегі нақты соманы көре алмайды.

## Негізгі API

- `POST /api/auth/login`
- `GET /api/events`
- `POST /api/events` admin
- `PUT /api/events/:id` admin
- `DELETE /api/events/:id` admin
- `PATCH /api/events/:id/tickets` admin
- `POST /api/votes`
- `GET /api/votes` admin
- `GET /api/votes/:eventId`
- `GET/POST/DELETE /api/media`
- `GET/POST/DELETE /api/sponsors`
- `GET/PUT /api/settings`
