# Documentação do Banco de Dados

## Visão Geral

O sistema utiliza **Supabase** (PostgreSQL) como banco de dados, com as seguintes características:

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Storage** para upload de imagens
- **Auth** para autenticação do painel admin

---

## Estrutura das Tabelas

### profiles
Informações do perfil do usuário administrador.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| email | text | Email do usuário |
| nome | text | Nome completo |
| titulo | text | Título profissional |
| bio | text | Biografia |
| avatar_url | text | URL da foto de perfil |
| linkedin_url | text | Link do LinkedIn |
| github_url | text | Link do GitHub |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

---

### professional_history
Histórico profissional (experiências de trabalho).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| instituicao | text | Nome da empresa |
| titulo | text | Cargo/função |
| descricao | text | Descrição das atividades |
| data_inicio | date | Data de início |
| data_fim | date | Data de término (null se atual) |
| atual | boolean | Se é o emprego atual |
| local | text | Cidade/Estado |
| tipo_local | text | Presencial/Remoto/Híbrido |
| regime | text | CLT/PJ/Estágio |
| categoria_profissional | text | QA/DEV/INFRA/DEVOPS |
| logo_url | text | URL do logo da empresa |
| imagens_urls | text[] | Array de URLs de imagens |
| ordem | integer | Ordem de exibição |
| ativo | boolean | Se está ativo |

---

### academic_history
Histórico acadêmico (formações).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| instituicao | text | Nome da instituição |
| curso | text | Nome do curso |
| descricao | text | Descrição do curso |
| data_inicio | date | Data de início |
| data_fim | date | Data de conclusão |
| atual | boolean | Se está cursando |
| local | text | Cidade/Estado |
| tipo_local | text | Presencial/EAD/Híbrido |
| tipo_academico | text | Técnico/Bacharel/Lato Sensu |
| logo_url | text | URL do logo da instituição |
| imagens_urls | text[] | Array de URLs (certificados) |
| ordem | integer | Ordem de exibição |
| ativo | boolean | Se está ativo |

---

### projects
Projetos do portfólio.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| titulo | text | Nome do projeto |
| descricao_curta | text | Descrição resumida |
| descricao_completa | text | Descrição detalhada |
| categoria | text | Categoria (QA/DEV/etc) |
| tecnologias | text[] | Array de tecnologias |
| tags | text[] | Array de tags |
| funcionalidades | text[] | Lista de funcionalidades |
| conquistas | text[] | Resultados alcançados |
| imagem_url | text | Imagem de capa |
| link_projeto | text | URL do projeto |
| link_github | text | URL do repositório |
| data_projeto | date | Data do projeto |
| professional_history_id | uuid | FK para experiência |
| academic_history_id | uuid | FK para formação |
| ordem | integer | Ordem de exibição |
| ativo | boolean | Se está ativo |

---

### skills_tree
Árvore de habilidades (competências).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | text | Identificador único |
| nome | text | Nome da habilidade |
| descricao | text | Descrição |
| categoria | text | QA/DEV/DATA/DEVOPS/etc |
| nivel | integer | Nível de domínio (0-100) |
| icon | text | Classe do ícone Bootstrap |
| parent_id | text | ID do nó pai (hierarquia) |
| desbloqueado | boolean | Se está desbloqueado |
| ordem | integer | Ordem de exibição |

---

### achievements
Conquistas (certificações e marcos).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| titulo | text | Nome da conquista |
| descricao | text | Descrição |
| categoria | text | Categoria relacionada |
| imagem_url | text | Imagem/ícone da conquista |
| desbloqueado | boolean | Se foi conquistada |
| data_conquista | date | Data de obtenção |
| evidence | text | URL de evidência (link) |
| evidence_file | text | URL de arquivo de evidência |
| evidencias_urls | text[] | Array de evidências |
| ordem | integer | Ordem de exibição |

---

### contact_messages
Mensagens recebidas pelo formulário de contato.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| nome | text | Nome do remetente |
| email | text | Email do remetente |
| assunto | text | Assunto da mensagem |
| mensagem | text | Conteúdo da mensagem |
| lida | boolean | Se foi lida |
| created_at | timestamp | Data de recebimento |

---

## Políticas de Segurança (RLS)

Todas as tabelas possuem Row Level Security habilitado:

### Leitura Pública
```sql
-- Permite SELECT para todos (dados públicos do portfólio)
CREATE POLICY "Leitura pública" ON tabela
FOR SELECT USING (true);
```

### Escrita Restrita ao Admin
```sql
-- Permite INSERT/UPDATE/DELETE apenas para o email autorizado
CREATE POLICY "Admin pode gerenciar" ON tabela
FOR ALL USING (
  auth.jwt() ->> 'email' = 'seu-email@exemplo.com'
);
```

---

## Storage Buckets

| Bucket | Descrição | Acesso |
|--------|-----------|--------|
| projects | Imagens de projetos | Público |
| achievements | Imagens de conquistas | Público |
| evidences | Arquivos de evidências | Público |
| images | Logos e imagens gerais | Público |

---

## Índices Recomendados

```sql
-- Índices para melhor performance
CREATE INDEX idx_professional_history_data ON professional_history(data_inicio DESC);
CREATE INDEX idx_academic_history_data ON academic_history(data_inicio DESC);
CREATE INDEX idx_projects_categoria ON projects(categoria);
CREATE INDEX idx_skills_categoria ON skills_tree(categoria);
CREATE INDEX idx_achievements_desbloqueado ON achievements(desbloqueado);
```

---

## Backup

Recomenda-se configurar backups automáticos no painel do Supabase:
- **Project Settings** → **Database** → **Backups**
- Frequência sugerida: Diário

