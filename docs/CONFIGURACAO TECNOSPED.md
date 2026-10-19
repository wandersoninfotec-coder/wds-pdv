3. Manual — Configuração do TecnoSpeed no servidor

Vou descrever o que já sei pela estrutura que você me passou, marcando o que precisa ser confirmado.
3.1 — Onde o TecnoSpeed roda

Roda no SERVIDOR (Windows), não no terminal.

O NfceTransmissor.php chama o TecnoSpeed via COM — ou seja, precisa de Windows + DLL registrada. O XAMPP/Apache no servidor instancia o objeto COM e o TecnoSpeed cuida da comunicação com a SEFAZ (assinar, transmitir, consultar).
text

Terminal (React/Electron)
     │ HTTP
     ▼
Servidor (XAMPP + PHP)
     │ COM
     ▼
TecnoSpeed v6.0 (DLL/ActiveX)  →  SEFAZ MT

3.2 — Estrutura de pastas

Do que você me passou, o TecnoSpeed usa 4 pastas em C:\WDS Comercial\:
text

C:\WDS Comercial\
├── Templates\vm60\         ; Templates de TXT (layout dos campos do XML)
├── Esquemas\vm60\          ; Schemas XSD da SEFAZ (validação)
├── certificado\            ; Certificado digital A1
│   └── cliente.pfx         (senha: 123)
├── NFCeGerada\             ; Saída — XMLs gerados organizados por data
│   └── AAAA\MM\DD\
│       ├── NFe*.txt        ; TXT de entrada
│       ├── *.xml           ; XML assinado
│       └── *.xml.ret       ; Retorno da SEFAZ
└── Log\                    ; Logs dos jobs

3.3 — Como o PHP conversa com o TecnoSpeed

Presumo que o NfceTransmissor.php faz algo como:
php

$tecnospeed = new COM('NFCex.spdNFCeX');
$tecnospeed->Configurar('C:\WDS Comercial\Templates\vm60\', 'C:\WDS Comercial\Esquemas\vm60\');
$tecnospeed->CarregarCertificado('C:\WDS Comercial\certificado\cliente.pfx', '123');
$resultado = $tecnospeed->Assinar('caminho\do\arquivo.txt');

Se você me mandar o NfceTransmissor.php, eu confirmo exatamente o que ele chama. Sem o arquivo, não tenho como garantir a sintaxe real.
3.4 — Registro da DLL (COM) no Windows

Se um dia reinstalar o servidor, a DLL do TecnoSpeed precisa ser registrada no Windows:
cmd

regsvr32 "C:\WDS Comercial\TecnoSpeed\NFCex.spdNFCeX.dll"

O ProgID NFCex.spdNFCeX fica no registro do Windows (HKCR\NFCex.spdNFCeX\CLSID). É por isso que o PHP consegue instanciar via new COM(...).
3.5 — Configuração do certificado digital

O certificado é A1 (arquivo .pfx, não o cartão A3). Fica em:
text

C:\WDS Comercial\certificado\cliente.pfx

Senha: 123 (nos testes).

Em produção, o ideal é:

    Usar um .pfx do emitente real (não o da Software House)

    Trocar a senha para algo forte

    Guardar com permissão restrita (só o usuário que roda o Apache pode ler)

3.6 — Software House vs Emitente

Você tem dois CNPJs envolvidos:
Papel	CNPJ	Para que serve
Software House	14234584000174	Identifica o desenvolvedor (você) na SEFAZ
Emitente	58717761000149	Empresa que emite a nota

O TecnoSpeed precisa dos dois configurados. O SH CNPJ + token vão no template vm60 — normalmente em param_nfce no banco (pnfce_software_house_cnpj, pnfce_token_sh).
3.7 — Onde ficam as configurações

Há 3 camadas de configuração hoje:
Camada	O que guarda	Onde
Banco	Ambiente, série, software house, token SH, CSC	param_nfce (tabela)
Arquivo	Caminho de templates, schemas, certificado	Provavelmente hardcoded ou em config.php do app_mesas_api
Windows Registry	ProgID da DLL COM	Registro do Windows (regsvr32)

Não sei de cor onde está cada caminho hardcoded. Me manda o NfceTransmissor.php que eu documento precisamente.
3.8 — Fluxo de emissão (resumo)
text

1. App (Electron) → POST /app/nfceEmitir
2. appController → NfceFiscal::prepararTudo()  (popula tabelas nfce_*)
3. appController → NfceGeradorTxt::gerar()     (gera TXT a partir das tabelas)
4. appController → NfceTransmissor::transmitir()
       │
       ├─ COM → TecnoSpeed.Assinar()          → XML assinado
       ├─ COM → TecnoSpeed.EnviarNFe()        → POST SEFAZ
       └─ COM → TecnoSpeed.ConsultarRecibo()  → resposta
5. Salva XML em C:\WDS Comercial\NFCeGerada\AAAA\MM\DD\
6. Atualiza tab_nfce.status_nfce = 3 (Autorizada) ou 4 (Rejeitada)

3.9 — O que confirmar comigo

Para eu fechar o manual de verdade, me manda:

    NfceTransmissor.php — o arquivo que faz a ponte com o COM

    NfceGeradorTxt.php — para saber se ele escreve TXT em disco ou passa direto pelo COM

    SHOW COLUMNS FROM param_nfce; + um SELECT * FROM param_nfce WHERE emp_codigo = 1; — para eu ver a configuração real (sem o token, pode mascarar)

    O conteúdo de um template em C:\WDS Comercial\Templates\vm60\ (só um arquivo .txt, o menor que tiver) — para eu documentar o formato

Com esses 4 eu escrevo o manual de verdade, com exemplos reais. Sem eles, o que fiz acima é um esqueleto baseado em convenções.