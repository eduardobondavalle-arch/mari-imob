import Link from "next/link";

export const metadata = { title: "Privacidade e seus dados" };

export default function Page() {
  return (
    <article className="container legal section">
      <p className="eyebrow">PRIVACIDADE</p>
      <h1>Seus dados, suas escolhas.</h1>
      <p>
        Este site utiliza primeiro nome, telefone, imóveis selecionados e
        solicitações de contato para manter sua seleção e permitir atendimento
        pela Mari Corretora de Imóveis.
      </p>
      <h2>Seleção por telefone</h2>
      <p>
        O telefone funciona como identificador de uma seleção de conveniência e
        permite recuperá-la em outro dispositivo, sem senha, SMS ou WhatsApp. A
        seleção contém somente informações públicas dos imóveis disponíveis no
        catálogo. Esse acesso não confirma a identidade da pessoa e não libera
        nome, telefone, histórico de atendimento, anotações do CRM, documentos,
        dados financeiros, endereços privados ou recursos administrativos.
      </p>
      <h2>Links compartilhados</h2>
      <p>
        O link da seleção exibe apenas imóveis públicos disponíveis. Nome,
        telefone e demais dados pessoais não aparecem nesse link. Quem receber
        o link não pode alterar a seleção original.
      </p>
      <h2>Cookies e fornecedores</h2>
      <p>
        Usamos cookies essenciais para manter sessões técnicas. Os serviços de
        hospedagem, banco de dados e armazenamento podem processar os dados
        necessários a suas funções. Links de WhatsApp e Instagram abrem
        serviços externos com políticas próprias.
      </p>
      <h2>Controle e exclusão</h2>
      <p>
        Na área Minha Seleção, você pode adicionar e remover imóveis públicos.
        Como o telefone não verifica identidade, ele não autoriza exportar,
        alterar ou excluir dados pessoais do cadastro. Para correção, acesso ou
        exclusão de dados pessoais, entre em contato com a Mari por um canal de
        atendimento para que a identidade seja confirmada de forma adequada.
      </p>
      <h2>Conservação</h2>
      <p>
        Os dados permanecem enquanto o cadastro estiver ativo ou até uma
        solicitação válida de exclusão, ressalvadas obrigações aplicáveis.
        Registros técnicos de segurança têm retenção limitada. O acesso
        administrativo é restrito.
      </p>
      <div className="button-row">
        <Link className="button" href="/minha-selecao">
          Acessar minha seleção
        </Link>
        <Link className="button secondary" href="/contato">
          Solicitar atendimento
        </Link>
      </div>
    </article>
  );
}
