// src/services/impressaoService.js
import api from './api';
import { getEmpresa } from '../config';

export const impressaoService = {
  /**
   * Busca todos os dados da NFC-e para montar o cupom.
   */
  buscarDadosNfce: async (numeroNfce) => {
    const response = await api.post('/app/nfceDadosImpressao', {
      empresa: getEmpresa(),
      numero_nfce: numeroNfce,
    });
    return response.data;
  },

  /**
   * Imprime cupom de uma NFC-e autorizada.
   * Abre uma janela oculta com o HTML e chama window.print().
   */
  imprimirCupom: async (numeroNfce, { silent = true, deviceName = '' } = {}) => {
    const dados = await impressaoService.buscarDadosNfce(numeroNfce);
    if (!dados.sucesso) throw new Error(dados.erro || 'Erro ao buscar dados');

    // Se estiver rodando dentro do Electron, usa o IPC
    if (window.electronAPI?.imprimirCupom) {
      return window.electronAPI.imprimirCupom({
        dados,
        silent,
        deviceName,
      });
    }

    // Fallback: navegador (abre janela e chama window.print)
    return impressaoService.imprimirNoNavegador(dados);
  },

  /**
   * Fallback para ambiente web — abre uma nova janela com o HTML e imprime.
   */
  imprimirNoNavegador: async (dados) => {
    const html = impressaoService.gerarHtmlCupom(dados);
    const janela = window.open('', '_blank', 'width=400,height=800');
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
    }, 500);
  },

  /**
   * Gera o HTML completo do cupom (com CSS embutido).
   * 80mm = 302px (96dpi).
   */
  gerarHtmlCupom: (dados) => {
    const { nfce, emitente, destinatario, itens, formas_pagamento, totais, informacoes_complementares, qr_code_url } = dados;

    const fmtMoney = (v) => parseFloat(v || 0).toFixed(2).replace('.', ',');
    const fmtQtd = (v) => parseFloat(v || 0).toString().replace('.', ',');
    const fmtCnpj = (c) => c ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : '';
    const fmtCpf = (c) => c ? c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : '';
    const fmtChave = (c) => c ? c.match(/.{1,4}/g).join(' ') : '';

    const itensHtml = (itens || []).map((i) => `
      <tr>
        <td class="col-cod">${i.prod_cprod}</td>
        <td class="col-desc">${i.prod_xProd}</td>
      </tr>
      <tr class="linha-qtd">
        <td colspan="2">
          ${fmtQtd(i.prod_qcom)} ${i.prod_uCom} x ${fmtMoney(i.prod_vUnCom)}
          <span class="vl-total">R$ ${fmtMoney(i.prod_vProd)}</span>
        </td>
      </tr>
    `).join('');

    const pagHtml = (formas_pagamento || []).map((p) => `
      <div class="linha-pag">
        <span>${p.tot_fp_descricao || 'Forma ' + p.tot_fp_codigo}</span>
        <span>R$ ${fmtMoney(p.tot_fp_valor)}</span>
      </div>
    `).join('');

    const destHtml = (() => {
      if (!destinatario || (!destinatario.dest_cpf && !destinatario.dest_cnpj)) {
        return '<div class="linha"><span>CONSUMIDOR FINAL</span></div>';
      }
      const nome = destinatario.dest_xNome || 'CONSUMIDOR FINAL';
      const doc  = destinatario.dest_cnpj
        ? `CNPJ: ${fmtCnpj(destinatario.dest_cnpj)}`
        : `CPF: ${fmtCpf(destinatario.dest_cpf)}`;
      return `
        <div class="linha"><span>${nome}</span></div>
        <div class="linha"><span>${doc}</span></div>
      `;
    })();

    const avisoAmbiente = (nfce.ambiente === 2)
      ? '<div class="aviso-homolog">EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO<br>SEM VALOR FISCAL</div>'
      : '';

    const avisoContingencia = (nfce.contingencia)
      ? '<div class="aviso-conting">EMITIDA EM CONTINGÊNCIA<br>PENDENTE DE AUTORIZAÇÃO</div>'
      : '';

    const qrCodeImg = qr_code_url
      ? `<div class="qrcode"><img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qr_code_url)}" alt="QR Code"></div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Cupom NFC-e ${nfce.numero}</title>
<style>
      @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      line-height: 1.25;
      width: 76mm;
      padding: 2mm;
      margin: 0;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .linha-nfce { display: flex; justify-content: space-between; font-size: 9px; margin: 1px 0; }
    .sep { border-top: 1px dashed #000; margin: 3px 0; }
    .cabecalho { text-align: center; margin-bottom: 4px; }
    .cabecalho .razao { font-size: 11px; font-weight: bold; }
    .cabecalho .endereco { font-size: 8px; line-height: 1.2; }
    .titulo-danfe { text-align: center; font-size: 9px; font-weight: bold; margin: 3px 0; line-height: 1.2; }
    .chave-wrap { font-size: 8px; text-align: center; word-break: break-all; line-height: 1.2; margin: 2px 0; letter-spacing: 0.5px; }
    .aviso-homolog { background: #000; color: #fff; text-align: center; font-weight: bold; padding: 3px; margin: 3px 0; font-size: 8px; line-height: 1.2; }
    .aviso-conting { border: 2px solid #000; text-align: center; font-weight: bold; padding: 3px; margin: 3px 0; font-size: 8px; line-height: 1.2; }
    .secao-titulo { font-weight: bold; font-size: 9px; margin-top: 4px; margin-bottom: 2px; }
    table.itens { width: 100%; border-collapse: collapse; font-size: 8px; }
    table.itens th { text-align: left; font-weight: bold; font-size: 8px; padding: 1px 0; }
    table.itens td { padding: 0; vertical-align: top; }
    .col-cod { width: 24px; }
    .col-desc { text-align: left; }
    .linha-qtd { font-size: 8px; padding-left: 24px; }
    .linha-qtd .vl-total { float: right; font-weight: bold; }
    .total-linha { display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; margin: 3px 0; padding: 2px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }
    .linha-pag { display: flex; justify-content: space-between; font-size: 9px; margin: 1px 0; }
    .qrcode { text-align: center; margin: 4px 0; }
    .qrcode img { width: 110px; height: 110px; }
    .info-cpl { font-size: 8px; line-height: 1.3; margin-top: 3px; text-align: left; }
    @media print {
      body { width: 76mm; padding: 0 2mm; }
      .qrcode img { width: 100px; height: 100px; }
    }
</style>
</head>
  <body>
    ${avisoContingencia}
    <div class="cabecalho">
      <div class="razao">${emitente.emi_xNome || ''}</div>
      <div class="endereco">${emitente.emi_xLgr || ''}, ${emitente.emi_nro || ''} - ${emitente.emi_xBairro || ''}</div>
      <div class="endereco">${emitente.emi_xMun || ''}/${emitente.emi_uf || ''} - CEP: ${emitente.emi_cep || ''}</div>
      <div class="endereco">CNPJ: ${fmtCnpj(emitente.emi_cnpj || '')}</div>
      <div class="endereco">IE: ${emitente.emi_ie || ''}</div>
      ${emitente.emi_fone ? `<div class="endereco">Tel: ${emitente.emi_fone}</div>` : ''}
    </div>

    <div class="sep"></div>
    <div class="titulo-danfe">DANFE NFC-e — DOCUMENTO AUXILIAR<br>DA NOTA FISCAL DE CONSUMIDOR ELETRÔNICA</div>
    <div class="sep"></div>

    <div class="linha-nfce">
      <span>Nº ${String(nfce.numero).padStart(6, '0')} • Série ${nfce.serie}</span>
      <span>${nfce.data_emissao} ${nfce.hora_emissao}</span>
    </div>
    <div class="linha-nfce">
      <span>Protocolo: ${nfce.protocolo || '-'}</span>
    </div>

    <div class="chave-wrap">${fmtChave(nfce.chave || '')}</div>

    <div class="center" style="font-size: 8px; margin-top: 2px;">
      Consulte pela chave em www.sefaz.mt.gov.br/nfce
    </div>

    ${avisoAmbiente}

    <div class="sep"></div>
    <div class="secao-titulo">DESTINATÁRIO</div>
    ${destHtml}

    <div class="sep"></div>
    <div class="secao-titulo">ITENS</div>
    <table class="itens">
      <thead>
        <tr>
          <th class="col-cod">Cód.</th>
          <th class="col-desc">Descrição</th>
        </tr>
      </thead>
      <tbody>
        ${itensHtml}
      </tbody>
    </table>

    <div class="sep"></div>
    <div class="linha-nfce"><span>Subtotal</span><span>R$ ${fmtMoney(totais.tot_icms_vProd)}</span></div>
    ${parseFloat(totais.tot_icms_Desc || 0) > 0
      ? `<div class="linha-nfce"><span>Desconto</span><span>R$ ${fmtMoney(totais.tot_icms_Desc)}</span></div>`
      : ''}
    <div class="total-linha">
      <span>TOTAL</span>
      <span>R$ ${fmtMoney(totais.tot_icms_vNF)}</span>
    </div>

    <div class="sep"></div>
    <div class="secao-titulo">FORMAS DE PAGAMENTO</div>
    ${pagHtml}

    ${qrCodeImg}

    <div class="sep"></div>
    <div class="info-cpl">${informacoes_complementares || ''}</div>
    <div class="sep"></div>
    <div class="center" style="font-size: 8px;">Emitido por Facilit PDV</div>
  </body>
</html>`;
  },
};