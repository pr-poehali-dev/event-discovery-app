-- Делаем поля необязательными для регистрации через email
ALTER TABLE t_p2283616_event_discovery_app.users 
ALTER COLUMN phone SET DEFAULT '',
ALTER COLUMN passport_series SET DEFAULT '',
ALTER COLUMN passport_number SET DEFAULT '',
ALTER COLUMN passport_issued_by SET DEFAULT '',
ALTER COLUMN passport_issue_date SET DEFAULT '2000-01-01',
ALTER COLUMN date_of_birth SET DEFAULT '2000-01-01';