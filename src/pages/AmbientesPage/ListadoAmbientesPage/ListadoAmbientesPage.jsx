import { useEffect, useState } from 'react';
import './ListadoAmbientesPage.scss';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Table from '../../../components/Table/Table';
import Pagination from '../../../components/Pagination/Pagination';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useAppSelector } from '../../../redux/app/hooks';
import { useModal } from '../../../components/Bootstrap/ModalContext';
import { useNotification } from '../../../components/Bootstrap/NotificationContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Form, {
  TextInput,
  Select,
  NumberInput,
  DateInput,
  TextTarea,
  Accordion,
  CheckboxInput,
} from '../../../components/Form';
const schema = yup.object().shape({
  motivo: yup.string().required('El motivo es obligatorio'),
  // Agrega aquí las demás reglas de validación que necesites
});

const ListadoAmbientesPage = () => {
  // reduxs
  const user = useAppSelector((state) => state.auth.usuario);

  const baseURL = import.meta.env.VITE_APP_DOMAIN;
  // estados
  const [pageNumber, setPageNumber] = useState(1);
  const [ambientes, setAmbientes] = useState([{}]);
  const { confirmationModal, errorModal, newModal, successModal } = useModal();

  const { loadNotification, errorNotification, successNotification } = useNotification();

  const {
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      motivo: '',
    },
  });

  const enviarDatos = (motivo, id_ambiente) => {
    loadNotification({
      body: 'Enviando datos...',
      onTimeout: () => {
        axios
          .post(`${baseURL}/ambientes/editar-disponibilidad`, { motivo, id_ambiente })
          .then((response) => {
            if (response.status === 200) {
              successNotification({
                body: 'Enviado correctamente',
                afterTimeout: () =>
                  navigate('/reservas/ambientesDisponibles', {
                    /* state: {
                        ...data,
                        setGrupos: grupos,
                        ambienteDisp: response.data,
                      }, */
                  }),
              });

              /* successModal({
              body: <>Cambios guardados con éxito</>,
              onClickTo: '/ambientes/listaAmbientes',
            }); */
            } else {
              /* errorModal({ content: errorModalContent }); */
              errorNotification({ body: 'Error al enviar, intente de nuevo' });
            }
          })
          .catch((error) => {
            console.error('Error al editar', error);
            errorNotification({ body: 'Error al enviar, intente de nuevo' });
            /* errorModal({ content: errorModalContent }); */
          });
      },
    });
  };

  const onSubmitMotivo = (data) => {
    confirmationModal({
      body: (
        <div>
          <Icon icon="mi:circle-information" width="70" height="70" style={{ color: '#FF6B00' }} />
          <div className="pt-md-4">
            ¿Está seguro de deshabilitar el ambiente {data.ambiente.nombre_ambiente} por el motivo "
            {data.motivo}"?
          </div>
        </div>
      ),
      onClickYes: () => {
        enviarDatos(data.motivo, data.ambiente.id_ambiente);
      },
    });
  };

  function actionEditar(amb) {
    if (amb.disponible) {
      setValue('ambiente', amb);
      newModal({
        body: (
          <Form
            onSubmit={handleSubmit(onSubmitMotivo)}
            onClickCancel={() => {
              confirmationModal({
                body: (
                  <>
                    <Icon
                      className="iconAlert"
                      icon="charm:circle-cross"
                      style={{ color: '#FF3B20', height: '90px', width: '90px' }}
                    />
                    <div className="pt-md-3">
                      ¿Estás seguro que desea <br /> cancelar el registro de <br /> reserva?
                    </div>
                  </>
                ),
                onClickYesTo: '/',
              });
            }}
            ismodal={true}
          >
            <h4 className="mb-3">
              <b>Deshabilitar Ambiente</b>
            </h4>
            <div className="text-start fw-bold pb-0 pe-1">Motivo</div>

            <textarea
              {...register('motivo')}
              rows={2}
              maxLength={350}
              type="text"
              className="form-control"
              placeholder="Escriba el motivo"
            />
          </Form>
        ),
        onClickYes,
      });
    } else {
      confirmationModal({
        body: (
          <div>
            <Icon
              icon="mi:circle-information"
              width="70"
              height="70"
              style={{ color: '#FF6B00' }}
            />
            <div className="pt-md-4">
              ¿Está de acuerdo en habilitar el ambiente {amb.nombre_ambiente}?
            </div>
          </div>
        ),
        onClickYesTo: '/materias/listaMaterias',
      });
    }
  }

  // logica | api

  const loadAmbientes = () => {
    axios
      .get(`${baseURL}/ambientes`)
      .then((response) => {
        setAmbientes(
          response.data.map((amb) => {
            if (user.tipo_usuario === 'ADMINISTRADOR') {
              return {
                Aula: amb.nombre_ambiente,
                Capacidad: amb.capacidad,
                Disponibilidadxd: (
                  <div className=" align-items-center  d-flex ">
                    <span className="">{amb.disponible ? 'HABILITADO' : 'DESHABILITADO'}</span>
                    <button
                      className="btn btn-primary p-0  ms-2 "
                      onClick={() => {
                        actionEditar(amb);
                      }}
                    >
                      <Icon
                        icon="iconamoon:edit-light"
                        width="36"
                        height="36"
                        style={{ color: 'whiteS' }}
                        className="boton-icon"
                      />
                    </button>
                  </div>
                ),

                Tipo: amb.tipo.toUpperCase(),
                Proyector: amb.proyector ? 'SI' : 'NO',
                Editar: (
                  <div className="boton-editar text-center me-md-3 rounded">
                    <Link
                      to={'/ambientes/listaAmbientes/editar/' + amb.id_ambiente}
                      className="btn border border-0"
                    >
                      <div>
                        <Icon icon="fa6-regular:pen-to-square" className="boton-icon" />
                      </div>
                    </Link>
                  </div>
                ),
                'Ver más': (
                  <div className="boton-style text-center me-md-3 rounded">
                    <Link
                      to={'/ambientes/listaAmbientes/fichaAmbiente/' + amb.id_ambiente}
                      className="btn border border-0"
                    >
                      <div>
                        <Icon icon="gg:arrow-right-r" className="boton-icon" />
                      </div>
                    </Link>
                  </div>
                ),
              };
            } else {
              return {
                Aula: amb.nombre_ambiente,
                Capacidad: amb.capacidad,
                Disponibilidad: amb.disponible ? 'HABILITADO' : 'DESHABILITADO',
                Tipo: amb.tipo.toUpperCase(),
                Proyector: amb.proyector ? 'SI' : 'NO',
                'Ver más': (
                  <div className="boton-style text-center me-md-3 rounded">
                    <Link
                      to={'/ambientes/listaAmbientes/fichaAmbiente/' + amb.id_ambiente}
                      className="btn border border-0"
                    >
                      <div>
                        <Icon icon="gg:arrow-right-r" className="boton-icon" />
                      </div>
                    </Link>
                  </div>
                ),
              };
            }
          }),
        );
      })
      .catch((error) => {
        console.error('Error al obtener los ambientes:', error);
      });
  };

  // rederización inicial
  useEffect(() => {
    loadAmbientes();
  }, []);

  return (
    <div className="container-fluid listado-ambientes p-md-5">
      <h2 className="text-start">Lista de ambientes</h2>
      <Table rows={ambientes} firstRow={(pageNumber - 1) * 10} lastRow={pageNumber * 10} />

      <Pagination
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        lastPage={Math.max(Math.floor((ambientes.length - 1) / 10) + 1, 1)}
      />
    </div>
  );
};
export default ListadoAmbientesPage;
