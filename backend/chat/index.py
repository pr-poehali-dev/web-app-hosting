"""
Чат: получение и отправка сообщений по каналам.
?action=messages&channel=chat&limit=50&before_id=N  — GET последних сообщений
?action=send                                         — POST отправить сообщение
?action=hide&id=N                                   — POST скрыть сообщение (admin/owner)
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p91355423_web_app_hosting")

def get_channel_settings(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT channel_id, is_enabled, is_readonly FROM chat_settings")
        rows = cur.fetchall()
    allowed = {r[0] for r in rows if r[1]}
    readonly = {r[0] for r in rows if r[1] and r[2]}
    return allowed, readonly

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def get_user_by_token(conn, token):
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT u.id, u.nickname, u.role, u.is_blocked
            FROM {SCHEMA}.users u
            JOIN {SCHEMA}.sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "nickname": row[1], "role": row[2], "is_blocked": row[3]}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "messages")

    token = (event.get("headers") or {}).get("X-Auth-Token", "")

    conn = get_conn()
    try:
        user = get_user_by_token(conn, token) if token else None
        ALLOWED_CHANNELS, READONLY_CHANNELS = get_channel_settings(conn)

        # GET messages
        if action == "messages":
            channel = qs.get("channel", "chat")
            if channel not in ALLOWED_CHANNELS:
                return err("Неизвестный канал")
            limit = min(int(qs.get("limit", 50)), 100)
            before_id = qs.get("before_id")

            if not user:
                return err("Не авторизован", 401)
            if user["is_blocked"]:
                return err("Аккаунт заблокирован", 403)

            with conn.cursor() as cur:
                if before_id:
                    cur.execute(f"""
                        SELECT m.id, m.text, m.created_at, u.nickname, u.role
                        FROM {SCHEMA}.messages m
                        JOIN {SCHEMA}.users u ON m.user_id = u.id
                        WHERE m.channel = %s AND m.hidden = FALSE AND m.id < %s
                        ORDER BY m.created_at DESC
                        LIMIT %s
                    """, (channel, int(before_id), limit))
                else:
                    cur.execute(f"""
                        SELECT m.id, m.text, m.created_at, u.nickname, u.role
                        FROM {SCHEMA}.messages m
                        JOIN {SCHEMA}.users u ON m.user_id = u.id
                        WHERE m.channel = %s AND m.hidden = FALSE
                        ORDER BY m.created_at DESC
                        LIMIT %s
                    """, (channel, limit))
                rows = cur.fetchall()

            messages = [
                {"id": r[0], "text": r[1], "created_at": r[2].isoformat(), "nickname": r[3], "role": r[4]}
                for r in reversed(rows)
            ]
            return ok({"messages": messages, "channel": channel})

        # POST send
        if action == "send":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            if not user:
                return err("Не авторизован", 401)
            if user["is_blocked"]:
                return err("Аккаунт заблокирован", 403)

            body = {}
            if event.get("body"):
                body = json.loads(event["body"])

            channel = (body.get("channel") or "").strip()
            text = (body.get("text") or "").strip()

            if channel not in ALLOWED_CHANNELS:
                return err("Неизвестный канал")
            if not text:
                return err("Сообщение не может быть пустым")
            if len(text) > 4000:
                return err("Сообщение слишком длинное")

            if channel in READONLY_CHANNELS and user["role"] not in ("owner", "admin"):
                return err("В этом разделе могут писать только автор и администраторы", 403)

            with conn.cursor() as cur:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.messages (channel, user_id, text)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at
                """, (channel, user["id"], text))
                row = cur.fetchone()
                conn.commit()

            return ok({
                "id": row[0],
                "text": text,
                "created_at": row[1].isoformat(),
                "nickname": user["nickname"],
                "role": user["role"],
                "channel": channel,
            }, 201)

        # POST hide (admin/owner)
        if action == "hide":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            if not user:
                return err("Не авторизован", 401)
            if user["role"] not in ("owner", "admin"):
                return err("Нет прав", 403)

            msg_id = qs.get("id")
            if not msg_id:
                return err("Не указан id сообщения")

            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.messages SET hidden = TRUE WHERE id = %s", (int(msg_id),))
                conn.commit()
            return ok({"ok": True})

        return err("Неизвестное действие", 404)
    finally:
        conn.close()