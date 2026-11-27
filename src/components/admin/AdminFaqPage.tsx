"use client";

/**
 * Tela "Perguntas Frequentes" do painel: cria, edita, ordena, ativa e exclui.
 * Spec: SPEC/2026-11-27-faq-gerenciado-admin.md
 */
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, HelpCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFaqService } from "@/hooks/useFaqService";
import { LIMITES_FAQ, proximaOrdem, validarItemFaq } from "@/lib/faq/regrasFaq";
import { CATEGORIAS_FAQ, type CategoriaFaq, type DadosItemFaq, type ErrosItemFaq, type ItemFaq } from "@/lib/faq/types";

const VAZIO: DadosItemFaq = { pergunta: "", resposta: "", categoria: "geral" };
const CLASSE_CAMPO =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none";

type Resultado = { ok: true } | { ok: false; mensagem: string };

function avisarFalha(resultado: Resultado | null): boolean {
  if (resultado && !resultado.ok) toast.error(resultado.mensagem);
  return !!resultado?.ok;
}

export function AdminFaqPage() {
  const { itens, carregando, erro, salvar, excluir, mover, alternarAtivo } = useFaqService("admin");
  const [editando, setEditando] = useState<ItemFaq | "novo" | null>(null);
  const [dados, setDados] = useState<DadosItemFaq>(VAZIO);
  const [erros, setErros] = useState<ErrosItemFaq>({});
  const [salvando, setSalvando] = useState(false);

  function abrir(item: ItemFaq | "novo") {
    setEditando(item);
    setDados(item === "novo" ? VAZIO : { pergunta: item.pergunta, resposta: item.resposta, categoria: item.categoria });
    setErros({});
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validarItemFaq(dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0 || !editando) return;

    setSalvando(true);
    const resultado = await salvar(
      editando === "novo"
        ? { ...dados, ordem: proximaOrdem(itens), ativo: true }
        : { ...editando, ...dados }
    );
    setSalvando(false);
    if (!resultado.ok) {
      setErros(resultado.erros ?? {});
      toast.error(resultado.mensagem);
      return;
    }
    toast.success(editando === "novo" ? "Pergunta criada." : "Pergunta atualizada.");
    setEditando(null);
  }

  async function confirmarExclusao(id: string) {
    if (!window.confirm("Excluir esta pergunta? Esta ação não pode ser desfeita.")) return;
    if (avisarFalha(await excluir(id))) toast.success("Pergunta excluída.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-black text-white">Perguntas Frequentes</h1>
            <p className="text-sm text-slate-400">Só as perguntas ativas aparecem no site, nesta ordem.</p>
          </div>
        </div>
        <Button onClick={() => abrir("novo")}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nova pergunta
        </Button>
      </header>

      {editando && (
        <form onSubmit={enviar} noValidate className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="space-y-1">
            <Label htmlFor="faq-pergunta">Pergunta</Label>
            <Input
              id="faq-pergunta"
              value={dados.pergunta}
              maxLength={LIMITES_FAQ.pergunta.max}
              aria-invalid={!!erros.pergunta}
              onChange={(e) => setDados({ ...dados, pergunta: e.target.value })}
            />
            {erros.pergunta && <p className="text-xs text-red-400">{erros.pergunta}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="faq-resposta">Resposta</Label>
            <textarea
              id="faq-resposta"
              rows={4}
              value={dados.resposta}
              maxLength={LIMITES_FAQ.resposta.max}
              aria-invalid={!!erros.resposta}
              className={CLASSE_CAMPO}
              onChange={(e) => setDados({ ...dados, resposta: e.target.value })}
            />
            {erros.resposta && <p className="text-xs text-red-400">{erros.resposta}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="faq-categoria">Categoria</Label>
            <select
              id="faq-categoria"
              value={dados.categoria}
              className={CLASSE_CAMPO}
              onChange={(e) => setDados({ ...dados, categoria: e.target.value as CategoriaFaq })}
            >
              {Object.entries(CATEGORIAS_FAQ).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Salvar pergunta
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
          </div>
        </form>
      )}

      {erro && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>
      )}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando perguntas…</p>
      ) : (
        <ol className="space-y-2">
          {itens.map((item, indice) => (
            <li
              key={item.id}
              data-testid={`faq-item-${item.id}`}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{item.pergunta}</p>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-slate-400">{item.resposta}</p>
                <p className="mt-1 flex gap-2 text-xs text-slate-500">
                  {CATEGORIAS_FAQ[item.categoria]}
                  {!item.ativo && <span className="rounded bg-slate-700 px-1.5 text-slate-200">Inativa</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <BotaoIcone rotulo="Subir" icone={ArrowUp} desabilitado={indice === 0}
                  aoClicar={async () => avisarFalha(await mover(item.id, "cima"))} />
                <BotaoIcone rotulo="Descer" icone={ArrowDown} desabilitado={indice === itens.length - 1}
                  aoClicar={async () => avisarFalha(await mover(item.id, "baixo"))} />
                <BotaoIcone rotulo="Editar" icone={Pencil} aoClicar={() => abrir(item)} />
                <BotaoIcone rotulo={item.ativo ? "Desativar" : "Ativar"} icone={item.ativo ? EyeOff : Eye}
                  aoClicar={async () => avisarFalha(await alternarAtivo(item.id))} />
                <BotaoIcone rotulo="Excluir" icone={Trash2} aoClicar={() => confirmarExclusao(item.id)} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function BotaoIcone({
  rotulo,
  icone: Icone,
  aoClicar,
  desabilitado = false,
}: {
  rotulo: string;
  icone: React.ComponentType<{ className?: string }>;
  aoClicar: () => unknown;
  desabilitado?: boolean;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={rotulo} title={rotulo}
      disabled={desabilitado} onClick={() => void aoClicar()}>
      <Icone className="h-4 w-4" />
    </Button>
  );
}
