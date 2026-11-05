FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Download database if DB_DOWNLOAD_URL is provided
# Otherwise, bd_education.db must be present in backend/ (local dev)
ARG DB_DOWNLOAD_URL=""
RUN if [ -n "$DB_DOWNLOAD_URL" ]; then \
        echo "Downloading database from $DB_DOWNLOAD_URL..."; \
        python -c "import urllib.request; urllib.request.urlretrieve('$DB_DOWNLOAD_URL', '/app/bd_education.db')"; \
    fi

ENV DB_PATH=/app/bd_education.db

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]