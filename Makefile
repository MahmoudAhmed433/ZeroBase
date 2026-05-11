BACKEND_DIR=backend
FRONTEND_DIR=frontend

.PHONY: backend-setup backend-run backend-seed backend-reset frontend-setup frontend-run dev

backend-setup:
	cd $(BACKEND_DIR) && python -m pip install -r requirements.txt && python manage.py migrate

backend-seed:
	cd $(BACKEND_DIR) && python manage.py seed_demo

backend-reset:
	cd $(BACKEND_DIR) && rm -f db.sqlite3 && python manage.py migrate && python manage.py seed_demo

backend-run:
	cd $(BACKEND_DIR) && python manage.py runserver

frontend-setup:
	cd $(FRONTEND_DIR) && npm install

frontend-run:
	cd $(FRONTEND_DIR) && npm run dev

dev:
	@echo "Run backend and frontend in separate terminals:"
	@echo "make backend-run"
	@echo "make frontend-run"
