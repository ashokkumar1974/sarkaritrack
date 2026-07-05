FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    gcc libpq-dev tesseract-ocr tesseract-ocr-hin \
    poppler-utils curl cron && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install chromium --with-deps
COPY . .
COPY crontab /etc/cron.d/sarkaritrack
RUN chmod 0644 /etc/cron.d/sarkaritrack && crontab /etc/cron.d/sarkaritrack
CMD ["cron", "-f"]
