import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../redux/app/hooks';
import { Link, useParams } from 'react-router-dom';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import { RRule } from 'rrule';

const CalendarioPage = () => {
  const user = useAppSelector((state) => state.auth.usuario);
  const baseURL = import.meta.env.VITE_APP_DOMAIN;
  const { id_ambiente } = useParams();
  const [ambiente, setAmbiente] = useState({});
  const [reservas, setReservas] = useState([]);
  const [apertura, setApertura] = useState({});
  const [disponibilidad, setDisponibilidad] = useState([[]]);

  useEffect(() => {
    axios
      .get(`${baseURL}/disponibles/ambiente/${id_ambiente}`)
      .then(({ data }) => setAmbiente(data))
      .catch((e) => console.error('Error al obtener los datos del ambiente:', e));
    axios
      .get(`${baseURL}/reservas/reserva-ambientes/${id_ambiente}`)
      .then(({ data }) =>
        setReservas(
          data.map((obj) => ({
            id: new Date(`${obj.fecha_reserva?.slice(0, 10)}T${obj.hora_inicio}-04:00`).getTime(),
            title: 'RESERVADO',
            start: new Date(`${obj.fecha_reserva?.slice(0, 10)}T${obj.hora_inicio}-04:00`),
            end: new Date(`${obj.fecha_reserva?.slice(0, 10)}T${obj.hora_fin}-04:00`),
            obj: obj,
          })),
        ),
      )
      .catch((e) => console.error('Error al obtener las reservas del ambiente:', e));
    axios
      .get(`${baseURL}/aperturas/apertura-fecha`)
      .then(({ data }) =>
        setApertura(
          user.tipo_usuario === 'ADMINISTRADOR'
            ? data[0]
            : data.find((obj) => obj[user.tipo_usuario.toLowerCase()]),
        ),
      )
      .catch((e) => console.error('Error al obtener la apertura vigente:', e));
  }, []);

  useEffect(() => {
    if (ambiente.id_ambiente > 0 && apertura.id_apertura > 0 && ambiente.disponible) {
      ambiente.disponibilidadPorDia.forEach((day, index) => {
        day.periodos.forEach((periodo) => {
          const weekday = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
          const rule = new RRule({
            freq: RRule.WEEKLY,
            interval: 1,
            byweekday: [RRule[weekday[index]]],
            dtstart: new Date(`${apertura.reserva_inicio.slice(0, 10)}T${periodo.hora_inicio}Z`),
            until: new Date(`${apertura.reserva_fin.slice(0, 10)}T${periodo.hora_inicio}Z`),
          });
          const occurrences = rule.all().map((date) => ({
            id: new Date(date.setHours(date.getHours() + 4)).getTime(),
            title: 'DISPONIBLE',
            start: new Date(date.setHours(date.getHours())),
            end: new Date(date.setHours(date.getHours() + 1, date.getMinutes() + 30)),
            obj: { ...periodo, estado: 'disponible' },
          }));
          setDisponibilidad((prev) => [...prev, ...occurrences]);
        });
      });
    }
  }, [ambiente, apertura]);

  const messages = {
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    allDay: 'Todo el día',
    week: 'Semana',
    day: 'Día',
    month: 'Mes',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    agenda: 'Agenda',
    noEventsInRange: 'Sin eventos',
  };

  const components = {
    event: ({ event }) => {
      const eventColor = {
        // RESERVAS
        vigente: event.obj.nombre_usuario === user.nombre_usuario ? 'success' : 'danger opacity-75',
        cancelado:
          event.obj.nombre_usuario === user.nombre_usuario
            ? 'danger opacity-75'
            : 'warning opacity-75',
        finalizado:
          event.obj.nombre_usuario === user.nombre_usuario
            ? 'danger opacity-75'
            : 'warning opacity-75',
        // DISPONIBLE
        disponible: 'primary opacity-75',
        // APERTURAS
        'EN CURSO': 'warning opacity-75',
        FINALIZADO: 'danger opacity-75',
        VIGENTE: 'primary opacity-75',

        undefined: 'danger',
      };
      const content = {
        RESERVADO: {
          header: event.obj.estado?.toUpperCase(),
          title: event.obj.nombre_usuario,
          subtitle: `Registrado el ${new Date(
            event.obj.registro_reserva?.slice(0, 23) + '-04:00',
          ).toLocaleString('es-ES', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}.`,
          listGroup: [
            { key: 'Materia/s: ', value: event.obj.nombre_materia },
            { key: 'Motivo: ', value: event.obj.motivo },
            { key: 'Cantidad: ', value: event.obj.cantidad_est },
          ],
          footer: [
            { to: '/reservas/listaReservas', text: 'Mis reservas' },
            { to: '/reservas/calendario', text: 'Mi calendario' },
          ],
        },
        DISPONIBLE: {
          header: 'DISPONIBLE',
          title: apertura.motivo,
          subtitle: `Disponible el día ${new Date(event.start).toLocaleString('es-ES', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}.`,
          listGroup: [
            {
              key: 'Fecha: ',
              value: startUpperCase(
                new Date(event.start).toLocaleString('es-ES', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }),
              ),
            },
            {
              key: 'Periodo: ',
              value: `De las ${new Date(event.start).toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })} a las ${new Date(event.end).toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}.`,
            },
          ],
          footer: [
            {
              to: '/ambientes/calendario/reservar',
              text: 'Reservar ambiente',
              state: {
                ambiente: ambiente,
                nombreAmbiente: ambiente.nombre_ambiente,
                fecha_reserva: dayjs(event.start).format('YYYY-MM-DD'),
                periodos: [event.obj.id_periodo?.toString()],
                periodo: `${event.obj.hora_inicio?.slice(0, 5)} - ${event.obj.hora_fin?.slice(0, 5)}`,
                event: event,
              },
            },
            {
              to: `/ambientes/listaAmbientes/fichaAmbiente/${id_ambiente}`,
              text: 'Más información',
            },
          ],
        },
        APERTURA: {
          header: 'APERTURA',
          title: apertura.motivo,
          subtitle: `Apertura para ${apertura.docente ? 'Docentes' : ''}${apertura.docente && apertura.auxiliar ? ' y ' : ''}${apertura.auxiliar ? 'Auxiliares' : ''}.`,
          listGroup: [
            { key: 'Estado: ', value: event.obj.estado },
            {
              key: 'Desde: ',
              value: startUpperCase(
                new Date(`${apertura.apertura_inicio?.slice(0, 23)}-04:00`).toLocaleString(
                  'es-ES',
                  {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                ),
              ),
            },
            {
              key: 'Hasta: ',
              value: startUpperCase(
                new Date(`${apertura.apertura_fin?.slice(0, 23)}-04:00`).toLocaleString('es-ES', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              ),
            },
            {
              key: 'Perdiodo de examen: ',
              value: `Del ${new Date(
                `${apertura.apertura_inicio?.slice(0, 23)}-04:00`,
              ).toLocaleString('es-ES', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })} al ${new Date(`${apertura.apertura_fin?.slice(0, 23)}-04:00`).toLocaleString(
                'es-ES',
                {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                },
              )}.`,
            },
          ],
          footer: [
            { to: '/reservas/reservarAmbiente', text: 'Formulario de reserva' },
            { to: '/ambientes/listaAmbientes', text: 'Ver más ambientes' },
          ],
        },
      };

      return (
        <div className="dropdown-center w-100 h-100">
          <button
            className={`btn bg-opacity-25 w-100 h-100 btn-${eventColor[event.obj.estado]}`}
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {event.obj.estado === 'cancelado' ? 'CANCELADO' : event.title}
          </button>
          <div className="dropdown-menu p-0 position-fixed">
            <div className="card" style={{ maxWidth: '28rem', minWidth: '18rem' }}>
              <div className="card-header text-center">{content[event.title].header}</div>
              <div className="card-body py-2">
                <h5 className="card-title">{content[event.title].title}</h5>
                <h6 className="card-subtitle text-body-secondary">
                  {content[event.title].subtitle}
                </h6>
              </div>
              <ul className="text-wrap list-group list-group-flush border">
                {content[event.title].listGroup.map(
                  (item, index) =>
                    item.value && (
                      <li key={`footer-${event.id}-${index}`} className="list-group-item d-flex">
                        {item.key} <p className="ms-2 mb-0">{item.value}</p>
                      </li>
                    ),
                )}
              </ul>
              <div className="card-footer py-2">
                {content[event.title].footer.map((link, index) => (
                  <Link
                    key={`footer-${event.id}-${index}`}
                    to={link.to}
                    className="card-link small"
                    state={link.state}
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    },
  };

  const startUpperCase = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="container-fluid listado-ambientes p-md-5 overflow-hidden">
      <h2 className="text-start d-flex justify-content-between">
        Calendario de {ambiente.nombre_ambiente}
      </h2>
      <div className="w-100 p-2">
        <span className="fs-6 fw-bold">Mis reservas:</span>
        <span
          className={`ms-2 badge text-bg-success`}
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          RESERVADO
        </span>
        <span
          className={`ms-2 badge text-bg-danger`}
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          CANCELADO
        </span>
        <span className="ms-4 fs-6 fw-bold">Otras reservas:</span>
        <span
          className={`ms-3 badge text-bg-danger btn-danger`}
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          RESERVADO
        </span>
        <span
          className={`ms-2 badge text-bg-warning`}
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          CANCELADO
        </span>
      </div>

      <div className="border border-2  rounded-2" style={{ height: 'calc(100vh - 150px)' }}>
        <Calendar
          step={45}
          events={[
            ...[...reservas, ...disponibilidad].filter(
              (obj, index, self) => index === self.findIndex((t) => t.id === obj.id),
            ),
            {
              id: apertura.id_apertura,
              title: 'APERTURA',
              start: new Date(apertura.apertura_inicio?.slice(0, 23) + '-04:00'),
              end: new Date(apertura.apertura_fin?.slice(0, 23) + '-04:00'),
              obj: apertura,
            },
          ]}
          localizer={dayjsLocalizer(dayjs)}
          messages={messages}
          length={1}
          views={['agenda', 'day', 'week', 'month']}
          defaultView="month"
          min={new Date(2024, 1, 1, 6, 45)}
          max={new Date(2024, 1, 1, 21, 45)}
          components={components}
          formats={{
            dayFormat: (date) =>
              startUpperCase(date.toLocaleString('es-ES', { weekday: 'short', day: 'numeric' })),
            weekdayFormat: (date) =>
              startUpperCase(date.toLocaleString('es-ES', { weekday: 'short' })),
            timeGutterFormat: (date) =>
              date.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            monthHeaderFormat: (date) =>
              startUpperCase(date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })),
            dayRangeHeaderFormat: (range) => {
              const dateFormat = { year: 'numeric', month: 'long', day: 'numeric' };
              const formattedDateStart = range.start.toLocaleDateString('es-ES', dateFormat);
              const formattedDateEnd = range.end.toLocaleDateString('es-ES', dateFormat);
              return startUpperCase(formattedDateStart) + ' al ' + startUpperCase(formattedDateEnd);
            },
            dayHeaderFormat: (date) => {
              const dateFormat = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              };
              const formattedDate = date.toLocaleString('es-ES', dateFormat);
              return startUpperCase(formattedDate);
            },
            agendaHeaderFormat: (range) => {
              const dateFormat = { year: 'numeric', month: 'long', day: '2-digit' };
              const formattedDateStart = range.start.toLocaleDateString('es-ES', dateFormat);
              const formattedDateEnd = range.end.toLocaleDateString('es-ES', dateFormat);
              return startUpperCase(formattedDateStart) + ' al ' + startUpperCase(formattedDateEnd);
            },
            agendaDateFormat: (date) =>
              startUpperCase(
                date.toLocaleString('es-ES', { weekday: 'short', month: 'long', day: 'numeric' }),
              ),
            agendaTimeFormat: (date) =>
              date.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            agendaTimeRangeFormat: (range) => {
              const dateFormat = { hour: '2-digit', minute: '2-digit' };
              const formattedDateStart = range.start.toLocaleTimeString('es-ES', dateFormat);
              const formattedDateEnd = range.end.toLocaleTimeString('es-ES', dateFormat);
              return startUpperCase(formattedDateStart) + ' - ' + startUpperCase(formattedDateEnd);
            },
            eventTimeRangeFormat: (range) => {
              const dateFormat = { hour: '2-digit', minute: '2-digit' };
              const formattedDateStart = range.start.toLocaleTimeString('es-ES', dateFormat);
              const formattedDateEnd = range.end.toLocaleTimeString('es-ES', dateFormat);
              return startUpperCase(formattedDateStart) + ' - ' + startUpperCase(formattedDateEnd);
            },
          }}
        />
      </div>
    </div>
  );
};

export default CalendarioPage;
