import { AcoesEvento } from '@/acoes/AcoesEvento';
import { Formulario } from '@/components/Formulario';
import { Opcoes } from '@/components/ui';
import { Evento } from '@/dominio/Evento';

type Props = { evento: Evento; processos: { id: string; rotulo: string }[] };

export function FormEvento({ evento: e, processos }: Props) {
  return (
    <Formulario acao={AcoesEvento.salvar} rotulo="Salvar compromisso" cancelar="/agenda">
      <input type="hidden" name="id" value={e.id} />
      <div className="campos">
        <div className="campo largo"><label htmlFor="titulo">Título</label><input id="titulo" name="titulo" type="text" defaultValue={e.titulo} placeholder="Ex.: Audiência de instrução" required /></div>
        <div className="campo">
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={e.tipo}>{Object.entries(Evento.TIPOS).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
        </div>
        <div className="campo"><label htmlFor="data">Data</label><input id="data" name="data" type="date" defaultValue={e.dia.iso} required /></div>
        <div className="campo"><label htmlFor="hora">Início</label><input id="hora" name="hora" type="time" defaultValue={e.hora} required /></div>
        <div className="campo"><label htmlFor="hora_fim">Término (opcional)</label><input id="hora_fim" name="hora_fim" type="time" defaultValue={e.horaFim} /></div>
        <div className="campo largo"><label htmlFor="local">Local ou link</label><input id="local" name="local" type="text" defaultValue={e.local} /></div>
        <div className="campo largo">
          <label htmlFor="processo_id">Processo</label>
          <select id="processo_id" name="processo_id" defaultValue={e.processo_id}><option value="">Nenhum</option><Opcoes itens={processos} /></select>
        </div>
        <div className="campo largo"><label htmlFor="observacoes">Observações</label><textarea id="observacoes" name="observacoes" defaultValue={e.observacoes} /></div>
      </div>
    </Formulario>
  );
}
