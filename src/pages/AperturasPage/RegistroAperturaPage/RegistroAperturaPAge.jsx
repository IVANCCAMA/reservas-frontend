import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import iconoError from '../../../assets/Images/iconoError.png';
import { useModal, AlertContainer } from '../../../components/Bootstrap';
import Form, { TextInput, Select, NumberInput, DateInput, TextTarea, Accordion, CheckboxInput } from '../../../components/Form';
import { Icon } from '@iconify/react';

const RegistroAperturaPage = () => {
  const database = 'https://backendtis-production.up.railway.app/api';
  const alerts = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];

  const navigate = useNavigate();
  const { confirmationModal } = useModal();
  const alertRef = useRef(null);
  // aux
  const [users, setUsers] = useState([]);
  const [datalistSolicitante, setDatalistSolicitante] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tiposAmbiente, setTiposAmbiente] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [periodos, setPeriodos] = useState([{}]);
  const [allCheckbox, setAllCheckBox] = useState(false);

  const schema = yup.object().shape({
    solicitante: yup.string()
      .required('Ingrese un nombre de un usuario')
      .max(40, 'El nombre debe tener como máximo 40 caracteres'),
    tipo_ambiente: yup.string()
      .required('Seleccione una categoria'),
    listaGrupos: yup.array()
      .of(yup.number().positive().integer(), 'error type')
      .min(1, 'Seleccione al menos una materia'),
    cantidad_est: yup.number()
      .typeError('Ingrese el número de estudiantes')
      .max(500, 'el número de estudiantes debe ser menor a 500')
      .min(20, 'El número de estudiantes debe ser mayor a 20')
      .integer('El número de estudiantes debe ser un número entero'),
    fecha_reserva: yup.date()
      .typeError('Seleccione una fecha valida'),
    motivo: yup.string()
      .max(200, 'El motivo debe tener como máximo 200 caracteres'),
    periodos: yup.array()
      .of(yup.string())
      .min(1, 'Seleccione al menos un horario')
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      solicitante: '',
      tipo_ambiente: '',
      listaGrupos: [],
      cantidad_est: 0,
      fecha_reserva: '',
      motivo: '',
      periodos: [],
    },
  });

  useEffect(() => {
    // recuperar users para el id del solicitante
    axios
      .get(`${database}/usuarios`)
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error('Error al obtener los usuarios:', error);
      });
    // recuperar tipos de ambientes
    setTiposAmbiente([
      { title: 'Aula común', value: 'aula comun' },
      { title: 'Laboratorio', value: 'laboratorio' },
      { title: 'Auditorio', value: 'auditorio' }
    ]);
    // recuperar fechas max min
    axios
      .get(`${database}/aperturas/2`)
      .then(({ data: { apertura_inicio, apertura_fin } }) => {
        const aperturaIni = new Date(Math.max(new Date(), new Date(apertura_inicio))).toISOString().split('T')[0];
        const aperturaFin = new Date(apertura_fin).toISOString().split('T')[0];
        setMinDate(aperturaIni);
        setMaxDate(aperturaFin);
      })
      .catch((error) => {
        console.error('Error al obtener la apertura 2:', error);
      });
    // recuperar periodos
    axios
      .get(`${database}/periodos`)
      .then((response) => {
        setPeriodos(response.data);
      })
      .catch((error) => {
        console.error('Error al obtener los periodos:', error);
      });
  }, []);

  const onSubmit = (data) => {
    setTimeout(() => {
      axios
        .post(`${database}/reservas`, {
          tipo_ambiente: data.tipo_ambiente,
          cantidad_est: data.cantidad_est,
          periodos: data.periodos.map(obj => ({ id_periodo: parseInt(obj) })),
          fecha_reserva: data.fecha_reserva.toISOString().split('T')[0]
        })
        .then((response) => {
          setTimeout(() => {
            navigate('./ambientesDisponibles', {
              state: {
                ...data,
                ambienteDisp: response.data,
              },
            });
          }, 2000);
        })
        .catch((error) => {
          console.error('Error al obtener los ambiente disponibles: ', error);
        })
    }, 2000);
  };

  const handleSolicitante = (newValue) => {
    const value = newValue.replace(/[^a-zA-Z ]/g, '').toUpperCase();
    const filteredValues = users
      .filter(obj => obj.nombre_usuario.includes(value))
      .map(filteredObj => filteredObj.nombre_usuario);
    if (filteredValues.length < 10 && filteredValues.length > 0) {
      setDatalistSolicitante(filteredValues);
    } else {
      setDatalistSolicitante(undefined);
    }
    return value;
  };
  // resuperar materias y grupos
  const searchGroupsByApplicant = (newValue) => {
    const foundUser = users.find(obj => obj.nombre_usuario === newValue);
    if (foundUser?.id_usuario) {
      axios
        .get(`${database}/usuarios/${foundUser.id_usuario}/materias-grupos`)
        .then((response) => {
          const userGroups = response.data['materia-grupo'].map(group => ({
            value: group.id_aux_grupo,
            title: `${group.nombre_materia} - ${group.nombre_grupo}`,
            inscritos: group.cantidad_est
          }));
          alertRef.current?.removeAllAlerts();
          setGrupos(userGroups);
          if (foundUser.tipo_usuario === 'ADMINISTRADOR') {
            setIsAdmin(true);
            setValue('listaGrupos', [userGroups[0]?.value]);
            setValue('cantidad_est', userGroups[0]?.inscritos);
          } else {
            setIsAdmin(false);
            setValue('listaGrupos', []);
            setValue('cantidad_est', 0);
          }
        })
        .catch((error) => {
          setIsAdmin(false);
          setValue('listaGrupos', []);
          setValue('cantidad_est', 0);
          console.error('Error al obtener las materias y grupos:', error);
        });
    }
  };

  const removeGropsSelected = (group) => {
    const groupsFiltered = watch('listaGrupos')?.filter(obj => obj !== group.value);
    setValue('listaGrupos', groupsFiltered);
    setValue('cantidad_est', watch('cantidad_est') - group.inscritos);
  };

  const addGropsSelected = (newValue) => {
    const group = grupos.find(group => group.value === parseInt(newValue));
    if (group && !watch('listaGrupos').includes(group.value)) {
      alertRef.current.addAlert(alerts[watch('listaGrupos').length % 8], group.title, () => removeGropsSelected(group));
      setValue('listaGrupos', [...watch('listaGrupos'), group.value]);
      setValue('cantidad_est', watch('cantidad_est') + group.inscritos);
    }
    return new String();
  };

  const checkedAll = () => {
    setAllCheckBox(prev => {
      if (prev) {
        setValue('periodos', []);
      } else {
        setValue('periodos', periodos.map(periodo => `${periodo.id_periodo}`));
      }
      return !prev;
    });
  };

  const handlePeriodoChange = (newValue) => {
    const periodosId = periodos.map(periodo => periodo.id_periodo.toString());
    const checkedPeriodos = watch('periodos').includes(newValue)
      ? watch('periodos').filter(obj => obj !== newValue)
      : [...watch('periodos'), newValue];
    const _allCheckbox = periodosId.every(id => checkedPeriodos.includes(id));
    setAllCheckBox(_allCheckbox);
  };

  return (<>
    <Form
      title='Formulario de reserva'
      className='needs-validation'
      onSubmit={handleSubmit(onSubmit)}
      onClickCancel={() => {
        confirmationModal({
          body: (<>
            <div><img src={iconoError} /></div>
            <div className="pt-md-3">
              ¿Estás seguro que desea <br /> cancelar el registro de <br /> ambiente?
            </div>
          </>),
          onClickYesTo: '/',
        });
      }}
    >
      <TextInput
        autoComplete='off'
        label='Nombre del solicitante'
        {...register('solicitante')}
        placeholder='Ingrese el nombre del solicitante'
        datalist={datalistSolicitante}
        handleChange={handleSolicitante}
        handleBlur={searchGroupsByApplicant}
        error={errors.solicitante?.message}
      />

      <Select
        label={<>Tipo de ambiente <span className="text-danger ms-1">*</span></>}
        {...register('tipo_ambiente')}
        placeholder='Seleccione el tipo de ambiente'
        options={tiposAmbiente}
        error={errors.tipo_ambiente?.message}
      />

      {!isAdmin && (<>
        <Select
          label={<>Materias y grupos <span className="text-danger ms-1">*</span></>}
          name='listaGrupos'
          placeholder='Seleccionar materias y grupos'
          options={grupos.filter(group => !watch('listaGrupos')?.includes(group.value))}
          handleChange={addGropsSelected}
          error={errors.listaGrupos?.message}
        />

        <div className={`component-animation${watch('tipo_ambiente') !== '' ? ' show' : ''}`}>
          <label className="form-label fw-bold">Lista de materias y grupos añadidos</label>

          <AlertContainer ref={alertRef} />
        </div>
      </>)}

      <div className="row row-cols6">
        <div className="col-md-6">
          <NumberInput
            label='Número de Estudiantes'
            {...register('cantidad_est')}
            disabled={!isAdmin}
            error={errors.cantidad_est?.message}
          />
        </div>
        <div className="col-md-6">
          <DateInput
            label={<>Fecha de reserva <span className="text-danger ms-1">*</span></>}
            {...register('fecha_reserva')}
            minDate={minDate}
            maxDate={maxDate}
            handleChange={(newValue) => {
              setValue('periodos', []); setAllCheckBox(false);
              return new Date(newValue)?.getDay() === 6 ? new String() : undefined;
            }}
            error={errors.fecha_reserva?.message}
          />
        </div>
      </div>

      <TextTarea
        label='Motivos de reserva'
        {...register('motivo')}
        placeholder='Escriba el motivo de la reserva'
        maxLength={201}
        error={errors.motivo?.message}
      />

      <div className='input-component'>
        <label className="form-label fw-bold">
          Periodos y horarios <span className="text-danger ms-1">*</span>
        </label>

        <Accordion id='periodos' accordionItems={[{
          title: 'Selecione periodo/s',
          body:
            <div className="w-100">
              <div className="d-flex justify-content-between pb-2">
                <label>Periodos</label>
                <CheckboxInput
                  checked={allCheckbox}
                  label='Selecionar todos'
                  handleChange={checkedAll}
                  disabled={!watch('fecha_reserva')}
                />
              </div>

              <div className='row row-cols4'>
                {periodos.map((periodo, index) => {
                  const fechaReserva = watch('fecha_reserva');
                  const selectedDay = fechaReserva && new Date(fechaReserva).getDay();
                  if (!fechaReserva || (selectedDay === 5 && periodo.id_periodo > 6)) return;
                  return (
                    <div key={`periodo-${index}`} className='col-md-4 d-flex justify-content-center'>
                      <CheckboxInput
                        label={`${periodo.hora_inicio?.slice(0, 5)} - ${periodo.hora_fin?.slice(0, 5)}`}
                        {...register('periodos')}
                        value={periodo.id_periodo}
                        handleChange={handlePeriodoChange}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
        }]} />
        {errors.periodos && (<span className="text-danger">{errors.periodos.message}</span>)}
      </div>
    </Form>
  </>);
};

export default RegistroAperturaPage;
