import { FaHeadset } from 'react-icons/fa';

export default function Support() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
            <FaHeadset size={40} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Central de Suporte</h1>
        <p className="text-slate-600 mb-6">
          Precisa de ajuda com o sistema? Entre em contato com nossa equipe técnica.
        </p>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition">
          Abrir Chamado
        </button>
      </div>
    </div>
  );
}