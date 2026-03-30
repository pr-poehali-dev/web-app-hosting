"""
Панель администратора.
?action=users          — GET  — список всех пользователей
?action=user           — GET  — один пользователь (?user_id=)
?action=block          — POST — заблокировать/разблокировать
?action=payments       — GET  — заявки на оплату (pending по умолчанию, ?status=all)
?action=approve        — POST — подтвердить заявку (открывает подписку)
?action=reject         — POST — отклонить заявку
?action=grant          — POST — выдать подписку вручную
?action=delete_user    — POST — удалить пользователя
?action=invites        — GET  — список инвайтов
?action=create_invite  — POST — создать инвайт
?action=stats          — GET  — статистика
?action=gdpr_export    — GET  — выгрузка согласия (?user_id=)
?action=upload_receipt — POST — загрузить чек в S3, создать/обновить запись оплаты
?action=user_receipts  — GET  — история оплат пользователя (?user_id=)
?action=confirm_receipt — POST — сменить статус записи оплаты
?action=chat_settings  — GET  — список настроек чатов
?action=update_chat    — POST — обновить настройки одного чата
"""
import json
import os
import secrets
import base64
import mimetypes
from datetime import datetime, timedelta, timezone
import psycopg2
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

PLANS = {
    "week":     {"label": "1 неделя",  "days": 7},
    "month":    {"label": "1 месяц",   "days": 30},
    "quarter":  {"label": "3 месяца",  "days": 90},
    "halfyear": {"label": "Полгода",   "days": 180},
    "year":     {"label": "1 год",     "days": 365},
    "loyal":    {"label": "Постоянный", "days": 30},
    "invite":   {"label": "Приглашение", "days": 30},
    "custom":   {"label": "Особый",    "days": 30},
}

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_admin(conn, token):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.role FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW() AND u.role IN ('owner', 'admin')
        """, (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "role": row[1]}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "stats")
    token = (event.get("headers") or {}).get("X-Auth-Token", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    conn = get_conn()
    try:
        admin = get_admin(conn, token)
        if not admin:
            return err("Доступ запрещён", 403)

        # GET /stats
        if action == "stats":
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM users")
                total_users = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days'")
                new_users_30d = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND expires_at > NOW()")
                active_subs = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM payment_requests WHERE status = 'pending'")
                pending_payments = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM users WHERE is_blocked = TRUE")
                blocked = cur.fetchone()[0]
            return ok({
                "total_users": total_users,
                "new_users_30d": new_users_30d,
                "active_subscriptions": active_subs,
                "pending_payments": pending_payments,
                "blocked_users": blocked,
            })

        # GET /users
        if action == "users":
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.nickname, u.email, u.role, u.is_blocked, u.created_at,
                        s.plan, s.expires_at as sub_expires
                    FROM users u
                    LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active' AND s.expires_at > NOW()
                    ORDER BY u.created_at DESC
                """)
                rows = cur.fetchall()
            return ok({"users": [
                {"id": r[0], "nickname": r[1], "email": r[2], "role": r[3],
                 "is_blocked": r[4], "created_at": r[5],
                 "subscription": {"plan": r[6], "expires_at": r[7]} if r[6] else None}
                for r in rows
            ]})

        # GET /user?user_id=
        if action == "user":
            uid = qs.get("user_id")
            if not uid:
                return err("Укажи user_id")
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, nickname, email, role, is_blocked, gdpr_consent,
                           gdpr_consent_at, gdpr_consent_ip, gdpr_policy_version, created_at
                    FROM users WHERE id = %s
                """, (uid,))
                u = cur.fetchone()
                if not u:
                    return err("Пользователь не найден", 404)
                cur.execute("""
                    SELECT id, plan, status, started_at, expires_at FROM subscriptions
                    WHERE user_id = %s ORDER BY created_at DESC LIMIT 5
                """, (uid,))
                subs = cur.fetchall()
                cur.execute("""
                    SELECT id, plan, amount, status, receipt_url, comment, payment_date, created_at
                    FROM payment_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 20
                """, (uid,))
                payments = cur.fetchall()
                cur.execute("""
                    SELECT consented_at, policy_version, ip_address
                    FROM gdpr_consents WHERE user_id = %s ORDER BY consented_at DESC LIMIT 1
                """, (uid,))
                consent_row = cur.fetchone()
            return ok({
                "user": {"id": u[0], "nickname": u[1], "email": u[2], "role": u[3],
                         "is_blocked": u[4], "gdpr_consent": u[5],
                         "gdpr_consent_at": u[6], "gdpr_consent_ip": u[7],
                         "gdpr_policy_version": u[8], "created_at": u[9]},
                "gdpr_consent_record": {"consented_at": consent_row[0], "policy_version": consent_row[1], "ip_address": consent_row[2]} if consent_row else None,
                "subscriptions": [{"id": s[0], "plan": s[1], "status": s[2], "started_at": s[3], "expires_at": s[4]} for s in subs],
                "payment_requests": [{"id": p[0], "plan": p[1], "amount": p[2], "status": p[3], "receipt_url": p[4], "comment": p[5], "payment_date": p[6], "created_at": p[7]} for p in payments],
            })

        # POST /block
        if action == "block":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            uid = body.get("user_id")
            blocked = body.get("blocked", True)
            if not uid:
                return err("Укажи user_id")
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET is_blocked = %s WHERE id = %s AND role = 'subscriber'", (blocked, uid))
                conn.commit()
            return ok({"ok": True})

        # GET /payments
        if action == "payments":
            status_filter = qs.get("status", "pending")
            sql = """
                SELECT pr.id, pr.user_id, u.nickname, u.email, pr.plan, pr.amount,
                       pr.status, pr.receipt_url, pr.comment, pr.created_at
                FROM payment_requests pr JOIN users u ON u.id = pr.user_id
            """
            if status_filter != "all":
                sql += " WHERE pr.status = '" + status_filter + "'"
            sql += " ORDER BY pr.created_at DESC LIMIT 100"
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
            return ok({"payments": [
                {"id": r[0], "user_id": r[1], "nickname": r[2], "email": r[3],
                 "plan": r[4], "amount": r[5], "status": r[6],
                 "receipt_url": r[7], "comment": r[8], "created_at": r[9],
                 "plan_label": PLANS.get(r[4], {}).get("label", r[4])}
                for r in rows
            ]})

        # POST /approve
        if action == "approve":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            req_id = body.get("request_id")
            if not req_id:
                return err("Укажи request_id")
            with conn.cursor() as cur:
                cur.execute("SELECT user_id, plan FROM payment_requests WHERE id = %s AND status = 'pending'", (req_id,))
                req = cur.fetchone()
                if not req:
                    return err("Заявка не найдена или уже обработана", 404)
                user_id, plan = req
                days = PLANS.get(plan, {}).get("days", 30)
                expires = datetime.now(timezone.utc) + timedelta(days=days)
                cur.execute("""
                    INSERT INTO subscriptions (user_id, plan, status, expires_at, created_by)
                    VALUES (%s, %s, 'active', %s, %s)
                """, (user_id, plan, expires, admin["id"]))
                cur.execute("""
                    UPDATE payment_requests SET status = 'approved', reviewed_by = %s, reviewed_at = NOW()
                    WHERE id = %s
                """, (admin["id"], req_id))
                conn.commit()
            return ok({"ok": True, "expires_at": expires})

        # POST /reject
        if action == "reject":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            req_id = body.get("request_id")
            comment = body.get("comment", "")
            if not req_id:
                return err("Укажи request_id")
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE payment_requests SET status = 'rejected', comment = %s,
                    reviewed_by = %s, reviewed_at = NOW() WHERE id = %s AND status = 'pending'
                """, (comment, admin["id"], req_id))
                conn.commit()
            return ok({"ok": True})

        # POST /grant — выдать подписку вручную
        if action == "grant":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            uid = body.get("user_id")
            plan = body.get("plan", "month")
            days = body.get("days")
            expires_at_str = body.get("expires_at")
            is_invite = bool(body.get("is_invite", False))
            if not uid:
                return err("Укажи user_id")
            if expires_at_str:
                try:
                    expires = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                    if expires.tzinfo is None:
                        expires = expires.replace(tzinfo=timezone.utc)
                except Exception:
                    return err("Неверный формат даты expires_at (ISO 8601)")
            else:
                d = days if days else PLANS.get(plan, {}).get("days", 30)
                expires = datetime.now(timezone.utc) + timedelta(days=int(d))
            actual_plan = "invite" if is_invite else plan
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO subscriptions (user_id, plan, status, expires_at, created_by)
                    VALUES (%s, %s, 'active', %s, %s)
                """, (uid, actual_plan, expires, admin["id"]))
                conn.commit()
            return ok({"ok": True, "expires_at": expires, "plan": actual_plan})

        # POST /delete_user — удалить пользователя
        if action == "delete_user":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            uid = body.get("user_id")
            if not uid:
                return err("Укажи user_id")
            with conn.cursor() as cur:
                cur.execute("SELECT role FROM users WHERE id = %s", (uid,))
                row = cur.fetchone()
                if not row:
                    return err("Пользователь не найден", 404)
                if row[0] == "owner":
                    return err("Нельзя удалить владельца", 403)
                cur.execute("DELETE FROM payment_requests WHERE user_id = %s", (uid,))
                cur.execute("DELETE FROM subscriptions WHERE user_id = %s", (uid,))
                cur.execute("DELETE FROM messages WHERE user_id = %s", (uid,))
                cur.execute("DELETE FROM sessions WHERE user_id = %s", (uid,))
                cur.execute("DELETE FROM users WHERE id = %s", (uid,))
                conn.commit()
            return ok({"ok": True})

        # GET /invites
        if action == "invites":
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT i.id, i.code, i.expires_at, i.used_at,
                           uc.nickname as created_by, uu.nickname as used_by
                    FROM invites i
                    LEFT JOIN users uc ON uc.id = i.created_by
                    LEFT JOIN users uu ON uu.id = i.used_by
                    ORDER BY i.created_at DESC LIMIT 100
                """)
                rows = cur.fetchall()
            return ok({"invites": [
                {"id": r[0], "code": r[1], "expires_at": r[2], "used_at": r[3],
                 "created_by": r[4], "used_by": r[5],
                 "is_used": r[3] is not None}
                for r in rows
            ]})

        # POST /create_invite
        if action == "create_invite":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            days = int(body.get("days", 7))
            code = secrets.token_urlsafe(16)
            expires = datetime.now(timezone.utc) + timedelta(days=days)
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO invites (code, created_by, expires_at)
                    VALUES (%s, %s, %s) RETURNING id
                """, (code, admin["id"], expires))
                inv_id = cur.fetchone()[0]
                conn.commit()
            return ok({"ok": True, "code": code, "expires_at": expires, "id": inv_id}, 201)

        # GET /gdpr_export?user_id=
        if action == "gdpr_export":
            uid = qs.get("user_id")
            if not uid:
                return err("Укажи user_id")
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, nickname, email, gdpr_consent, gdpr_consent_at, gdpr_consent_ip,
                           gdpr_policy_version, created_at
                    FROM users WHERE id = %s
                """, (uid,))
                u = cur.fetchone()
                if not u:
                    return err("Пользователь не найден", 404)
                cur.execute("""
                    SELECT id, consented_at, policy_version, ip_address
                    FROM gdpr_consents WHERE user_id = %s ORDER BY consented_at DESC
                """, (uid,))
                consents = cur.fetchall()
            return ok({
                "gdpr": {
                    "user_id": u[0], "nickname": u[1], "email": u[2],
                    "consent": u[3], "consent_at": u[4], "consent_ip": u[5],
                    "policy_version": u[6], "registered_at": u[7],
                },
                "consent_history": [
                    {"id": c[0], "consented_at": c[1], "policy_version": c[2], "ip_address": c[3]}
                    for c in consents
                ],
            })

        # POST /upload_receipt — загрузить чек об оплате (base64 изображение)
        if action == "upload_receipt":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            uid = body.get("user_id")
            plan = body.get("plan", "month")
            amount = body.get("amount")
            payment_date = body.get("payment_date")
            file_data = body.get("file_data")
            file_name = body.get("file_name", "receipt.jpg")
            if not uid or not file_data:
                return err("Укажи user_id и file_data")
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE id = %s", (uid,))
                if not cur.fetchone():
                    return err("Пользователь не найден", 404)
            raw = base64.b64decode(file_data)
            ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "jpg"
            content_type = mimetypes.guess_type(f"x.{ext}")[0] or "image/jpeg"
            key = f"receipts/{uid}/{secrets.token_hex(8)}.{ext}"
            s3 = get_s3()
            s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO payment_requests (user_id, plan, amount, status, receipt_url, payment_date)
                    VALUES (%s, %s, %s, 'pending', %s, %s) RETURNING id
                """, (uid, plan, amount or 0, cdn_url, payment_date))
                req_id = cur.fetchone()[0]
                conn.commit()
            return ok({"ok": True, "receipt_id": req_id, "receipt_url": cdn_url}, 201)

        # GET /user_receipts?user_id=
        if action == "user_receipts":
            uid = qs.get("user_id")
            if not uid:
                return err("Укажи user_id")
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT pr.id, pr.plan, pr.amount, pr.status, pr.receipt_url,
                           pr.comment, pr.payment_date, pr.created_at,
                           u.nickname as reviewed_by
                    FROM payment_requests pr
                    LEFT JOIN users u ON u.id = pr.reviewed_by
                    WHERE pr.user_id = %s
                    ORDER BY pr.created_at DESC
                """, (uid,))
                rows = cur.fetchall()
            return ok({"receipts": [
                {"id": r[0], "plan": r[1], "amount": r[2], "status": r[3],
                 "receipt_url": r[4], "comment": r[5], "payment_date": r[6],
                 "created_at": r[7], "reviewed_by": r[8],
                 "plan_label": PLANS.get(r[1], {}).get("label", r[1])}
                for r in rows
            ]})

        # POST /confirm_receipt — подтвердить или отклонить запись оплаты
        if action == "confirm_receipt":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            req_id = body.get("receipt_id")
            new_status = body.get("status")
            if not req_id or new_status not in ("pending", "confirmed", "rejected"):
                return err("Укажи receipt_id и status (pending|confirmed|rejected)")
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE payment_requests
                    SET status = %s, reviewed_by = %s, reviewed_at = NOW()
                    WHERE id = %s
                """, (new_status, admin["id"], req_id))
                conn.commit()
            return ok({"ok": True})

        # GET /chat_settings
        if action == "chat_settings":
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT channel_id, label, description, icon, is_enabled, is_readonly, sort_order
                    FROM chat_settings ORDER BY sort_order
                """)
                rows = cur.fetchall()
            return ok({"channels": [
                {"channel_id": r[0], "label": r[1], "description": r[2], "icon": r[3],
                 "is_enabled": r[4], "is_readonly": r[5], "sort_order": r[6]}
                for r in rows
            ]})

        # POST /update_chat
        if action == "update_chat":
            if method != "POST":
                return err("Метод не поддерживается", 405)
            channel_id = body.get("channel_id")
            if not channel_id:
                return err("Укажи channel_id")
            allowed_fields = {"label", "description", "icon", "is_enabled", "is_readonly", "sort_order"}
            updates = {k: v for k, v in body.items() if k in allowed_fields}
            if not updates:
                return err("Нет полей для обновления")
            set_parts = ", ".join(f"{k} = %s" for k in updates)
            values = list(updates.values()) + [admin["id"], channel_id]
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE chat_settings SET {set_parts}, updated_at = NOW(), updated_by = %s WHERE channel_id = %s",
                    values
                )
                conn.commit()
            return ok({"ok": True})

        return err("Неизвестное действие", 404)
    finally:
        conn.close()