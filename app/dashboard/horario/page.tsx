import { HoursEditor } from './HoursEditor';

export default function HorarioPage() {
  return (
    <div className="stack">
      <div>
        <h1>Horario de atención</h1>
        <p className="subtitle">
          Marca cuándo atiendes y cuándo descansas. Tus clientes solo verán horarios dentro de estos bloques.
        </p>
      </div>
      <HoursEditor />
    </div>
  );
}
