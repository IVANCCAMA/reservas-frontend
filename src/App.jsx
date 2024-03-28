import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ExamplePage from './pages/ExamplePage/ExamplePage';
import HomePage from './pages/HomePage/HomePage';
import ListadoAmbientesPage from './pages/AmbientesPage/ListadoAmbientesPage/ListadoAmbientesPage';
import ListadoMateriasPage from './pages/MateriasPage/ListadoMateriasPage/ListadoMateriasPage';
import SubirMatariasPage from './pages/MateriasPage/SubirMatariasPage/SubirMatariasPage';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <div className="row">
          {/* Menu */}
          <div className="col-2 border border-1 border-black">
            Menu aqui
          </div>
          <div className="col-10">
            <Routes>
              <Route index element={<ExamplePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/ambientes" element={<ListadoAmbientesPage />} />
              <Route path="/materias" element={<ListadoMateriasPage />} />
              <Route path="/materias/subir-materia" element={<SubirMatariasPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
