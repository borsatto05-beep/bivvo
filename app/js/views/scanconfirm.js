/* Leitura abre o mesmo formulário usado para cadastrar um gasto normal. */
import { h } from '../util.js';
import { openSheet } from '../ui.js';
import { openTxForm } from './forms.js';
import { openSmartCapture } from '../quickcapture.js';
export function openScanConfirm(d = {}) {
  openTxForm({mode:'expense',preset:{desc:d.merchant||'',value:d.value??null,date:d.date||'',captureSource:'scan',requireDate:true}});
}

export function openScanUnavailable(reason) {
  const text = reason === 'demo' ? 'A leitura de comprovantes usa sua conta (são 5 leituras grátis por mês). Na demonstração, digite ou fale o gasto.'
    : 'A leitura de comprovantes ainda não foi ativada neste Bivvo. Enquanto isso, digite ou fale o gasto.';
  const sheet = openSheet({ title: 'Leitura de comprovante', content: h('p.sheet-text', text),
    footer: [h('button.btn.ghost', { type: 'button', onclick: () => sheet.close() }, 'Fechar'), h('button.btn.primary', { type: 'button', onclick: () => { sheet.close(); setTimeout(() => openSmartCapture(), 150); } }, 'Digitar o gasto')] });
}
