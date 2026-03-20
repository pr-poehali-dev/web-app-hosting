"""
Подписки пользователей.
?action=status   — GET  — статус подписки текущего пользователя
?action=plans    — GET  — список тарифов
?action=request  — POST — отправить заявку на оплату (с base64 чеком)
?action=my_requests — GET — мои заявки на оплату
"""
import json
import os
import base64
import boto3
from datetime import datetime, timezone
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

PLANS = {
    "month":     {"label": "1 месяц",    "days": 30,  "price": 2900},
    "quarter":   {"label": "3 месяца",   "days": 90,  "price": 7500},
    "halfyear":  {"label": "6 месяцев",  "days": 180, "price": 13900},
    "year":      {"label": "1 год",      "days": 365, "price": 24900},
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_user(conn, token):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.nickname, u.email, u.role, u.is_blocked
            FROM users u JOIN sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "nickname": row[1], "email": row[2], "role": row[3], "is_blocked": row[4]}

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "status")
    token = (event.get("headers") or {}).get("X-Auth-Token", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    conn = get_conn()
    try:
        user = get_user(conn, token)
        if not user:
            return err("Не авторизован", 401)

        # GET /plans
        if action == "plans":
            return ok({"plans": [
                {"id": k, **v} for k, v in PLANS.items()
            ]})

        # GET /status — активная подписка
        if action == "status":
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, plan, status, started_at, expires_at
                    FROM subscriptions
                    WHERE user_id = %s AND status = 'active' AND expires_at > NOW()
                    ORDER BY expires_at DESC LIMIT 1
                """, (user["id"],))
                row = cur.fetchone()
            if not row:
                return ok({"subscription": None})
            return ok({"subscription": {
                "id": row[0], "plan": row[1], "status": row[2],
                "started_at": row[3], "expires_at": row[4],
                "plan_label": PLANS.get(row[1], {}).get("label", row[1]),
            }})

        # GET /my_requests
        if action == "my_requests":
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, plan, amount, status, receipt_url, comment, created_at
                    FROM payment_requests WHERE user_id = %s ORDER BY created_at DESC
                """, (user["id"],))
                rows = cur.fetchall()
            return ok({"requests": [
                {"id": r[0], "plan": r[1], "amount": r[2], "status": r[3],
                 "receipt_url": r[4], "comment": r[5], "created_at": r[6],
                 "plan_label": PLANS.get(r[1], {}).get("label", r[1])}
                for r in rows
            ]})

        # POST /request — подать заявку с чеком
        if action == "request":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            plan = body.get("plan")
            receipt_b64 = body.get("receipt_base64")
            receipt_mime = body.get("receipt_mime", "image/jpeg")

            if plan not in PLANS:
                return err("Неверный тариф")
            if not receipt_b64:
                return err("Загрузи чек об оплате")

            # Проверяем нет ли уже pending заявки
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM payment_requests WHERE user_id = %s AND status = 'pending'", (user["id"],))
                if cur.fetchone():
                    return err("У тебя уже есть заявка на рассмотрении")

            # Загружаем чек в S3
            try:
                file_data = base64.b64decode(receipt_b64)
                ext = "jpg" if "jpeg" in receipt_mime else receipt_mime.split("/")[-1]
                key = f"receipts/{user['id']}_{int(datetime.now(timezone.utc).timestamp())}.{ext}"
                s3 = get_s3()
                s3.put_object(Bucket="files", Key=key, Body=file_data, ContentType=receipt_mime)
                receipt_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            except Exception as e:
                return err(f"Ошибка загрузки чека: {str(e)}")

            amount = PLANS[plan]["price"]
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO payment_requests (user_id, plan, amount, receipt_url)
                    VALUES (%s, %s, %s, %s) RETURNING id
                """, (user["id"], plan, amount, receipt_url))
                req_id = cur.fetchone()[0]
                conn.commit()

            return ok({"ok": True, "request_id": req_id}, 201)

        return err("Неизвестное действие", 404)
    finally:
        conn.close()
