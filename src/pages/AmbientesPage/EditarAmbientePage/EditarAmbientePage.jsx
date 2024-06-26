import axios from 'axios';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import horariosJSON from '../RegistroAmbientePage/horarios';
import { useModal } from '../../../components/Bootstrap/ModalContext';
import iconoError from '../../../assets/Images/iconoError.png';
import iconoExito from '../../../assets/Images/iconoExito.png';
import iconoUbicacion from '../../../assets/Images/iconoUbicacion.png';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const EditarAmbientePage = () => {
  const baseURL = import.meta.env.VITE_APP_DOMAIN;
  const { confirmationModal, errorModal, successModal } = useModal();
  const horarios = horariosJSON;
  let { id_ambiente } = useParams();
  const [horariosFilter, setHorariosFilter] = useState([]);

  useEffect(() => {
    const loadAmbiente = (id_ambiente) => {
      axios
        .get(`${baseURL}/disponibles/ambiente/${id_ambiente}`)
        .then((response) => {
          reset(response.data);
          /// Filtrar los horarios disponibles por día
          const disponibilidadPorDia = response.data.disponibilidadPorDia;
          const horariosFilter = horarios.map((dia) => {
            const disponibilidadDia = disponibilidadPorDia.find(
              (disponibilidad) => disponibilidad.dia.toLowerCase() === dia.nombre.toLowerCase(),
            );
            const periodosDia = disponibilidadDia
              ? disponibilidadDia.periodos.map((periodo) => periodo.id_periodo)
              : [];
            const selectAll = periodosDia.length === dia.periodos.length;

            return {
              nombre: dia.nombre,
              selectAll: selectAll,
              periodos: dia.periodos.map((periodo) => ({
                ...periodo,
                checked: periodosDia.includes(periodo.id),
              })),
            };
          });

          setHorariosFilter(horariosFilter);
        })
        .catch((error) => {
          console.error('Error al obtener los datos del ambiente:', error);
        });
    };
    loadAmbiente(id_ambiente);
  }, [id_ambiente, baseURL]);

  const errorModalContent = (
    <>
      <div>
        <img src={iconoError} />
      </div>
      <div className="pt-md-3">Error al editar ambiente intente de nuevo</div>
    </>
  );

  // yup validación, atributos de formulario
  const schema = yup.object({
    nombre_ambiente: yup
      .string()
      .trim() // Elimina los espacios en blanco al inicio y al final
      .required('El campo es obligatorio')
      .matches(
        /^[\w]+(?:-[\w]+)*(?: [\w]+(?:-[\w]+)*)*$/,
        'Formato no válido. Solo se permite letras y no se acepta acentos.',
      )

      .test('is-valid-format', 'Formato no válido', function (value) {
        // Verifica si hay más de un espacio consecutivo en el valor
        return !/\s{2,}/.test(value);
      }),
    tipo: yup.string().required(),
    capacidad: yup
      .number()
      .integer('La capacidad debe ser un número entero')
      .typeError('El campo es obligatorio, la capacidad debe ser un número entero')
      .required('El campo es obligatorio')
      .min(0, 'La capacidad mínima es 0')
      .max(500, 'La capacidad máxima es 500'),
    computadora: yup
      .number()
      .integer('El número debe ser un número entero')
      .typeError('El campo es obligatorio, el número debe ser un número entero')
      .required('El campo es obligatorio')
      .min(0, 'El número mínimo es 0')
      .max(250, 'El número máximo es 250')
      .test('is-required', 'El campo es obligatorio para laboratorios', function (value) {
        //const tipoAmbiente = this.parent.tipo;
        if (watch('tipo') === 'laboratorio') {
          return typeof value === 'number';
        } else {
          setValue('computadora', 0);
        }
        return true;
      }),
    ubicacion: yup.string(),
    porcentaje_min: yup
      .number()
      .integer('El número debe ser un número entero')
      .typeError('El campo es obligatorio, el número debe ser un número entero')
      .required('El campo es obligatorio')
      .min(45, 'El número mínimo es 45')
      .max(100, 'El número máximo es 100'),
    porcentaje_max: yup
      .number()
      .integer('El número debe ser un número entero')
      .typeError('El campo es obligatorio, el número debe ser un número entero')
      .required('El campo es obligatorio')
      .min(100, 'El número mínimo es 100')
      .max(150, 'El número máximo es 150'),
    proyector: yup.bool(),
    dia: yup
      .object()
      .test(
        'at-least-one-period-selected',
        'Seleccione al menos un periodo para un día',
        (value) => {
          return Object.values(value).some((day) =>
            day.periodos.some((periodo) => periodo.id_periodo !== false),
          );
        },
      ),
  });

  // react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // logic api
  const onSubmit = (data) => {
    const filteredDia = Object.fromEntries(
      // eslint-disable-next-line no-unused-vars
      Object.entries(data.dia).filter(([key, value]) =>
        value.periodos.some((periodo) => periodo.id_periodo !== false),
      ),
    );

    const filteredData = {
      ...data,
      id_ambiente: id_ambiente,
      tipo: removeAccents(data.tipo.toLowerCase()),
      computadora: data.computadora === '' ? 0 : data.computadora,
      dia: Object.fromEntries(
        Object.entries(filteredDia).map(([key, value]) => [
          removeAccents(key.toLowerCase()),
          { periodos: value.periodos.filter((periodo) => periodo.id_periodo !== false) },
        ]),
      ),
    };

    axios
      .post(`${baseURL}/ambientes/editar-completo`, filteredData)
      .then((response) => {
        if (response.status === 200) {
          successModal({
            body: (
              <>
                <div>
                  <img src={iconoExito} />
                </div>
                <div className="pt-md-3">Cambios guardados con éxito</div>
              </>
            ),
            onClickTo: '/ambientes/listaAmbientes',
          });
        } else {
          errorModal({ content: errorModalContent });
        }
      })
      .catch((error) => {
        console.error('Error al obtener los ambiente disponibles: ', error);
      });
  };
  return (
    <div className="container registro-ambientes">
      <div className="row py-md-3 justify-content-center">
        <div className="col-md-8">
          <h2 className="text-md-center">Editar ambiente</h2>
          <form className="forms" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="my-3">
              <label className="form-label fw-bold">
                Nombre de ambiente
                <span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                maxLength={25}
                className="form-control"
                placeholder="Escriba el nombre del ambiente"
                {...register('nombre_ambiente')}
              />
              {errors.nombre_ambiente && (
                <span className="text-danger">{errors.nombre_ambiente.message}</span>
              )}
            </div>
            <div className="my-3">
              <label className="form-label fw-bold">
                Tipo de ambiente <span className="text-danger ms-1">*</span>
              </label>
              <select
                className="form-select"
                placeholder="Seleccione el tipo de ambiente"
                {...register('tipo')}
              >
                <option value="">Seleccione el tipo de ambiente</option>
                <option value="aula comun">Aula común</option>
                <option value="auditorio">Auditorio</option>
                <option value="laboratorio">Laboratorio</option>
              </select>
              {errors.tipo && <span className="text-danger">Seleccione una categoria</span>}
            </div>
            <div className="my-3">
              <label className="form-label fw-bold">
                Ubicación
                <span>
                  {' '}
                  <img
                    src={iconoUbicacion}
                    alt="icono ubicacion"
                    className="pb-2"
                    style={{ width: 'auto', height: '30px' }}
                  />
                </span>
              </label>
              <textarea
                rows={2}
                maxLength={350}
                type="text"
                className="form-control"
                placeholder="Escriba la ubicación del ambiente"
                {...register('ubicacion')}
              />
            </div>
            <div className="row">
              <div className="my-3 col-md-6">
                <label className="form-label fw-bold">
                  Capacidad de estudiantes <span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Escriba la capacidad de estudiantes"
                  {...register('capacidad')}
                />
                {errors.capacidad && (
                  <span className="text-danger">{errors.capacidad.message}</span>
                )}
              </div>
              <div className="my-3 col-md-3">
                <label className="form-label fw-bold">
                  Min (%)<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cap. maxima"
                  {...register('porcentaje_min')}
                />
                {errors.porcentaje_min && (
                  <span className="text-danger">{errors.porcentaje_min.message}</span>
                )}
              </div>
              <div className="my-3 col-md-3">
                <label className="form-label fw-bold">
                  Max (%)<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cap. de minima"
                  {...register('porcentaje_max')}
                />
                {errors.porcentaje_max && (
                  <span className="text-danger">{errors.porcentaje_max.message}</span>
                )}
              </div>
            </div>

            {watch('tipo') === 'laboratorio' && (
              <div className="my-3">
                <label className="form-label fw-bold">
                  Nº Computadoras <span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Escriba el número de computadoras"
                  {...register('computadora')}
                />
                {errors.computadora && (
                  <span className="text-danger">{errors.computadora.message}</span>
                )}
              </div>
            )}

            <div className="row">
              <div className="col-md">
                <label className="form-check-label me-md-2 fw-bold" htmlFor={`proyector`}>
                  Proyector de video
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`proyector`}
                  {...register('proyector')}
                />
              </div>
            </div>
            {/* Horarios */}
            <div className="my-3">
              <label className="form-label fw-bold">
                Días y horarios disponibles <span className="text-danger ms-1">*</span>
              </label>
              {horariosFilter.map((horario, index) => {
                const hasCheckedPeriod = horario.periodos.some((period) => period.checked);
                return (
                  <div key={index}>
                    <button
                      className="form-select text-start rounded-0"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse${horario.nombre}`}
                      aria-expanded="false"
                      aria-controls={`collapse${horario.nombre}`}
                    >
                      {horario.nombre}
                    </button>
                    <div
                      className={`collapse horarios${hasCheckedPeriod ? ' show' : ''}`}
                      id={`collapse${horario.nombre}`}
                    >
                      <div className="card card-body">
                        <div className="d-flex flex-md-row justify-content-between">
                          <p className="ms-3 fw-bolds">Periodos</p>
                          <div className="d-flex text-center">
                            <div>
                              <label className="form-check-label" htmlFor={`selectAll_${index}`}>
                                Todo
                              </label>
                            </div>
                            <div>
                              <input
                                className="form-check-input ms-md-2 me-3"
                                type="checkbox"
                                id={`selectAll_${index}`}
                                {...register(`selectAll_${index}`)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  horario.periodos.forEach((_, subIndex) => {
                                    const fieldName = `dia.${horario.nombre}.periodos[${subIndex}].id_periodo`;
                                    setValue(
                                      fieldName,
                                      checked ? horario.periodos[subIndex].id : false,
                                    );
                                  });
                                }}
                                defaultChecked={horario.selectAll}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row row-cols-2 row-cols-lg-3 g-2 g-lg-2">
                          {horario.periodos.map((periodo, subIndex) => {
                            const fieldName = `dia.${horario.nombre}.periodos[${subIndex}].id_periodo`;
                            return (
                              <div className="col d-flex justify-content-around" key={subIndex}>
                                <div>
                                  <label
                                    className="form-check-label me-md-2"
                                    htmlFor={`periodo_${index}_${subIndex}`}
                                  >
                                    {periodo.horario}
                                  </label>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`periodo_${index}_${subIndex}`}
                                    value={periodo.id}
                                    defaultChecked={periodo.checked}
                                    {...register(fieldName)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div>
                {errors.dia && (
                  <span className="text-danger">Seleccione al menos un periodo para un día</span>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-center">
              <button type="submit" className="btn btn-success me-5" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Guardar'}
              </button>

              <button
                className="btn btn-danger"
                type="button"
                onClick={() => {
                  confirmationModal({
                    body: (
                      <>
                        <div>
                          <img src={iconoError} />
                        </div>
                        <div className="pt-md-3">
                          ¿Estás seguro que desea <br /> cancelar los cambios <br /> realizados?
                        </div>
                      </>
                    ),
                    onClickYesTo: '/ambientes/listaAmbientes',
                  });
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarAmbientePage;
