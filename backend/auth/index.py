"""
Авторизация: регистрация, вход, выход, получение профиля. v2
?action=register    — создать аккаунт (POST)
?action=login       — войти, получить токен (POST)
?action=logout      — выйти (POST)
?action=me          — получить данные текущего пользователя (GET)
?action=use_invite  — активировать инвайт для текущего пользователя (POST)
"""
import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data: dict, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def hash_password(password: str) -> str:
    salt = os.environ.get("PASSWORD_SALT", "tradeclub_salt_default")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def get_user_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.nickname, u.email, u.role, u.is_blocked
            FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "nickname": row[1], "email": row[2], "role": row[3], "is_blocked": row[4]}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "me")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    ip = ((event.get("requestContext") or {}).get("identity") or {}).get("sourceIp", "unknown")
    token = (event.get("headers") or {}).get("X-Auth-Token", "")

    conn = get_conn()
    try:
        # register
        if action == "register":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            nickname = (body.get("nickname") or "").strip()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            gdpr = body.get("gdpr_consent", False)
            invite_code = (body.get("invite_code") or "").strip()

            if not nickname or not email or not password:
                return err("Заполни все поля")
            if len(password) < 6:
                return err("Пароль минимум 6 символов")
            if not gdpr:
                return err("Необходимо согласие на обработку персональных данных")

            with conn.cursor() as cur:
                invite_id = None
                if invite_code:
                    cur.execute("SELECT id FROM invites WHERE code = %s AND expires_at > NOW() AND used_by IS NULL", (invite_code,))
                    inv = cur.fetchone()
                    if not inv:
                        return err("Invite-ссылка недействительна или истекла")
                    invite_id = inv[0]

                cur.execute("SELECT id FROM users WHERE email = %s OR nickname = %s", (email, nickname))
                if cur.fetchone():
                    return err("Email или никнейм уже используется")

                pw_hash = hash_password(password)
                cur.execute("""
                    INSERT INTO users (nickname, email, password_hash, role, gdpr_consent, gdpr_consent_at, gdpr_consent_ip, gdpr_policy_version)
                    VALUES (%s, %s, %s, 'subscriber', TRUE, NOW(), %s, 'v1.0')
                    RETURNING id, nickname, email, role
                """, (nickname, email, pw_hash, ip))
                user = cur.fetchone()
                user_id = user[0]

                cur.execute("""
                    INSERT INTO gdpr_consents (user_id, email, policy_version, ip_address, user_agent)
                    VALUES (%s, %s, 'v1.0', %s, %s)
                """, (user_id, email, ip, (event.get("headers") or {}).get("User-Agent", "")))

                if invite_id:
                    cur.execute("UPDATE invites SET used_by = %s, used_at = NOW() WHERE id = %s", (user_id, invite_id))

                tok = secrets.token_hex(32)
                expires = datetime.now(timezone.utc) + timedelta(days=30)
                cur.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user_id, tok, expires))
                conn.commit()

            return ok({"token": tok, "user": {"id": user[0], "nickname": user[1], "email": user[2], "role": user[3]}}, 201)

        # login
        if action == "login":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not email or not password:
                return err("Введи email и пароль")

            pw_hash = hash_password(password)
            with conn.cursor() as cur:
                cur.execute("SELECT id, nickname, email, role, is_blocked FROM users WHERE email = %s AND password_hash = %s", (email, pw_hash))
                user = cur.fetchone()

            if not user:
                return err("Неверный email или пароль", 401)
            if user[4]:
                return err("Аккаунт заблокирован", 403)

            tok = secrets.token_hex(32)
            expires = datetime.now(timezone.utc) + timedelta(days=30)
            with conn.cursor() as cur:
                cur.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user[0], tok, expires))
                conn.commit()

            return ok({"token": tok, "user": {"id": user[0], "nickname": user[1], "email": user[2], "role": user[3]}})

        # logout
        if action == "logout":
            if token:
                with conn.cursor() as cur:
                    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                    conn.commit()
            return ok({"ok": True})

        # me (default)
        if action == "me":
            if not token:
                return err("Не авторизован", 401)
            user = get_user_by_token(conn, token)
            if not user:
                return err("Сессия истекла", 401)
            return ok({"user": user})

        # change_password
        if action == "change_password":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            if not token:
                return err("Не авторизован", 401)
            user = get_user_by_token(conn, token)
            if not user:
                return err("Сессия истекла", 401)
            old_password = body.get("old_password") or ""
            new_password = body.get("new_password") or ""
            if not old_password or not new_password:
                return err("Заполни все поля")
            if len(new_password) < 6:
                return err("Новый пароль минимум 6 символов")
            old_hash = hash_password(old_password)
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE id = %s AND password_hash = %s", (user["id"], old_hash))
                if not cur.fetchone():
                    return err("Неверный текущий пароль", 400)
                new_hash = hash_password(new_password)
                cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user["id"]))
                conn.commit()
            return ok({"ok": True})

        # change_nickname
        if action == "change_nickname":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            if not token:
                return err("Не авторизован", 401)
            user = get_user_by_token(conn, token)
            if not user:
                return err("Сессия истекла", 401)
            new_nickname = (body.get("nickname") or "").strip()
            if not new_nickname:
                return err("Никнейм не может быть пустым")
            if len(new_nickname) < 2 or len(new_nickname) > 30:
                return err("Никнейм от 2 до 30 символов")
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE nickname = %s AND id != %s", (new_nickname, user["id"]))
                if cur.fetchone():
                    return err("Этот никнейм уже занят")
                cur.execute("UPDATE users SET nickname = %s WHERE id = %s", (new_nickname, user["id"]))
                conn.commit()
            return ok({"ok": True, "nickname": new_nickname})

        # use_invite — активировать инвайт для уже залогиненного пользователя
        if action == "use_invite":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            if not token:
                return err("Не авторизован", 401)
            user = get_user_by_token(conn, token)
            if not user:
                return err("Сессия истекла", 401)
            invite_code = (body.get("invite_code") or "").strip()
            if not invite_code:
                return err("Введи код приглашения")
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM invites
                    WHERE code = %s AND expires_at > NOW() AND used_by IS NULL
                """, (invite_code,))
                inv = cur.fetchone()
                if not inv:
                    return err("Код недействителен или уже использован")
                invite_id = inv[0]
                cur.execute("""
                    SELECT id FROM subscriptions
                    WHERE user_id = %s AND status = 'active' AND expires_at > NOW()
                """, (user["id"],))
                if cur.fetchone():
                    return err("У тебя уже есть активная подписка")
                expires = datetime.now(timezone.utc) + timedelta(days=30)
                cur.execute("""
                    INSERT INTO subscriptions (user_id, plan, status, expires_at)
                    VALUES (%s, 'invite', 'active', %s)
                """, (user["id"], expires))
                cur.execute("""
                    UPDATE invites SET used_by = %s, used_at = NOW() WHERE id = %s
                """, (user["id"], invite_id))
                conn.commit()
            return ok({"ok": True, "expires_at": expires})

        return err("Неизвестное действие", 404)
    finally:
        conn.close()