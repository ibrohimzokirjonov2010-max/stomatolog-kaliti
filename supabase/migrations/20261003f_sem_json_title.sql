-- Registrations carry the title of organizer-created (DB) seminars so tickets stay readable even after the seminar is deleted.
create or replace function private.sem_json(r public.seminar_registrations)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'seminarId', r.seminar_id, 'seminarTitle', (select s.title from public.seminars s where s.id = r.seminar_id),
    'name', r.name, 'phone', r.phone, 'telegram', r.telegram,
    'clinic', r.clinic, 'status', r.status, 'paymentStatus', r.payment_status, 'price', r.price, 'ticketCode', r.ticket_code,
    'createdAt', r.created_at, 'confirmedAt', r.confirmed_at, 'attendedAt', r.attended_at, 'paidAt', r.paid_at, 'cancelledAt', r.cancelled_at)
$$;
