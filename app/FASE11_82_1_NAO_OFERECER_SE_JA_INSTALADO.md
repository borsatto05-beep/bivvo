# Bivvo 11.82.1 — não oferecer instalação quando já instalado

- O popup de instalação não é exibido quando o Bivvo está rodando como app Android empacotado via Capacitor.
- O popup também não é exibido quando o Bivvo foi adicionado à Tela de Início como PWA/standalone no Android ou iPhone.
- O CTA de download Android da landing é ocultado dentro do app instalado.
- No navegador comum, o comportamento continua: Android recebe download do APK; iPhone recebe instruções de instalação pelo Safari.
- Observação: um navegador comum não consegue detectar de forma confiável se um APK separado está instalado no aparelho; a detecção vale quando o usuário abre o Bivvo já instalado.
