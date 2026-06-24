import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de la petición inválido' },
      { status: 400 }
    );
  }

  const { serviceId, starts_at, customer_name, customer_phone, customer_email } = body as {
    serviceId?: string;
    starts_at?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
  };

  // Validate required fields
  if (!serviceId || !starts_at || !customer_name || !customer_phone || !customer_email) {
    return NextResponse.json(
      { error: 'Todos los campos son obligatorios' },
      { status: 400 }
    );
  }

  // Validate email format
  if (!/^.+@.+\..+$/.test(customer_email)) {
    return NextResponse.json(
      { error: 'Email inválido' },
      { status: 400 }
    );
  }

  // Validate starts_at is a valid ISO date
  const startDate = new Date(starts_at);
  if (isNaN(startDate.getTime())) {
    return NextResponse.json(
      { error: 'Fecha de inicio inválida' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_appointment', {
    p_slug: slug,
    p_service_id: serviceId,
    p_starts_at: starts_at,
    p_name: customer_name,
    p_phone: customer_phone,
    p_email: customer_email,
  });

  if (error) {
    const msg = error.message;

    // Slot already taken or not available
    if (msg.includes('Slot') || msg.includes('ya reservado') || msg.includes('no disponible')) {
      return NextResponse.json(
        { error: 'El horario seleccionado ya no está disponible' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ id: data }, { status: 201 });
}
