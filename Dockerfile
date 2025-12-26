FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5612

CMD ["gunicorn", "backend.app.debug_server:app", \
     "-b", "0.0.0.0:5612", \
     "--workers=1", "--threads=2", \
     "--timeout=60", "--graceful-timeout=30", "--keep-alive=5", \
     "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info"]
