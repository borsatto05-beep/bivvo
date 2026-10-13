# PERFORMANCE REPORT — Bivvo 11.31

- O cálculo do digest ocorre no cliente nos mesmos pontos de sincronização já existentes.
- O cron continua horário, sem polling adicional no iPhone.
- Cada usuário recebe no máximo um aviso diário pelo cron atual.
- Badge é atualizado no mesmo evento push, sem nova requisição.
- Não foi adicionada biblioteca externa de push.
- Fluidez em iPhone físico: NÃO TESTADA neste ambiente.
