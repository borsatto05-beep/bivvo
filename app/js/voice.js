/* Bivvo Voz — reconhecimento de fala do próprio navegador (sem servidor, sem custo, sem gravar áudio).
   O texto reconhecido passa pelo mesmo interpretador da captura rápida e SEMPRE vai para confirmação. */
const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
export const voiceSupported = () => !!SR();

/* Começa a ouvir. Retorna { stop }. onText(texto, final) é chamado a cada trecho reconhecido. */
export function listen({ onText, onEnd, onError }) {
  const Rec = SR();
  if (!Rec) { onError?.('Este navegador não reconhece fala. Digite o gasto.'); return { stop() {} }; }
  const rec = new Rec();
  rec.lang = 'pt-BR'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  let finalText = '', ended = false;
  const guard = setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } }, 12000);
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t; else interim += t;
    }
    onText?.((finalText + ' ' + interim).trim(), !interim);
  };
  rec.onerror = e => {
    const msg = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Permita o uso do microfone para falar o gasto.'
      : e.error === 'no-speech' ? 'Não ouvi nada. Toque no microfone e fale de novo.'
      : e.error === 'network' ? 'O reconhecimento de fala precisa de internet neste aparelho.' : 'Não consegui ouvir. Tente de novo ou digite.';
    onError?.(msg);
  };
  rec.onend = () => { clearTimeout(guard); if (!ended) { ended = true; onEnd?.(finalText.trim()); } };
  try { rec.start(); } catch { onError?.('O microfone já está em uso.'); }
  return { stop() { try { rec.stop(); } catch { /* ignore */ } } };
}
