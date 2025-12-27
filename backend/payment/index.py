import json
import os
import uuid
import hashlib
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для обработки платежей через СБП за регистрацию на мероприятия'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'create_payment':
            return create_payment(body)
        elif action == 'check_payment':
            return check_payment(body)
        elif action == 'get_user_registrations':
            return get_user_registrations(body)
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

def create_payment(body: dict) -> dict:
    user_id = body.get('user_id')
    event_id = body.get('event_id')
    event_title = body.get('event_title', 'Мероприятие')
    
    if not user_id or not event_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите user_id и event_id'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT id, payment_status FROM registrations 
            WHERE user_id = %s AND event_id = %s
        """, (user_id, event_id))
        
        existing = cur.fetchone()
        
        if existing:
            if existing['payment_status'] == 'paid':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Вы уже зарегистрированы на это мероприятие'}),
                    'isBase64Encoded': False
                }
            else:
                registration_id = existing['id']
        else:
            payment_id = str(uuid.uuid4())
            
            cur.execute("""
                INSERT INTO registrations (user_id, event_id, payment_id, payment_status, payment_amount)
                VALUES (%s, %s, %s, 'pending', 100)
                RETURNING id
            """, (user_id, event_id, payment_id))
            
            registration_id = cur.fetchone()['id']
            conn.commit()
        
        sbp_url = f"https://qr.nspk.ru/proverkacheka/v1/api/merchant/qr?amount=100&purpose={event_title}"
        
        cur.execute("""
            UPDATE registrations 
            SET payment_url = %s 
            WHERE id = %s
        """, (sbp_url, registration_id))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'registration_id': registration_id,
                'payment_url': sbp_url,
                'amount': 100,
                'message': 'Оплатите через СБП для завершения регистрации'
            }),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def check_payment(body: dict) -> dict:
    registration_id = body.get('registration_id')
    
    if not registration_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите registration_id'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT payment_status, paid_at FROM registrations WHERE id = %s
        """, (registration_id,))
        
        registration = cur.fetchone()
        
        if not registration:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Регистрация не найдена'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'status': registration['payment_status'],
                'paid_at': registration['paid_at'].isoformat() if registration['paid_at'] else None
            }),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()

def get_user_registrations(body: dict) -> dict:
    user_id = body.get('user_id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите user_id'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT id, event_id, payment_status, payment_amount, created_at, paid_at
            FROM registrations 
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        
        registrations = cur.fetchall()
        
        result = []
        for reg in registrations:
            result.append({
                'id': reg['id'],
                'event_id': reg['event_id'],
                'status': reg['payment_status'],
                'amount': reg['payment_amount'],
                'created_at': reg['created_at'].isoformat() if reg['created_at'] else None,
                'paid_at': reg['paid_at'].isoformat() if reg['paid_at'] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'registrations': result}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
