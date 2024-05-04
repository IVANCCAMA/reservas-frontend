import React, { ReactNode, useState } from 'react';

interface FormProps {
  children: any;
  onSubmit: () => void;
  title?: string;
  onClickCancel?: () => void;
}

const Form: React.FC<FormProps> = ({
  children,
  onSubmit,
  title = '',
  onClickCancel = () => { },
  ...rest
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmit(); // Llama al onSubmit pasado como parte de rest, si existe
    setIsSubmitting(false);
  };

  return (
    <div className="container">
      <div className="row py-md-3 justify-content-center">
        <div className="col-md-8">
        <form {...{ ...rest, className: `${rest.className || ''} form-component`, onSubmit: handleOnSubmit }}>
            {title && (<h2 className="text-md-center">{title}</h2>)}

            {children}

            <div className="d-flex justify-content-center pt-3">
              <button
                type="submit"
                className="btn btn-success me-md-5"
                disabled={isSubmitting}
                style={{ width: "86px" }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isSubmitting}
                onClick={onClickCancel}
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

export default Form;
