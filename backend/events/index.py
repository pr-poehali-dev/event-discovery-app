import json
import os
import psycopg2
import uuid
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления мероприятиями: создание, получение списка, оплата публикации'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')

            if action == 'create_event':
                organizer_id = body.get('organizer_id')
                title = body.get('title')
                description = body.get('description')
                category = body.get('category')
                city = body.get('city')
                event_date = body.get('event_date')
                event_time = body.get('event_time')
                participant_price = body.get('participant_price', 0)
                latitude = body.get('latitude')
                longitude = body.get('longitude')
                max_participants = body.get('max_participants')

                cur.execute("""
                    INSERT INTO events (organizer_id, title, description, category, city, event_date, event_time, participant_price, latitude, longitude, max_participants)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (organizer_id, title, description, category, city, event_date, event_time, participant_price, latitude, longitude, max_participants))
                event_id = cur.fetchone()[0]
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'event_id': event_id, 'message': 'Мероприятие создано. Оплатите публикацию 150 ₽'})
                }

            elif action == 'pay_publication':
                event_id = body.get('event_id')
                organizer_id = body.get('organizer_id')

                cur.execute("SELECT id FROM events WHERE id = %s AND organizer_id = %s", (event_id, organizer_id))
                if not cur.fetchone():
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Мероприятие не найдено'})
                    }

                payment_id = str(uuid.uuid4())
                payment_url = f'sbp://pay?order={payment_id}&amount=150'

                cur.execute("""
                    INSERT INTO event_publications (event_id, organizer_id, payment_id, payment_url, payment_status, payment_amount)
                    VALUES (%s, %s, %s, %s, 'pending', 150)
                    RETURNING id
                """, (event_id, organizer_id, payment_id, payment_url))
                publication_id = cur.fetchone()[0]
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'publication_id': publication_id,
                        'payment_url': payment_url,
                        'payment_id': payment_id,
                        'amount': 150
                    })
                }

            elif action == 'confirm_publication':
                publication_id = body.get('publication_id')

                cur.execute("""
                    UPDATE event_publications 
                    SET payment_status = 'paid', paid_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING event_id
                """, (publication_id,))
                result = cur.fetchone()
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Публикация не найдена'})
                    }

                event_id = result[0]
                cur.execute("UPDATE events SET status = 'published' WHERE id = %s", (event_id,))
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Мероприятие опубликовано'})
                }

        elif method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            category = query_params.get('category')
            city = query_params.get('city')
            organizer_id = query_params.get('organizer_id')

            sql = """
                SELECT e.id, e.title, e.description, e.category, e.city, e.event_date, e.event_time, 
                       e.participant_price, e.latitude, e.longitude, e.max_participants, e.status,
                       u.full_name as organizer_name, e.created_at
                FROM events e
                JOIN users u ON e.organizer_id = u.id
                WHERE e.status = 'published'
            """
            params = []

            if organizer_id:
                sql = sql.replace("WHERE e.status = 'published'", "WHERE e.organizer_id = %s")
                params.append(int(organizer_id))
            else:
                if category:
                    sql += " AND e.category = %s"
                    params.append(category)
                if city:
                    sql += " AND e.city = %s"
                    params.append(city)

            sql += " ORDER BY e.event_date ASC"

            cur.execute(sql, params)
            rows = cur.fetchall()

            events = []
            for row in rows:
                events.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'category': row[3],
                    'city': row[4],
                    'date': str(row[5]),
                    'time': str(row[6]),
                    'participant_price': row[7],
                    'latitude': float(row[8]) if row[8] else None,
                    'longitude': float(row[9]) if row[9] else None,
                    'max_participants': row[10],
                    'status': row[11],
                    'organizer_name': row[12],
                    'created_at': row[13].isoformat()
                })

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'events': events})
            }

    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        cur.close()
        conn.close()

    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }