# Bivvo 11.76 — Android / Google Play

Este pacote está preparado para transformar o Bivvo em um app Android nativo usando Capacitor 8.

## Identidade Android
- Nome: **Bivvo**
- Application ID: **com.maisbivvo.app**
- Web bundle: `dist/`
- Capacitor: **8.5.3**
- Target SDK esperado pelo Capacitor 8: **API 36**

> IMPORTANTE: o Application ID da Play Store não pode ser trocado depois da primeira publicação. Se quiser outro identificador, altere `appId` em `capacitor.config.json` ANTES de criar/publicar o app.

## O que instalar no Windows
1. Node.js 22 ou superior.
2. Android Studio 2025.2.1 ou superior.
3. Android SDK API 36 pelo SDK Manager.

O Android Studio instala o JDK adequado automaticamente.

## Preparar com 1 clique
Abra o PowerShell dentro da pasta do Bivvo e execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\PREPARAR-ANDROID.ps1
```

O script:
1. instala Capacitor;
2. gera a build web;
3. cria `android/` se necessário;
4. gera ícone/splash do Bivvo;
5. aplica permissões Android necessárias;
6. sincroniza `dist/` com o projeto Android.

Depois execute:

```powershell
npx cap open android
```

## Testar no celular
No Android Studio:
1. Conecte um Android por USB e ative Depuração USB, ou crie um emulador.
2. Selecione o aparelho no topo.
3. Clique em **Run ▶**.
4. Teste login, sincronização, cartões, orçamento, câmera do comprovante, WhatsApp, exclusão de conta e Bivvo Capital.

## Gerar AAB para Play Store
Quando os testes estiverem corretos:
1. Android Studio → **Build** → **Generate Signed App Bundle / APK**.
2. Escolha **Android App Bundle**.
3. Crie um novo keystore e guarde-o com segurança.
4. Selecione `release`.
5. Finalize a build.

O arquivo `.aab` será o pacote enviado ao Google Play Console.

## Segurança
- `usesCleartextTraffic=false`: bloqueia HTTP não criptografado no app Android.
- Câmera marcada como opcional para o scanner de comprovantes.
- INTERNET habilitado para Supabase/API.
- O Service Worker da PWA é desativado dentro do Capacitor para evitar cache duplo.
- Web Push da PWA fica desativado dentro do container Android. Notificação nativa deve ser integrada em uma etapa própria antes de depender dela na Play Store.

## Atualizações futuras do Bivvo
Sempre que alterar o app web:

```powershell
npm run build
npx cap sync android
```

Depois abra/recompile no Android Studio.
