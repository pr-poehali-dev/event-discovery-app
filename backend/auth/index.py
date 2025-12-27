import json
import os
import hashlib
import secrets
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
    '''API для регистрации и авторизации пользователей'''
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

def register_user(body: dict) -> dict:
    required_fields = ['phone', 'password', 'full_name', 'passport_series', 
                      'passport_number', 'passport_issued_by', 'passport_issue_date', 'date_of_birth']
    
    for field in required_fields:
        if not body.get(field):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Поле {field} обязательно'}),
                'isBase64Encoded': False
            }
    
    phone = body['phone']
    password = body['password']
    
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
        cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        existing_user = cur.fetchone()
        if existing_user:
            cur.execute("DELETE FROM users WHERE phone = %s", (phone,))
            conn.commit()
        
        password_hash = hash_password(password)
        
        cur.execute("""
            INSERT INTO users (phone, password_hash, full_name, passport_series, 
                             passport_number, passport_issued_by, passport_issue_date, date_of_birth)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, phone, full_name, created_at
        """, (
            phone, password_hash, body['full_name'], body['passport_series'],
            body['passport_number'], body['passport_issued_by'], 
            body['passport_issue_date'], body['date_of_birth']
        ))
        
        user = cur.fetchone()
        conn.commit()
        
        token = generate_token()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Регистрация успешна',
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