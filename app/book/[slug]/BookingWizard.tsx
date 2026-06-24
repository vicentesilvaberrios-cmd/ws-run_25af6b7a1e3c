'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatTime, formatDate, formatPrice } from '@/lib/format';

interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number;
}

interface Slot {
  starts_at: string;
  ends_at: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<Step, string> = {
  1: 'Servicio',
  2: 'Fecha',
  3: 'Horario',
  4: 'Tus datos',
  5: 'Confirmar',
};

export function BookingWizard({
  slug,
  initialOrgName,
  initialError,
}: {
  slug: string;
  initialOrgName: string | null;
  initialError: boolean;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateTouched, setDateTouched] = useState(false);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerNameTouched, setCustomerNameTouched] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPhoneTouched, setCustomerPhoneTouched] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerEmailTouched, setCustomerEmailTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Load services
  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    setServicesError(false);
    try {
      const res = await fetch(`/api/public/${slug}/services`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data);
    } catch {
      setServicesError(true);
    } finally {
      setLoadingServices(false);
    }
  }, [slug]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Load availability
  const loadSlots = useCallback(async (serviceId: string, date: string) => {
    setLoadingSlots(true);
    setSlotsError(false);
    try {
      const res = await fetch(
        `/api/public/${slug}/availability?serviceId=${serviceId}&date=${date}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSlots(data);
    } catch {
      setSlotsError(true);
    } finally {
      setLoadingSlots(false);
    }
  }, [slug]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleViewSlots = () => {
    setDateTouched(true);
    if (!selectedDate || !selectedService) return;
    setStep(3);
    loadSlots(selectedService.id, selectedDate);
  };

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const nameError = customerNameTouched && !customerName.trim() ? 'Tu nombre es obligatorio' : '';
  const phoneError = customerPhoneTouched && !customerPhone.trim() ? 'Tu teléfono es obligatorio' : '';
  const emailError =
    customerEmailTouched && !customerEmail.trim()
      ? 'Tu correo es obligatorio'
      : customerEmailTouched && !/^.+@.+\..+$/.test(customerEmail)
        ? 'El correo no es válido'
        : '';

  const handleConfirm = async () => {
    if (!selectedService || !selectedSlot) return;

    setCustomerNameTouched(true);
    setCustomerPhoneTouched(true);
    setCustomerEmailTouched(true);

    if (!customerName.trim() || !customerPhone.trim() || !/^.+@.+\..+$/.test(customerEmail)) {
      return;
    }

    setSubmitting(true);
    setBookingError('');

    try {
      const res = await fetch(`/api/public/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          starts_at: selectedSlot.starts_at,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim(),
        }),
      });

      if (res.status === 409) {
        setBookingError('Ese horario acaba de ser reservado por otra persona. Elige otro.');
        setStep(3);
        if (selectedService && selectedDate) {
          loadSlots(selectedService.id, selectedDate);
        }
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setBookingError(data.error || 'No pudimos completar la reserva. Inténtalo de nuevo.');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      // Store reservation info in sessionStorage for the confirmation page
      const confirmation = {
        id: data.id,
        orgName: initialOrgName,
        serviceName: selectedService.name,
        durationMin: selectedService.duration_min,
        price: selectedService.price,
        date: selectedDate,
        startsAt: selectedSlot.starts_at,
        endsAt: selectedSlot.ends_at,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
      };
      sessionStorage.setItem('lastBooking', JSON.stringify(confirmation));
      router.push(`/book/${slug}/confirmacion`);
    } catch {
      setBookingError('No pudimos completar la reserva. Inténtalo de nuevo.');
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // ---- Render ----
  return (
    <div className="stack" style={{ maxWidth: 600, marginInline: 'auto' }}>
      {initialOrgName && <h1 style={{ textAlign: 'center' }}>{initialOrgName}</h1>}

      {/* Step indicator */}
      <div className="cluster" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {([1, 2, 3, 4, 5] as Step[]).map((s, i) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
            <span
              className="badge"
              style={
                s === step
                  ? { background: 'var(--brand)', color: 'var(--brand-contrast)' }
                  : s < step
                    ? { color: 'var(--ok)' }
                    : {}
              }
              aria-current={s === step ? 'step' : undefined}
            >
              {s}
            </span>
            <span className="text-sm muted">{STEP_LABELS[s]}</span>
            {i < 4 && <span className="muted text-sm">→</span>}
          </span>
        ))}
      </div>

      {bookingError && (
        <div className="alert alert-error" role="alert">{bookingError}</div>
      )}

      {/* Step 1: Servicio */}
      {step === 1 && (
        <div className="stack">
          <h2>Elige un servicio</h2>
          {loadingServices && <p className="muted">Cargando servicios…</p>}
          {servicesError && (
            <div className="alert alert-error" role="alert">
              No pudimos cargar los servicios.{' '}
              <button className="btn btn-sm btn-ghost" onClick={loadServices}>Reintentar</button>
            </div>
          )}
          {!loadingServices && !servicesError && services.length === 0 && (
            <div className="empty-state">
              Este negocio aún no tiene servicios disponibles. Vuelve más tarde.
            </div>
          )}
          {!loadingServices && !servicesError && services.length > 0 && (
            <div className="grid grid-sm-2">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  className="card stack"
                  style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border)' }}
                  onClick={() => handleSelectService(svc)}
                >
                  <h3>{svc.name}</h3>
                  <span className="text-sm muted">Duración: {svc.duration_min} min</span>
                  <span className="text-sm" style={{ fontWeight: 600 }}>{formatPrice(svc.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Fecha */}
      {step === 2 && (
        <div className="stack">
          <h2>Elige el día</h2>
          <div className="field">
            <label htmlFor="booking-date">Día de la cita</label>
            <input
              id="booking-date"
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (dateTouched) setDateTouched(false);
              }}
              onBlur={() => setDateTouched(true)}
              aria-invalid={!!(dateTouched && !selectedDate)}
            />
            {dateTouched && !selectedDate && (
              <span className="error-text" role="alert">Elige una fecha</span>
            )}
          </div>
          <div className="cluster">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Atrás</button>
            <button className="btn btn-primary" onClick={handleViewSlots}>
              Ver horarios disponibles
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Horario */}
      {step === 3 && (
        <div className="stack">
          <h2>Horarios disponibles</h2>
          <p className="text-sm muted">
            {selectedService?.name} — {formatDate(selectedDate)}
          </p>
          {loadingSlots && <p className="muted">Buscando horarios disponibles…</p>}
          {slotsError && (
            <div className="alert alert-error" role="alert">
              No pudimos cargar los horarios.{' '}
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => selectedService && loadSlots(selectedService.id, selectedDate)}
              >
                Reintentar
              </button>
            </div>
          )}
          {!loadingSlots && !slotsError && slots.length === 0 && (
            <div className="empty-state">
              No hay horarios disponibles para ese día. Prueba con otra fecha.
            </div>
          )}
          {!loadingSlots && !slotsError && slots.length > 0 && (
            <div className="grid grid-sm-2 grid-md-3">
              {slots.map((slot, i) => (
                <button
                  key={i}
                  className="btn btn-ghost btn-block"
                  onClick={() => handleSelectSlot(slot)}
                >
                  {formatTime(slot.starts_at)}
                </button>
              ))}
            </div>
          )}
          <div className="cluster">
            <button className="btn btn-ghost" onClick={() => setStep(2)}>Atrás</button>
          </div>
        </div>
      )}

      {/* Step 4: Datos */}
      {step === 4 && (
        <div className="stack">
          <h2>Tus datos</h2>
          <div className="field">
            <label htmlFor="cust-name">Nombre</label>
            <input
              id="cust-name"
              type="text"
              autoComplete="name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (customerNameTouched) setCustomerNameTouched(false);
              }}
              onBlur={() => setCustomerNameTouched(true)}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'cust-name-error' : undefined}
              required
            />
            {nameError && <span id="cust-name-error" className="error-text" role="alert">{nameError}</span>}
          </div>
          <div className="field">
            <label htmlFor="cust-phone">Teléfono</label>
            <input
              id="cust-phone"
              type="tel"
              autoComplete="tel"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (customerPhoneTouched) setCustomerPhoneTouched(false);
              }}
              onBlur={() => setCustomerPhoneTouched(true)}
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? 'cust-phone-error' : undefined}
              required
            />
            {phoneError && <span id="cust-phone-error" className="error-text" role="alert">{phoneError}</span>}
          </div>
          <div className="field">
            <label htmlFor="cust-email">Correo electrónico</label>
            <input
              id="cust-email"
              type="email"
              autoComplete="email"
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                if (customerEmailTouched) setCustomerEmailTouched(false);
              }}
              onBlur={() => setCustomerEmailTouched(true)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'cust-email-error' : undefined}
              required
            />
            {emailError && <span id="cust-email-error" className="error-text" role="alert">{emailError}</span>}
          </div>
          <div className="cluster">
            <button className="btn btn-ghost" onClick={() => setStep(3)}>Atrás</button>
            <button
              className="btn btn-primary"
              onClick={() => setStep(5)}
              disabled={!customerName.trim() || !customerPhone.trim() || !/^.+@.+\..+$/.test(customerEmail)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmar */}
      {step === 5 && (
        <div className="stack">
          <h2>Confirma tu reserva</h2>
          <div className="panel stack">
            <div className="stack" style={{ gap: 'var(--sp-2)' }}>
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Servicio</span>
                <span style={{ fontWeight: 600 }}>{selectedService?.name}</span>
              </div>
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Duración</span>
                <span>{selectedService?.duration_min} min</span>
              </div>
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Precio</span>
                <span>{selectedService ? formatPrice(selectedService.price) : ''}</span>
              </div>
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Día</span>
                <span>{formatDate(selectedDate)}</span>
              </div>
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Hora</span>
                <span>{selectedSlot ? formatTime(selectedSlot.starts_at) : ''}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Nombre</span>
                <span>{customerName}</span>
              </div>
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Teléfono</span>
                <span>{customerPhone}</span>
              </div>
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <span className="muted text-sm">Correo</span>
                <span>{customerEmail}</span>
              </div>
            </div>
          </div>
          <div className="cluster">
            <button className="btn btn-ghost" onClick={() => setStep(4)} disabled={submitting}>
              Atrás
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Confirmando…' : 'Confirmar reserva'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
