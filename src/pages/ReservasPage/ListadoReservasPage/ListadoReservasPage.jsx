import { useEffect, useState } from 'react';
// import './ListadoMateriasPage.scss';
import axios from 'axios';
import Table from '../../../components/Table/Table';
import Pagination from '../../../components/Pagination/Pagination';
import { useAppSelector } from '../../../redux/app/hooks';

const ListadoMateriasPage = () => {
  const baseURL = import.meta.env.VITE_APP_DOMAIN;

  const [pageNumber, setPageNumber] = useState(1);
  const [reservas, setReservas] = useState([{}]);

  //redux
  const user = useAppSelector((state) => state.auth.usuario);

  // >>> FUTURO : FILTROS <<<
  // obtener valores de un key
  // const materiasKey = reservas.map(mat => mat.Nivel);

  // filtro para obtener solo los valores únicos
  // const keyUnicos = [...new Set(materiasKey)];

  const loadReservas = () => {
    let apiUsuario = '/lista_reservas';
    if (user.tipo_usuario !== 'ADMINISTRADOR') {
      apiUsuario = `/reserva-usuario/${user.id_usuario}`;
    }

    axios
      .get(`${baseURL}/reservas${apiUsuario}`)
      .then((response) => {
        setReservas(
          response.data.map((reserv) => {
            return {
              Registro: reserv.registro_reserva,
              Solicitante: reserv.nombre_usuario,
              Fecha: reserv.fecha_reserva.slice(0, 10),
              Horario: `${reserv.hora_inicio.slice(0, 5)} - ${reserv.hora_fin.slice(0, 5)}`,
              'Materia - Grupo': reserv.nombre_materia,
              Cantidad: reserv.cantidad_est,
              Ambiente: reserv.nombre_ambiente,
              'Min-Capacidad-Max': reserv.min_cap_max,
            };
          }),
        );
      })
      .catch((error) => {
        console.error('Error al obtener las reservas:', error);
      });
  };

  useEffect(() => {
    loadReservas();
  }, []);

  return (
    <>
      {reservas.length > 1 ? (
        <div className="container-fluid listado-ambientes p-md-5 vh-100">
          <>
            <h2 className="text-start">Lista de reservas</h2>

            {/* Se puede parametrizar la cantidad de filas mostradas por hojas */}
            <Table rows={reservas} firstRow={(pageNumber - 1) * 10} lastRow={pageNumber * 10} />

            <Pagination
              pageNumber={pageNumber}
              setPageNumber={setPageNumber}
              lastPage={Math.max(Math.floor((reservas.length - 1) / 10) + 1, 1)}
            />
          </>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-center align-items-center vh-100 overflow-auto">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ListadoMateriasPage;
