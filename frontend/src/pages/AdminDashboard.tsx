export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Administração plena</h1>
        <p className="text-slate-500">Configure municípios, projetos, mensagens automáticas e templates de microações.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-slate-700">Municípios</h2>
          <p className="text-slate-500 text-sm">Gerencie cidades e status de participação.</p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-slate-700">Projetos</h2>
          <p className="text-slate-500 text-sm">Defina datas, dias e associações por município.</p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-slate-700">Relatórios</h2>
          <p className="text-slate-500 text-sm">Exporte CSV e PDF para acompanhamento executivo.</p>
        </div>
      </div>
      <div className="bg-white border rounded p-4 shadow-sm">
        <h2 className="font-semibold text-slate-700">Mensagens automáticas</h2>
        <p className="text-slate-500 text-sm">Agende envios segmentados por público-alvo (todos, município ou projeto). Uploads de mídia são enviados ao Cloudinary.</p>
        <form className="mt-4 space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Título" />
          <textarea className="w-full border rounded px-3 py-2" placeholder="Conteúdo" rows={3} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="border rounded px-3 py-2" defaultValue="DAILY">
              <option value="DAILY">Diária</option>
              <option value="WEEKLY">Semanal</option>
              <option value="CUSTOM">Personalizada</option>
            </select>
            <input className="border rounded px-3 py-2" type="datetime-local" />
            <select className="border rounded px-3 py-2" defaultValue="ALL">
              <option value="ALL">Todos</option>
              <option value="MUNICIPALITY">Município</option>
              <option value="PROJECT">Projeto</option>
            </select>
          </div>
          <button type="button" className="bg-indigo-600 text-white px-4 py-2 rounded">
            Salvar agendamento
          </button>
        </form>
      </div>
    </div>
  );
}
