import React from 'react';
import PropTypes from 'prop-types';
import { useAppDispatch, useAppSelector } from '../../../redux/app/hooks.js';
import { Link } from 'react-router-dom';
import { logout } from '../../../redux/features/auth/auth-slice.js';
import { Icon } from '@iconify/react/dist/iconify.js';

/**
 * Single SidebarOption, verifica si el usuario esta logeado y controla la visualización
 * y acceso a opciones y subopciones
 * @param option
 * @param subOptions
 * @param icon
 * @param forTypeUser
 * @param to
 * @param viewSubs
 * @param isViewProtected
 * @constructor
 */
const SidebarOption = ({
  index,
  option,
  subOptions,
  icon,
  forTypeUser,
  to,
  viewSubs,
  isViewProtected,
}) => {
  // redux
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.usuario);

  if (to === '/logout') {
    return (
      <button
        className="btn"
        onClick={() => {
          dispatch(logout());
        }}
      >
        <span className="me-2">
          <Icon icon="solar:logout-2-outline" width="30" height="30" style={{ color: '#5C5B5B' }} />
        </span>
        {option}
      </button>
    );
  }

  // Visualizacion por tipo de usuario
  if (forTypeUser === user.tipo_usuario) {
    return (
      <li key={index} className="nav-item w-100">
        <button
          className="btn btn-toggle d-inline-flex w-100 d-flex align-items-center collapsed justify-content-between"
          data-bs-toggle="collapse"
          data-bs-target={`#${option}-collapse`}
          aria-expanded="false"
        >
          <div>
            <Icon icon={icon} width="45" height="45" style={{ color: '#215f88' }} />
            <span className="ms-2">{option}</span>
          </div>
          <span>
            <Icon
              className="fas fa-angle-down rotate-icon"
              icon="iconamoon:arrow-down-2"
              width="35"
              height="35"
              style={{ color: '#5C5B5B' }}
            />
          </span>
        </button>

        <div className="collapse ms-5" id={`${option}-collapse`}>
          <ul className="nav nav-pills flex-column mb-auto btn-toggle-nav list-unstyled">
            {subOptions.map((sub, subIndex) => (
              <li key={`nav-item-${index}-${subIndex}`}>
                <Link
                  to={sub.to}
                  className="nav-link link-body-emphasis d-inline-flex text-decoration-none rounded"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </li>
    );
  } else {
    if (!isViewProtected) {
      if (viewSubs) {
        return (
          <li key={index} className="nav-item w-100">
            <button
              className="btn btn-toggle d-inline-flex w-100 d-flex align-items-center collapsed justify-content-between"
              data-bs-toggle="collapse"
              data-bs-target={`#${option}-collapse`}
              aria-expanded="false"
            >
              <div>
                <Icon icon={icon} width="45" height="45" style={{ color: '#215f88' }} />
                <span className="ms-2">{option}</span>
              </div>
              <span>
                <Icon
                  className="fas fa-angle-down rotate-icon"
                  icon="iconamoon:arrow-down-2"
                  width="35"
                  height="35"
                  style={{ color: '#5C5B5B' }}
                />
              </span>
            </button>

            <div className="collapse ms-5" id={`${option}-collapse`}>
              <ul className="nav nav-pills flex-column mb-auto btn-toggle-nav list-unstyled">
                {subOptions.map((sub, subIndex) => (
                  <li key={`nav-item-${index}-${subIndex}`}>
                    <Link
                      to={sub.to}
                      className="nav-link link-body-emphasis d-inline-flex text-decoration-none rounded"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      } else {
        return (
          <li key={index} className="nav-item w-100">
            <Link
              to={to}
              className="btn d-inline-flex w-100 d-flex align-items-center collapsed justify-content-between "
            >
              <div>
                <Icon icon={icon} width="45" height="45" style={{ color: '#215f88' }} />
                <span className="ms-2">{option}</span>
              </div>
            </Link>
          </li>
        );
      }
    }
  }
  return <></>;
};
SidebarOption.propTypes = {
  option: PropTypes.string.isRequired,
  subOptions: PropTypes.array,
  icon: PropTypes.string,
  forTypeUser: PropTypes.string,
  to: PropTypes.string,
  viewSubs: PropTypes.bool,
  isViewProtected: PropTypes.bool,
};
export default SidebarOption;
