 Project Manager — Fullstack тестовое задание (Django + React)

Проект реализует систему управления задачами с Kanban-доской, ролями пользователей и real-time обновлениями через WebSocket.

Технологический стек

**Backend:**  
- Python 3.12 + Django 5 + DRF  
- PostgreSQL  
- Channels + Redis (WebSocket)  
- JWT аутентификация  
- Кэширование (Redis)  
- Сервисный слой (Service Layer pattern)  
- Alembic-style миграции через Django ORM

**Frontend:**  
- React + TypeScript + Vite  
- Redux Toolkit  
- Axios  
- TailwindCSS  
- WebSocket hooks  
- Responsive UI (Kanban board)



Основной функционал

- CRUD проектов и задач  
- Комментарии к задачам  
- Роли участников (Owner / Member / Viewer)  
- Kanban-доска с drag & drop  
- Поиск и фильтрация задач  
- Real-time обновления (комментарии, участники, задачи)  
- JWT аутентификация и refresh-токены  
- Кэширование статистики и детальных данных проекта  
- Swagger-документация API  
- Docker-compose для быстрого запуска


 Архитектура:

project-manager/
├── backend/
│ ├── api/
│ │ ├── models.py
│ │ ├── services.py
│ │ ├── permissions.py
│ │ ├── viewsets.py
│ │ ├── consumers.py
│ │ └── urls.py
│ ├── config/
│ │ ├── settings.py
│ │ ├── urls.py
│ │ └── asgi.py
│ └── manage.py
│
├── frontend/
│ ├── src/
│ │ ├── api/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── store/
│ │ └── types/
│ └── package.json
│
└── README.md

 Запуск проекта локально

Backend

bash comand:
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
Frontend
bash
Копировать код
cd frontend
npm install
npm run dev

test

bash comand
pytest -v
Тесты покрывают:

Модели (Project, Task, Comment)

Permissions

Services (ProjectService, TaskService)

ViewSets

WebSocket события
