create or replace function public.submit_rsvp(
  p_session_id uuid,
  p_response public.rsvp_response,
  p_submitted_name text,
  p_attendance_count integer,
  p_idempotency_key uuid
)
returns table (response public.rsvp_response, changed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valid_session boolean;
  v_previous_response public.rsvp_response;
  v_previous_name text;
  v_previous_count integer;
  v_existing_response public.rsvp_response;
  v_is_changed boolean;
  v_rsvp_id uuid;
begin
  select exists(
    select 1 from public.anonymous_sessions
    where id = p_session_id and expires_at > now()
  ) into v_valid_session;

  if not v_valid_session then
    raise exception 'Invalid or expired session';
  end if;

  if p_response = 'no' and p_attendance_count is not null then
    raise exception 'Attendance count must be null when response is no';
  end if;

  if p_response in ('yes', 'maybe') and (p_attendance_count is null or p_attendance_count < 1) then
    raise exception 'Attendance count must be at least 1 when response is yes or maybe';
  end if;

  if length(trim(p_submitted_name)) < 1 then
    raise exception 'Submitted name cannot be empty';
  end if;

  select result_response into v_existing_response
  from public.rsvp_idempotency_keys
  where session_id = p_session_id and idempotency_key = p_idempotency_key;

  if v_existing_response is not null then
    return query select v_existing_response, false;
    return;
  end if;

  select r.id, r.response, r.submitted_name, r.attendance_count
  into v_rsvp_id, v_previous_response, v_previous_name, v_previous_count
  from public.rsvp r
  where r.session_id = p_session_id
  for update;

  insert into public.rsvp_idempotency_keys (
    session_id, idempotency_key, response, submitted_name, attendance_count, result_response
  ) values (
    p_session_id, p_idempotency_key, p_response, p_submitted_name, p_attendance_count, p_response
  );

  v_is_changed := (v_previous_response is distinct from p_response)
    or (v_previous_name is distinct from p_submitted_name)
    or (v_previous_count is distinct from p_attendance_count);

  if v_rsvp_id is null then
    insert into public.rsvp (
      session_id, response, submitted_name, attendance_count
    ) values (
      p_session_id, p_response, p_submitted_name, p_attendance_count
    ) returning id into v_rsvp_id;

    insert into public.rsvp_history (
      rsvp_id, session_id, previous_response, new_response,
      previous_submitted_name, new_submitted_name,
      previous_attendance_count, new_attendance_count
    ) values (
      v_rsvp_id, p_session_id, null, p_response,
      null, p_submitted_name,
      null, p_attendance_count
    );

    insert into public.experience_events (
      session_id, event_type, metadata
    ) values (
      p_session_id,
      'rsvp_completed',
      jsonb_build_object(
        'response', p_response,
        'attendance_count', p_attendance_count
      )
    );
  elsif v_is_changed then
    update public.rsvp
    set response = p_response,
        submitted_name = p_submitted_name,
        attendance_count = p_attendance_count,
        updated_at = now()
    where id = v_rsvp_id;

    insert into public.rsvp_history (
      rsvp_id, session_id, previous_response, new_response,
      previous_submitted_name, new_submitted_name,
      previous_attendance_count, new_attendance_count
    ) values (
      v_rsvp_id, p_session_id, v_previous_response, p_response,
      v_previous_name, p_submitted_name,
      v_previous_count, p_attendance_count
    );

    insert into public.experience_events (
      session_id, event_type, metadata
    ) values (
      p_session_id,
      'rsvp_changed',
      jsonb_build_object(
        'previous_response', v_previous_response,
        'new_response', p_response,
        'previous_count', v_previous_count,
        'new_count', p_attendance_count
      )
    );
  end if;

  return query select p_response, (v_previous_response is not null and v_is_changed);
end;
$$;

revoke all on function public.submit_rsvp(uuid, public.rsvp_response, text, integer, uuid) from public;
grant execute on function public.submit_rsvp(uuid, public.rsvp_response, text, integer, uuid) to service_role;

