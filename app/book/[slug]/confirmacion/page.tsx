'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { formatTime, formatDate, formatPrice } from '@/lib/format';

interface BookingData {
  id: string;
  orgName: string | null;
  serviceName: string;
  durationMin: number;
  price: number;
  date: string;
  startsAt: string;
  endsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export default function ConfirmacionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastBooking');
      if (raw) {
        setBooking(JSON.parse(raw));
      }
    } catch {
      // ignore parse error
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="container" style={{ paddingTop: 'var(--sp-8)' }}>
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container" style={{ paddingTop: 'var(--sp-8)' }}>
        <div className="card stack" style={{ maxWidth: 500, marginInline: 'auto' }}>
          <div className="alert alert-info">
            No encontramos una reserva reciente. Empieza aquí.
          </div>
          <Link href={`/book/${slug}`} className="btn btn-primary btn-block">
            Hacer una reserva
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-8)' }}>
      <div className="card stack" style={{ maxWidth: 500, marginInline: 'auto' }}>
        <div className="cluster" style={{ justifyContent: 'center' }}>
          <span className="badge badge-ok" style={{ fontSize: 'var(--fs-sm)' }}>Reserva confirmada</span>
        </div>
        <h1 style={{ textAlign: 'center' }}>¡Listo! Tu reserva está confirmada</h1>

        <div className="panel stack" style={{ gap: 'var(--sp-2)' }}>
          {booking.orgName && (
            <div className="cluster" style={{ justifyContent: 'space-between' }}>
              <span className="muted text-sm">Negocio</span>
              <span style={{ fontWeight: 600 }}>{booking.orgName}</span>
            </div>
          )}
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Servicio</span>
            <span style={{ fontWeight: 600 }}>{booking.serviceName}</span>
          </div>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Duración</span>
            <span>{booking.durationMin} min</span>
          </div>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Precio</span>
            <span>{formatPrice(booking.price)}</span>
          </div>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Día</span>
            <span>{formatDate(booking.date)}</span>
          </div>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Hora</span>
            <span>{formatTime(booking.startsAt)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Nombre</span>
            <span>{booking.customerName}</span>
          </div>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Teléfono</span>
            <span>{booking.customerPhone}</span>
          </div>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <span className="muted text-sm">Correo</span>
            <span>{booking.customerEmail}</span>
          </div>
        </div>

        <p className="text-sm muted" style={{ textAlign: 'center' }}>
          Te esperamos. Si necesitas cambiar algo, contacta con el negocio.
        </p>

        <div className="cluster" style={{ justifyContent: 'center' }}>
          <Link href={`/book/${slug}`} className="btn btn-ghost">
            Hacer otra reserva
          </Link>
        </div>
      </div>
    </div>
  );
}
