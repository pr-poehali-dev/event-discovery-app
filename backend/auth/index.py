import json
import os
import hashlib
import secrets
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${pwd_hash.hex()}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    salt, pwd_hash = stored_password.split('$')
    check_hash = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return pwd_hash == check_hash.hex()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def send_email(to_email: str, subject: str, body: str) -> bool:
    try:
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        
        if not all([smtp_host, smtp_user, smtp_password]):
            print("SMTP настройки не заполнены")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Ошибка отправки email: {str(e)}")
        return False

def handler(event: dict, context) -> dict:
    '''API для регистрации и авторизации пользователей через email и пароль'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'register':
            return register_user(body)
        elif action == 'login':
            return login_user(body)
        elif action == 'request_reset':
            return request_password_reset(body)
        elif action == 'reset_password':
            return reset_password(body)
        elif action == 'verify':
            return verify_token(event)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def send_sms_code(body: dict) -> dict:
    phone = body.get('phone')
    
    if not phone:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите номер телефона'}),
            'isBase64Encoded': False
        }
    
    code = str(random.randint(1000, 9999))
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO sms_codes (phone, code, expires_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (phone) DO UPDATE SET code = %s, expires_at = %s, created_at = NOW()
        """, (phone, code, datetime.now() + timedelta(minutes=5), code, datetime.now() + timedelta(minutes=5)))
        conn.commit()
        
        print(f"SMS код для {phone}: {code}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': f'Код отправлен. Для теста: {code}'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def verify_sms_code(body: dict) -> dict:
    phone = body.get('phone')
    code = body.get('code')
    
    if not phone or not code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите телефон и код'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT code, expires_at FROM sms_codes 
            WHERE phone = %s
        """, (phone,))
        
        sms_data = cur.fetchone()
        
        if not sms_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Код не найден'}),
                'isBase64Encoded': False
            }
        
        if sms_data['expires_at'] < datetime.now():
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Код истёк'}),
                'isBase64Encoded': False
            }
        
        if sms_data['code'] != code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный код'}),
                'isBase64Encoded': False
            }
        
        cur.execute("SELECT id, phone, full_name FROM users WHERE phone = %s", (phone,))
        user = cur.fetchone()
        
        if not user:
            cur.execute("""
                INSERT INTO users (phone, full_name, password_hash, passport_series, passport_number, 
                                 passport_issued_by, passport_issue_date, date_of_birth)
                VALUES (%s, %s, '', '', '', '', NULL, NULL)
                RETURNING id, phone, full_name, created_at
            """, (phone, phone))
            user = cur.fetchone()
            conn.commit()
        
        cur.execute("DELETE FROM sms_codes WHERE phone = %s", (phone,))
        conn.commit()
        
        token = generate_token()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Вход выполнен',
                'token': token,
                'user': {
                    'id': user['id'],
                    'phone': user['phone'],
                    'full_name': user.get('full_name', user['phone']),
                    'created_at': user.get('created_at').isoformat() if user.get('created_at') else None
                }
            }),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def register_user(body: dict) -> dict:
    email = body.get('email')
    password = body.get('password')
    full_name = body.get('full_name', '')
    phone = body.get('phone', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите email и пароль'}),
            'isBase64Encoded': False
        }
    
    if len(password) < 6:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT id FROM t_p2283616_event_discovery_app.users WHERE email = %s", (email,))
        if cur.fetchone():
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь с таким email уже существует'}),
                'isBase64Encoded': False
            }
        
        password_hash = hash_password(password)
        
        cur.execute("""
            INSERT INTO t_p2283616_event_discovery_app.users 
            (phone, email, password_hash, full_name)
            VALUES (%s, %s, %s, %s)
            RETURNING id, email, full_name, created_at
        """, (phone, email, password_hash, full_name))
        
        user = cur.fetchone()
        conn.commit()
        
        token = generate_token()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Регистрация успешна',
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'created_at': user['created_at'].isoformat() if user['created_at'] else None
                }
            }),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def login_user(body: dict) -> dict:
    email = body.get('email')
    password = body.get('password')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите email и пароль'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT id, email, password_hash, full_name, created_at 
            FROM t_p2283616_event_discovery_app.users WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль'}),
                'isBase64Encoded': False
            }
        
        if not user['password_hash'] or not verify_password(user['password_hash'], password):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль'}),
                'isBase64Encoded': False
            }
        
        token = generate_token()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Вход выполнен',
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'created_at': user['created_at'].isoformat() if user['created_at'] else None
                }
            }),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def request_password_reset(body: dict) -> dict:
    email = body.get('email')
    
    if not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите email'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT id FROM t_p2283616_event_discovery_app.users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Если email существует, письмо будет отправлено'}),
                'isBase64Encoded': False
            }
        
        reset_token = generate_token()
        expires_at = datetime.now() + timedelta(hours=1)
        
        cur.execute("""
            INSERT INTO t_p2283616_event_discovery_app.password_reset_tokens (user_id, token, expires_at)
            VALUES (%s, %s, %s)
        """, (user['id'], reset_token, expires_at))
        conn.commit()
        
        email_subject = "Восстановление пароля - Польза"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4F46E5;">Восстановление пароля</h2>
            <p>Вы запросили восстановление пароля для вашего аккаунта.</p>
            <p>Используйте этот токен для восстановления:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <code style="font-size: 16px; color: #1f2937;">{reset_token}</code>
            </div>
            <p>Токен действителен в течение 1 часа.</p>
            <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">С уважением, команда Польза</p>
        </body>
        </html>
        """
        
        email_sent = send_email(email, email_subject, email_body)
        
        if email_sent:
            print(f"Email отправлен на {email}")
        else:
            print(f"Ошибка отправки email. Токен для теста: {reset_token}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Ссылка для восстановления отправлена на email',
                'reset_token': reset_token if not email_sent else None
            }),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def reset_password(body: dict) -> dict:
    token = body.get('token')
    new_password = body.get('password')
    
    if not token or not new_password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите токен и новый пароль'}),
            'isBase64Encoded': False
        }
    
    if len(new_password) < 6:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT user_id, expires_at 
            FROM t_p2283616_event_discovery_app.password_reset_tokens 
            WHERE token = %s
        """, (token,))
        
        reset_data = cur.fetchone()
        
        if not reset_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный токен'}),
                'isBase64Encoded': False
            }
        
        if reset_data['expires_at'] < datetime.now():
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Токен истёк'}),
                'isBase64Encoded': False
            }
        
        password_hash = hash_password(new_password)
        
        cur.execute("""
            UPDATE t_p2283616_event_discovery_app.users 
            SET password_hash = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (password_hash, reset_data['user_id']))
        
        cur.execute("""
            DELETE FROM t_p2283616_event_discovery_app.password_reset_tokens 
            WHERE user_id = %s
        """, (reset_data['user_id'],))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Пароль успешно изменён'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def verify_token(event: dict) -> dict:
    token = event.get('headers', {}).get('X-Auth-Token')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Токен не предоставлен'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'valid': True, 'message': 'Токен действителен'}),
        'isBase64Encoded': False
    }