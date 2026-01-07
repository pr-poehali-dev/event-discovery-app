import json
import os
import hashlib
import secrets
import random
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

def handler(event: dict, context) -> dict:
    '''API для регистрации и авторизации пользователей через SMS'''
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
        
        if action == 'send_sms':
            return send_sms_code(body)
        elif action == 'verify_sms':
            return verify_sms_code(body)
        elif action == 'login':
            return login_user(body)
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

def login_user(body: dict) -> dict:
    phone = body.get('phone')
    password = body.get('password')
    
    if not phone or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите телефон и пароль'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT id, phone, password_hash, full_name, created_at 
            FROM users WHERE phone = %s
        """, (phone,))
        
        user = cur.fetchone()
        
        if not user or not verify_password(user['password_hash'], password):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный телефон или пароль'}),
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
                    'phone': user['phone'],
                    'full_name': user['full_name'],
                    'created_at': user['created_at'].isoformat() if user['created_at'] else None
                }
            }),
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