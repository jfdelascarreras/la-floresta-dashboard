alter table public.pendientes add column if not exists fuente text;

comment on column public.pendientes.fuente is
  'Origen de la tarea: WhatsApp o Google Sheets. La hoja lo informa; la web no lo cambia.';
